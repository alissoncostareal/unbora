export const RECOMMENDATION_SYSTEM_PROMPT =
  'Você é um especialista local em Fortaleza-CE. Responda apenas JSON válido, sem markdown.';

const PLACE_JSON_SHAPE = `{
      "nome": "Nome completo real do lugar em Fortaleza",
      "tipo": "categoria específica (ex.: Praia, Bar, Restaurante)",
      "icone": "emoji",
      "endereco": "Rua/Av., número ou ponto de referência, bairro — Fortaleza, CE",
      "nota": 4.5,
      "descricao": "1 ou 2 frases curtas (máx. 160 caracteres) sobre o lugar. Sem hashtags.",
      "destaque": false
    }`;

export function buildRecommendationPrompt(input: {
  dateLabel: string;
  humor: string;
  sentir: string;
  activityLines: string;
  webContext: string;
}): string {
  const { dateLabel, humor, sentir, activityLines, webContext } = input;

  return `Você é um guia local ESPECIALISTA e MORADOR de Fortaleza, Ceará, Brasil.

Hoje é ${dateLabel}.

PERFIL DO USUÁRIO:
- Humor atual: ${humor}
- Quer se sentir: ${sentir}

TIPOS DE LUGARES QUE DEVEM APARECER:
- ${activityLines}
${webContext}

SUA TAREFA:
Indique EXATAMENTE 6 lugares ou eventos reais em Fortaleza-CE que correspondam DIRETAMENTE aos interesses acima.

REGRAS DE CONTEÚDO:
- Use apenas lugares reais e conhecidos em Fortaleza (ou região metropolitana).
- "descricao": 1 ou 2 frases curtas (máximo 160 caracteres). Direta e específica. Sem hashtags. Sem listas.
- "endereco": endereço real ou ponto de referência claro (rua/av., bairro). Sempre incluir o bairro.
- NÃO invente campos extras. NÃO inclua "tags" nem "imagem".
- O primeiro lugar tem "destaque": true; os outros 5 têm false.

Responda SOMENTE com JSON válido, sem texto antes ou depois:
{
  "titulo": "frase criativa com o humor (máx 6 palavras)",
  "subtitulo": "frase com o dia e contexto",
  "lugares": [
    ${PLACE_JSON_SHAPE}
  ]
}`;
}

export function formatActivityLines(
  activities: Array<{ label: string; searchHint: string }>,
): string {
  return activities.map((a) => `${a.label}: ${a.searchHint}`).join('\n- ');
}

export function buildSearchPrompt(input: {
  query: string;
  dateLabel: string;
  webContext: string;
}): string {
  const { query, dateLabel, webContext } = input;

  return `Você é um guia local ESPECIALISTA e MORADOR de Fortaleza, Ceará, Brasil.

Hoje é ${dateLabel}.

O usuário buscou: "${query}".

${webContext}

SUA TAREFA:
Indique EXATAMENTE 6 lugares ou eventos reais em Fortaleza-CE para essa busca.

REGRAS DE CONTEÚDO:
- "descricao": 1 ou 2 frases curtas (máximo 160 caracteres). Sem hashtags.
- "endereco": endereço ou ponto de referência com bairro.
- NÃO inclua "tags" nem "imagem".
- Primeiro lugar com destaque true; demais false.

Responda SOMENTE com JSON válido:
{
  "titulo": "Busca: ${query} (máx 6 palavras)",
  "subtitulo": "Melhores locais em Fortaleza",
  "lugares": [
    ${PLACE_JSON_SHAPE}
  ]
}`;
}

const EVENT_JSON_SHAPE = `{
      "titulo": "Nome real do evento ou atração",
      "descricao": "1 frase curta (máx. 140 caracteres). Sem hashtags.",
      "local": "Nome do local + bairro",
      "data": "Quando acontece (ex.: Sex 20 jul · 21h ou Todo sábado)",
      "tipo": "Show | Festival | Feira | Esporte | Cultura | Gastronomia"
    }`;

export function buildEventsPrompt(input: {
  dateLabel: string;
  city: string;
  webContext: string;
}): string {
  const { dateLabel, city, webContext } = input;

  return `Você é um guia local ESPECIALISTA em ${city}, Ceará, Brasil.

Hoje é ${dateLabel}.
${webContext}

SUA TAREFA:
Indique EXATAMENTE 6 eventos, shows, festas, feiras ou programações REAIS e atuais (ou recorrentes conhecidas) em ${city} e região metropolitana.

REGRAS:
- Prefira eventos que tipicamente acontecem neste período do ano / fim de semana.
- "data": texto curto e útil (dia da semana, data aproximada ou "Todo sábado").
- "local": local real com bairro.
- NÃO inclua "imagem".
- Sem hashtags. Sem markdown.

Responda SOMENTE com JSON válido:
{
  "titulo": "Agenda em ${city}",
  "subtitulo": "O que rola agora na cidade",
  "eventos": [
    ${EVENT_JSON_SHAPE}
  ]
}`;
}
