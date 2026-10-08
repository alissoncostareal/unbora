# Backlog principal — Unbora

Direção do produto: consumer premium, calmo, editorial, mobile-first e centrado na pessoa. Não é um dashboard SaaS e não é um chatbot.

Este arquivo é a lista de implementação. O que já existe no código está marcado. O restante é o trabalho à frente.

Legenda: `[x]` existe, `[~]` existe em parte, `[ ]` ainda não.

## Decisões

- O fluxo de recomendação do MVP é síncrono. Kafka fica para depois, mesmo que já haja dependência no backend.
- RAG com pgvector fica para depois. Não é fonte da verdade.
- A fonte da verdade de lugar, evento, endereço, preço, horário, URL e Place ID é Google Places, APIs de eventos e o banco próprio.
- O LLM só ranqueia e explica entidades que o backend já entregou. Não pode inventar lugar, evento, endereço, preço, horário, URL ou Place ID.
- A aplicação não fala direto com um modelo. Passa por um `AIProvider`, com Ollama, OpenAI e Grok atrás dessa interface.
- O controller não fala com o Google. Passa por um `PlacesService`.
- Eventos entram por um `EventProvider`, para caber mais de uma fonte depois.
- Interface não nasce de um pedido genérico de “UI moderna”. A direção visual abaixo é a especificação.

## 1. Produto — experiência

### Jornada

- [ ] Landing page
- [~] Formulário de descoberta em etapas (hoje a home já é a jornada, sem landing)
- [~] Seleção de humor (hoje: “Como você está hoje?”)
- [ ] Seleção de objetivo
- [~] Seleção de temas e interesses
- [ ] Seleção de tipo de experiência
- [~] Orçamento (hoje: faixas, não slider)
- [ ] Distância máxima escolhida pela pessoa (hoje o raio sai do tempo, sem controle de raio)
- [~] Tempo disponível (opções atuais diferentes das desta spec)
- [ ] Horário e data
- [x] Preferência social: sozinho, casal, amigos, família, conhecer pessoas
- [ ] Preferência de ambiente: tranquilo, moderado, movimentado

### Resultado

- [~] Tela de processamento (hoje o botão fica em “Buscando”, sem tela própria)
- [x] Tela de resultado
- [~] Lista de recomendações (hoje até 6, com foto; a spec pede 3 experiências)
- [~] Mapa (hoje só link para o Google Maps)
- [x] Fotos reais dos locais
- [~] Motivo personalizado (usa a descrição do lugar quando ela é texto de verdade)
- [~] Pontuação de compatibilidade (hoje derivada da nota e do encaixe com os interesses, não do motor descrito abaixo)
- [ ] Filtros e refinamento
- [x] Refazer recomendação
- [ ] “Não gostei”
- [ ] Compartilhar recomendação
- [ ] URL pública da recomendação
- [ ] Histórico das recomendações
- [ ] Perfil de preferências

### Formulário, etapa a etapa

Cada etapa é uma experiência curta, com cards grandes e pouco texto. Não é um formulário.

1. **Como você quer se sentir depois de sair?** Cards grandes. Pouco texto.
2. **O que combina com você hoje?** Cafés, música, natureza, gastronomia, cultura, games, praia, cinema.
3. **Como você quer passar esse tempo?** Sozinho, a dois, com amigos, com família, conhecendo pessoas.
4. **Quanto quer gastar?** Slider de R$ 0 a R$ 300+, com o valor atual visível (exemplo: R$ 80).
5. **Quanto tempo você tem?** 30 min, 1h, 2h, 3h+.
6. **Onde você está?** Localização e raio.

### Tela de resultado

Não é uma grade de cards. Abre com uma frase do momento e a quantidade encontrada.

Exemplo:

> Seu momento pede algo mais tranquilo.
>
> Encontramos 3 experiências que combinam com você.

Cada experiência: foto grande, nome, percentual (“94% combina com você”), ambiente, estimativa de preço, distância, aberto agora.

Depois, **Por que escolhemos isso?** com uma explicação que usa as escolhas reais da pessoa, o raio e o horário, sem inventar dado que a API não devolveu.

## 2. Backend

Stack alvo:

- [x] Java 21
- [x] Spring Boot 3
- [x] Spring Web
- [x] Spring Validation
- [x] Spring Data JPA
- [x] PostgreSQL
- [ ] Flyway
- [ ] Redis
- [x] Spring Security
- [x] OpenAPI / Swagger
- [ ] Tratamento global de erros
- [ ] Log estruturado
- [ ] Actuator
- [ ] Micrometer

### Domínio

Entidades a criar:

- [ ] User
- [ ] UserPreference
- [ ] Mood
- [ ] Interest
- [ ] Recommendation
- [ ] RecommendationItem
- [ ] Place
- [ ] Event
- [ ] SearchSession
- [ ] Feedback

O código de hoje tem usuários, eventos e lugares no pipeline de recomendação. Esse modelo ainda não é o domínio acima.

## 3. Motor de recomendação

- [ ] `RecommendationEngine`

Responsável por:

- interpretar preferências
- calcular filtros
- buscar candidatos
- eliminar candidatos incompatíveis
- calcular score
- enviar candidatos para o LLM
- receber o ranking
- validar a resposta do LLM
- gerar o resultado final

O score considera:

- compatibilidade de humor
- match de interesse
- distância
- orçamento
- horário de funcionamento
- nota
- preferência social
- tipo de atividade
- clima
- tempo disponível

Hoje o pipeline em `RecommendationsService` já busca lugares e chama o modelo. Ainda não é esse motor, e o percentual da interface não usa esses fatores.

## 4. IA

- [ ] `AIProvider`
  - [ ] `OllamaProvider`
  - [ ] `OpenAIProvider`
  - [ ] `GrokProvider`
- [ ] Extração de intenção
- [ ] Saída estruturada
- [ ] Ranking da recomendação
- [ ] Explicação da recomendação
- [ ] Versão de prompt
- [ ] Métricas de token e latência
- [ ] Provider de fallback
- [ ] Timeout
- [ ] Retry
- [ ] Circuit breaker

Hoje a chamada vai direto ao Groq.

Regra crítica: o LLM nunca inventa lugar, evento, endereço, preço, horário, URL ou Place ID. Só trabalha com entidades que o backend forneceu. A resposta é validada antes de ir para a interface. Dado ausente some da tela. Não é preenchido pelo modelo.

## 5. RAG

Fazer depois do fluxo síncrono. Já existe um início com pgvector no backend. A regra deste backlog continua valendo: RAG não é fonte da verdade.

- [~] pgvector
- [~] embeddings
- [ ] indexação das informações dos lugares
- [ ] indexação dos eventos
- [ ] recuperação semântica
- [ ] filtro por metadata
- [ ] ranking híbrido

RAG contextualiza e acha candidatos. A verdade continua em Google Places, APIs de eventos e no banco próprio.

## 6. Google Places

- [~] Text Search
- [~] Nearby Search
- [~] Place Details
- [~] Place Photos
- [~] Place ID
- [~] horário de funcionamento
- [~] rating
- [~] endereço
- [~] categorias
- [~] localização
- [ ] cache de resultados
- [ ] `PlacesService` (controller não chama o Google)

## 7. Eventos

- [ ] `EventProvider`
  - [ ] ProviderA
  - [ ] ProviderB
  - [ ] ProviderC

Há um módulo de eventos. Ainda não há essa abstração de provedores.

## 8. Kafka

Fora do MVP. Primeiro o fluxo síncrono. A dependência `spring-kafka` já está no projeto e não entra no caminho crítico até esta fase.

Tópicos, quando chegar a hora:

- `recommendation.requested`
- `recommendation.generated`
- `recommendation.feedback`
- `place.updated`
- `user.preference.updated`

Consumers:

- `RecommendationConsumer`
- `AnalyticsConsumer`
- `PreferenceConsumer`
- `NotificationConsumer`

## 9. Redis

- [ ] cache de Places
- [ ] cache de recomendações
- [ ] sessões
- [ ] rate limiting
- [ ] idempotência
- [ ] dados temporários

## 10. AWS

Só depois que o produto funcionar localmente.

- [ ] S3
- [ ] CloudFront
- [ ] RDS
- [ ] CloudWatch
- [ ] Secrets Manager

O VPS pode continuar com Ollama, K3s, Kafka, Redis e observabilidade. Arquitetura híbrida.

## 11. Observabilidade

Prometheus alimenta o Grafana. Logs no Loki.

Métricas:

- [ ] `recommendation_requests`
- [ ] `recommendation_latency`
- [ ] `llm_latency`
- [ ] `llm_tokens`
- [ ] `llm_errors`
- [ ] `places_api_latency`
- [ ] `places_api_errors`
- [ ] `cache_hit_ratio`
- [ ] `recommendation_success_rate`
- [ ] `user_feedback`

## 12. Segurança

- [ ] rate limiting da API
- [x] chaves de API só no backend
- [x] segredos por ambiente (`.env`, fora do git)
- [~] CORS
- [x] validação de entrada
- [ ] proteção contra prompt injection
- [x] não expor a chave do Google no cliente
- [ ] sanitização da resposta do LLM
- [ ] timeout em API externa
- [ ] circuit breaker

## 13. Design

Visual: calmo, editorial, premium, mobile-first, humano.

Não usar:

- dashboard
- sidebar
- grade de muitos cards
- gradiente roxo
- glassmorphism exagerado
- neon
- excesso de sombra
- botões gigantes
- visual genérico de startup de IA

A tela inicial é uma pergunta grande, com uma linha curta de apoio e poucos cards grandes. Ícones ou ilustração sofisticada no lugar de emoji. Cada etapa responde uma coisa só.

No desktop, a mesma jornada em uma coluna mais larga. Não vira painel.

O resultado é a tela mais importante: frase do momento, três experiências, foto grande, metadado curto e o bloco “Por que escolhemos isso?”.
