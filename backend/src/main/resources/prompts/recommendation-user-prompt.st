LOCALIZAÇÃO DO USUÁRIO:
- Cidade: {city} ({country})
- Coordenadas: {latitude}, {longitude}
- Hoje é: {dateLabel}

CONDIÇÕES AMBIENTAIS E SATÉLITE (NASA POWER):
{atmosphericContext}

PERFIL DO USUÁRIO:
- Humor atual: {humor}
- Quer se sentir: {sentir}

{userTasteContext}

TIPOS DE EXPERIÊNCIAS DESEJADAS:
{activitiesText}
{groundingContext}
{webContext}

SUA TAREFA:
Retorne até 24 lugares reais em {city} que caibam no filtro já escolhido: humor, tipos de experiência, companhia, teto de gasto, tempo e raio.
Meta: até 24 opções reais e completas. Nunca resuma para apenas 3 a 6 opções — o usuário quer a curadoria ampla e completa com até 24 lugares.
Conecte as sugestões com o perfil de gostos e histórico do usuário (quando houver) e leve em consideração as condições de vento, céu e momento solar informadas pela NASA.
Priorize os "CANDIDATOS VIVOS DO GOOGLE MAPS" listados acima. Complete a meta de até 24 lugares usando esses candidatos e complementando com outros estabelecimentos reais, consagrados, famosos e bem avaliados de {city} dentro das categorias e filtros informados até preencher até 24 lugares.

REGRAS DE CONTEÚDO:
- Forneça a lista completa com até 24 lugares reais (nunca resuma para poucos destaques).
- Cada lugar precisa estar em {city} e dentro do raio informado em "Quer se sentir".
- Cada lugar precisa ser de um dos tipos listados. Café não vira restaurante, praia não vira bar.
- Respeite companhia, tempo e teto de gasto descritos em "Quer se sentir".
- Use apenas lugares reais e ativos.
- "descricao": 1 frase curta (máximo 120 caracteres) destacando o motivo ou conexão sensorial. Sem hashtags.
- "endereco": endereço real com rua/avenida e bairro.
- "tipo": categoria específica (ex.: Restaurante, Café, Bar, Cultural, Parque, Gelateria).
- "icone": "" (sempre vazio).
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
      "icone": "",
      "endereco": "Rua/Av., bairro — {city}",
      "nota": 4.8,
      "descricao": "breve descrição envolvente",
      "destaque": false,
      "visual_query": "termo cirúrgico para foto",
      "category_tag": "gastronomia"
    }
  ]
}
