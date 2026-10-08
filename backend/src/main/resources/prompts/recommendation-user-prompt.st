LOCALIZAÇÃO DO USUÁRIO:
- Cidade: {city} ({country})
- Coordenadas: {latitude}, {longitude}
- Hoje é: {dateLabel}

PERFIL DO USUÁRIO:
- Humor atual: {humor}
- Quer se sentir: {sentir}

TIPOS DE EXPERIÊNCIAS DESEJADAS:
{activitiesText}
{groundingContext}
{webContext}

SUA TAREFA:
Retorne lugares reais em {city} que caibam no filtro já escolhido: humor, tipos de experiência, companhia, teto de gasto, tempo e raio.
Use somente os "CANDIDATOS VIVOS DO GOOGLE MAPS". Não invente outra categoria para completar a lista.

REGRAS DE CONTEÚDO:
- Cada lugar precisa estar em {city} e dentro do raio informado em "Quer se sentir".
- Cada lugar precisa ser de um dos tipos listados. Café não vira restaurante, praia não vira bar.
- Respeite companhia, tempo e teto de gasto descritos em "Quer se sentir".
- Use apenas lugares reais e ativos.
- "descricao": 1 frase curta (máximo 120 caracteres). Sem hashtags.
- "endereco": endereço real com rua/avenida e bairro.
- "tipo": categoria específica (ex.: Restaurante, Café, Bar, Cultural, Parque, Gelateria).
- "icone": 1 emoji representativo.
- "nota": número de 4.2 a 5.0.
- "visual_query": termo de busca fotográfica cirúrgico da fachada/ambiente (ex: "Fachada {city}").
- "category_tag": gastronomia | praia | show | cultura | bar | natureza
- O primeiro lugar tem "destaque": true; os demais têm false.

Responda SOMENTE com JSON válido:
{
  "titulo": "frase criativa com o humor (máx 6 palavras)",
  "subtitulo": "frase com o dia e contexto em {city}",
  "lugares": [
    {
      "nome": "Nome completo real do lugar",
      "tipo": "categoria",
      "icone": "emoji",
      "endereco": "Rua/Av., bairro — {city}",
      "nota": 4.8,
      "descricao": "breve descrição envolvente",
      "destaque": false,
      "visual_query": "termo cirúrgico para foto",
      "category_tag": "gastronomia"
    }
  ]
}
