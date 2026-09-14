import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  buildEventsPrompt,
  buildRecommendationPrompt,
  buildSearchPrompt,
  formatActivityLines,
  RECOMMENDATION_SYSTEM_PROMPT,
} from './recommendations.prompt';
import {
  DiscoverEventsDto,
  DiscoverEventsResult,
  RecommendationResult,
  RecommendDto,
  SearchDto,
} from './recommendations.types';

/** Preferir qualidade estável; fallbacks se rate-limit / modelo indisponível. Override: GROQ_MODEL */
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
const GROQ_MODEL_FALLBACKS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
];

@Injectable()
export class RecommendationsService {
  async recommend(dto: RecommendDto): Promise<RecommendationResult> {
    const groqKey = process.env.GROQ_API_KEY;
    const braveKey = process.env.BRAVE_API_KEY;

    if (!groqKey?.trim()) {
      throw new InternalServerErrorException('GROQ_API_KEY não configurada');
    }

    const hoje = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const mesAno = new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    const activityLines = formatActivityLines(dto.activities);
    const activityLabels = dto.activities.map((activity) => activity.label);

    const contextoReal = braveKey
      ? await this.fetchBraveContext(activityLabels, mesAno, braveKey)
      : '';

    const prompt = buildRecommendationPrompt({
      dateLabel: hoje,
      humor: dto.humor,
      sentir: dto.sentir,
      activityLines,
      webContext: contextoReal,
    });

    const parsed = await this.callGroqJson<RecommendationResult>(groqKey, prompt, {
      temperature: 0.7,
      maxTokens: 2800,
    });
    return this.enrichPlaces(parsed);
  }

  async search(dto: SearchDto): Promise<RecommendationResult> {
    const groqKey = process.env.GROQ_API_KEY;
    const braveKey = process.env.BRAVE_API_KEY;

    if (!groqKey?.trim()) {
      throw new InternalServerErrorException('GROQ_API_KEY não configurada');
    }

    const hoje = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const mesAno = new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    const contextoReal = braveKey
      ? await this.fetchBraveContext([dto.query], mesAno, braveKey)
      : '';

    const prompt = buildSearchPrompt({
      query: dto.query,
      dateLabel: hoje,
      webContext: contextoReal,
    });

    const parsed = await this.callGroqJson<RecommendationResult>(groqKey, prompt, {
      temperature: 0.7,
      maxTokens: 2800,
    });
    return this.enrichPlaces(parsed);
  }

  async discoverEvents(dto: DiscoverEventsDto): Promise<DiscoverEventsResult> {
    const groqKey = process.env.GROQ_API_KEY;
    const braveKey = process.env.BRAVE_API_KEY;
    const city = dto.city?.trim() || 'Fortaleza';

    if (!groqKey?.trim()) {
      throw new InternalServerErrorException('GROQ_API_KEY não configurada');
    }

    const hoje = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const mesAno = new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    const contextoReal = braveKey
      ? await this.fetchBraveContext(
          [`eventos agenda shows ${city}`],
          mesAno,
          braveKey,
        )
      : '';

    const prompt = buildEventsPrompt({
      dateLabel: hoje,
      city,
      webContext: contextoReal,
    });

    const parsed = await this.callGroqJson<DiscoverEventsResult>(groqKey, prompt, {
      temperature: 0.65,
      maxTokens: 2400,
    });
    return this.enrichEvents(parsed, city);
  }

  private getGroqModels(): string[] {
    const preferred = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
    return [...new Set([preferred, ...GROQ_MODEL_FALLBACKS])];
  }

  private async callGroqJson<T>(
    groqKey: string,
    prompt: string,
    options: { temperature: number; maxTokens: number },
  ): Promise<T> {
    const models = this.getGroqModels();
    let lastMessage = 'Erro na API do Groq';

    for (const model of models) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: RECOMMENDATION_SYSTEM_PROMPT },
                { role: 'user', content: prompt },
              ],
              temperature: options.temperature,
              max_tokens: options.maxTokens,
              response_format: { type: 'json_object' },
            }),
          },
        );

        if (response.ok) {
          const data = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const raw = data.choices?.[0]?.message?.content || '';
          const parsed = this.parseJsonObject<T>(raw);
          if (parsed) {
            return parsed;
          }

          lastMessage = 'Formato de resposta inválido da IA';
          // JSON quebrado — tenta de novo / próximo modelo
          continue;
        }

        const err = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        lastMessage = err.error?.message || lastMessage;

        const modelMissing =
          /does not exist|do not have access|model_not_found|decommissioned|retired/i.test(
            lastMessage,
          );
        if (modelMissing) {
          break; // tenta próximo modelo
        }

        const retryMatch = lastMessage.match(/try again in ([\d.]+)s/i);
        const isRateLimit =
          response.status === 429 || /rate limit/i.test(lastMessage);

        if (!isRateLimit || attempt === 2) {
          if (isRateLimit) {
            // TPM esgotado neste modelo — tenta o próximo da lista
            break;
          }
          throw new ServiceUnavailableException(lastMessage);
        }

        const waitMs = retryMatch
          ? Math.min(Math.ceil(Number(retryMatch[1]) * 1000) + 250, 25_000)
          : 1500 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    throw new ServiceUnavailableException(
      /rate limit/i.test(lastMessage)
        ? 'A IA está momentaneamente ocupada. Espere ~20s e tente de novo.'
        : lastMessage,
    );
  }

  private parseJsonObject<T>(raw: string): T | null {
    const clean = raw.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end <= start) return null;

    try {
      return JSON.parse(clean.slice(start, end + 1)) as T;
    } catch {
      // Tentativa leve: remover trailing commas comuns em JSON gerado por LLM
      const repaired = clean
        .slice(start, end + 1)
        .replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(repaired) as T;
      } catch {
        return null;
      }
    }
  }

  private async enrichEvents(
    result: DiscoverEventsResult,
    city: string,
  ): Promise<DiscoverEventsResult> {
    const braveKey = process.env.BRAVE_API_KEY?.trim();
    const googleKey = this.getGooglePlacesKey();
    const eventos = result.eventos ?? [];

    const enriched = await Promise.all(
      eventos.map(async (event) => {
        const local = event.local?.trim() || city;
        const titulo = event.titulo?.trim() || local;

        let googleImage: string | undefined;
        if (googleKey) {
          googleImage =
            (await this.fetchGooglePlaceImage(
              titulo,
              `${local}, ${city}`,
              googleKey,
            )) ||
            (await this.fetchGooglePlaceImage(
              local,
              `${local}, ${city}`,
              googleKey,
            ));
        }

        const braveImage =
          !googleImage && braveKey
            ? await this.fetchBravePlaceImage(titulo, event.tipo, braveKey)
            : undefined;

        return {
          ...event,
          descricao: this.shortenDescription(event.descricao, 140),
          local,
          imagem: googleImage || braveImage || undefined,
        };
      }),
    );

    return {
      titulo: result.titulo || `Agenda em ${city}`,
      subtitulo: result.subtitulo || 'Sugestões atualizadas pela IA',
      eventos: enriched,
    };
  }

  private async enrichPlaces(
    result: RecommendationResult,
  ): Promise<RecommendationResult> {
    const braveKey = process.env.BRAVE_API_KEY?.trim();
    const googleKey = this.getGooglePlacesKey();
    const lugares = result.lugares ?? [];

    const enriched = await Promise.all(
      lugares.map(async (place) => {
        const endereco =
          place.endereco?.trim() ||
          this.addressFromTags(place.tags) ||
          `${place.nome}, Fortaleza, CE`;

        const googleImage = googleKey
          ? await this.fetchGooglePlaceImage(place.nome, endereco, googleKey)
          : undefined;

        const braveImage =
          !googleImage && braveKey
            ? await this.fetchBravePlaceImage(place.nome, place.tipo, braveKey)
            : undefined;

        return {
          ...place,
          endereco,
          descricao: this.shortenDescription(place.descricao),
          tags: undefined,
          imagem: googleImage || braveImage || undefined,
        };
      }),
    );

    return { ...result, lugares: enriched };
  }

  private getGooglePlacesKey(): string | undefined {
    return (
      process.env.GOOGLE_PLACES_API_KEY?.trim() ||
      process.env.GOOGLE_MAPS_API_KEY?.trim() ||
      undefined
    );
  }

  /**
   * Foto oficial do lugar via Places API (New):
   * tenta várias queries (nome, endereço, sem acento) e escolhe o melhor match.
   */
  private async fetchGooglePlaceImage(
    nome: string,
    endereco: string,
    apiKey: string,
  ): Promise<string | undefined> {
    const queries = this.buildPlaceImageQueries(nome, endereco);

    for (const textQuery of queries) {
      const photoUri = await this.searchGooglePlacePhoto(textQuery, nome, apiKey);
      if (photoUri) return photoUri;
    }
    return undefined;
  }

  private buildPlaceImageQueries(nome: string, endereco: string): string[] {
    const name = nome.replace(/\s+/g, ' ').trim();
    const address = endereco.replace(/\s+/g, ' ').trim();
    const nameKey = this.normalizePlaceText(name).slice(0, 12);
    const addressAlreadyHasName =
      Boolean(nameKey) && this.normalizePlaceText(address).includes(nameKey);

    const queries = [
      `${name} Fortaleza`,
      `${name}, Fortaleza, CE`,
      this.stripAccents(`${name} Fortaleza`),
    ];

    if (address && addressAlreadyHasName) {
      queries.push(address);
    } else if (address) {
      queries.push(`${name}, ${address}`);
    }

    return [...new Set(queries.filter((q) => q.length > 3))];
  }

  private normalizePlaceText(value: string): string {
    return this.stripAccents(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private stripAccents(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private async searchGooglePlacePhoto(
    textQuery: string,
    preferredName: string,
    apiKey: string,
  ): Promise<string | undefined> {
    try {
      const searchResponse = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.photos',
          },
          body: JSON.stringify({
            textQuery,
            languageCode: 'pt-BR',
            regionCode: 'BR',
            maxResultCount: 5,
            locationBias: {
              circle: {
                center: { latitude: -3.7319, longitude: -38.5267 },
                radius: 45000.0,
              },
            },
          }),
        },
      );

      if (!searchResponse.ok) {
        if (process.env.NODE_ENV !== 'production') {
          const errText = await searchResponse.text().catch(() => '');
          console.warn(
            '[Places] searchText',
            searchResponse.status,
            textQuery,
            errText.slice(0, 160),
          );
        }
        return undefined;
      }

      const searchData = (await searchResponse.json()) as {
        places?: Array<{
          id?: string;
          displayName?: { text?: string };
          photos?: Array<{ name?: string }>;
        }>;
      };

      const preferred = this.normalizePlaceText(preferredName);
      const preferredTokens = preferred
        .split(' ')
        .filter((token) => token.length > 2 && !['fortaleza', 'parque', 'the'].includes(token));

      const ranked = (searchData.places ?? [])
        .map((item) => {
          const photoName = item.photos?.find((photo) => photo.name)?.name;
          if (!photoName) return null;
          const display = this.normalizePlaceText(item.displayName?.text ?? '');
          let score = 1;
          for (const token of preferredTokens) {
            if (display.includes(token)) score += 3;
          }
          if (preferred && display.includes(preferred.split(' ')[0] ?? '')) score += 2;
          return { photoName, score };
        })
        .filter((item): item is { photoName: string; score: number } => Boolean(item))
        .sort((a, b) => b.score - a.score);

      const photoName = ranked[0]?.photoName;
      if (!photoName) return undefined;

      const mediaResponse = await fetch(
        `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=900&maxWidthPx=1200&skipHttpRedirect=true`,
        {
          headers: { 'X-Goog-Api-Key': apiKey },
        },
      );

      if (!mediaResponse.ok) {
        return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=900&maxWidthPx=1200&key=${encodeURIComponent(apiKey)}`;
      }

      const mediaData = (await mediaResponse.json()) as { photoUri?: string };
      return mediaData.photoUri || undefined;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Places] fetch image failed', textQuery, error);
      }
      return undefined;
    }
  }

  private shortenDescription(value?: string, max = 160): string {
    const text = (value ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    if (text.length <= max) return text;
    const cut = text.slice(0, Math.max(0, max - 3));
    const lastSpace = cut.lastIndexOf(' ');
    const minKeep = Math.floor(max * 0.5);
    return `${(lastSpace > minKeep ? cut.slice(0, lastSpace) : cut).trim()}…`;
  }

  private addressFromTags(tags?: string[]): string | undefined {
    if (!tags?.length) return undefined;
    const cleaned = tags
      .map((tag) => tag.replace(/^#/, '').trim())
      .filter(Boolean);
    if (!cleaned.length) return undefined;
    return `${cleaned.join(' · ')}, Fortaleza, CE`;
  }

  private async fetchBravePlaceImage(
    nome: string,
    tipo: string | undefined,
    braveKey: string,
  ): Promise<string | undefined> {
    const cleanName = nome.trim();
    const queries = [
      `"${cleanName}" Fortaleza`,
      `"${cleanName}" Fortaleza ${tipo ?? ''}`.trim(),
      `${cleanName} Fortaleza CE local`,
    ];

    for (const query of queries) {
      const url = await this.searchBraveImage(query, cleanName, braveKey);
      if (url) return url;
    }
    return undefined;
  }

  private async searchBraveImage(
    query: string,
    placeName: string,
    braveKey: string,
  ): Promise<string | undefined> {
    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=12&search_lang=pt&country=BR&safesearch=strict`,
        {
          headers: {
            Accept: 'application/json',
            'X-Subscription-Token': braveKey,
          },
        },
      );
      if (!response.ok) return undefined;

      const data = (await response.json()) as {
        results?: Array<{
          title?: string;
          url?: string;
          source?: string;
          properties?: { url?: string };
        }>;
      };

      const scored = (data.results ?? [])
        .map((item) => {
          const url = item.properties?.url || item.url;
          if (!url || !/^https?:\/\//i.test(url)) return null;
          if (this.isBadImageHost(url)) return null;
          const score = this.scoreImageMatch(placeName, item.title, item.source, url);
          return score > 0 ? { url, score } : null;
        })
        .filter((item): item is { url: string; score: number } => Boolean(item))
        .sort((a, b) => b.score - a.score);

      return scored[0]?.url;
    } catch {
      return undefined;
    }
  }

  private scoreImageMatch(
    placeName: string,
    title?: string,
    source?: string,
    url?: string,
  ): number {
    const haystack = `${title ?? ''} ${source ?? ''} ${url ?? ''}`.toLowerCase();
    const tokens = placeName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2);

    if (!tokens.length) return 0;

    let matched = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) matched += 1;
    }

    // Exige pelo menos metade dos tokens do nome (ou 2, o que for menor)
    const minMatch = Math.min(2, tokens.length);
    if (matched < minMatch) return 0;

    let score = matched * 10;
    if (haystack.includes('fortaleza')) score += 3;
    if (/(tripadvisor|googleusercontent|maps|wikipedia|wikimedia|instagram|sympla|opovo|diariodonordeste)/i.test(haystack)) {
      score += 4;
    }
    return score;
  }

  private isBadImageHost(url: string): boolean {
    return /(unsplash\.com|pexels\.com|pixabay\.com|shutterstock\.com|gettyimages|istockphoto|dreamstime|depositphotos|freepik|alamy)/i.test(
      url,
    );
  }

  private async fetchBraveContext(
    activityLabels: string[],
    mesAno: string,
    braveKey: string,
  ): Promise<string> {
    try {
      const queryTerms = activityLabels.join(' ');
      const queries = [
        `site:viverfortal.com.br agenda eventos ${mesAno}`,
        `site:fortaleza.ce.gov.br agenda cultural eventos ${mesAno}`,
        `site:opovo.com.br agenda Fortaleza ${mesAno} ${queryTerms}`,
        `site:diariodonordeste.com.br eventos shows Fortaleza ${mesAno}`,
        `site:sympla.com.br eventos Fortaleza ${mesAno} ${queryTerms}`,
        `${queryTerms} Fortaleza CE agenda ${mesAno} ingressos`,
      ];

      const buscas = await Promise.all(
        queries.map((q) =>
          fetch(
            `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=6&lang=pt&country=BR&freshness=pm`,
            {
              headers: {
                Accept: 'application/json',
                'X-Subscription-Token': braveKey,
              },
            },
          )
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ),
      );

      const resultados = buscas
        .filter(Boolean)
        .flatMap((b) => (b as { web?: { results?: Array<{ url: string; title: string; description: string }> } }).web?.results || [])
        .slice(0, 20)
        .map((r) => `FONTE: ${r.url}\nTÍTULO: ${r.title}\nDESCRIÇÃO: ${r.description}`)
        .join('\n---\n');

      if (!resultados) return '';
      return `\n\n=== DADOS REAIS DA INTERNET ===\n${resultados}\n=== FIM DOS DADOS ===`;
    } catch {
      return '';
    }
  }
}
