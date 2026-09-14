LOCALIZAÇÃO: {city} ({country})
Hoje é {dateLabel}.
O usuário buscou: "{query}".

{groundingContext}
{webContext}

SUA TAREFA:
Retorne até 24 lugares reais em {city} para a busca "{query}".
Priorize os "CANDIDATOS VIVOS DO GOOGLE MAPS" e preencha até o limite de 24.
Meta: até 24 opções.

REGRAS:
- Não resuma para poucos destaques — o usuário quer a lista completa.
- "descricao": 1 frase curta (máximo 120 caracteres). Sem hashtags.
- "endereco": endereço ou ponto de referência com bairro.
- "tipo": categoria específica.
- "icone": 1 emoji representativo.
- "nota": número de 4.0 a 5.0.
- "visual_query": termo de busca fotográfica.
- "category_tag": gastronomia | praia | show | cultura | bar | natureza
- Primeiro lugar com destaque true; demais false.

Responda SOMENTE com JSON válido:
{
  "titulo": "Busca: {query}",
  "subtitulo": "Melhores opções em {city}",
  "lugares": [
    {
      "nome": "Nome real",
      "tipo": "categoria",
      "icone": "emoji",
      "endereco": "Endereço com bairro, {city}",
      "nota": 4.7,
      "descricao": "breve descrição",
      "destaque": false,
      "visual_query": "termo para foto",
      "category_tag": "cultura"
    }
  ]
}
