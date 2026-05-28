# Refatoração do Frontend para Nova Arquitetura de Scores

Este plano de implementação visa refatorar os scripts de client-side (Vanilla JS) e os Controllers TypeScript do WebServer para a nova API orientada a Scores, implementando o sistema de High Scores e Presença Rica (Rich Presence), ao mesmo tempo em que padronizando o código para as novas regras de formatação.

## User Review Required

- **[IMPORTANT]** Como não devemos alterar as variáveis enviadas para o Pug ou quebrar suas referências (como a iteração do `saves.data`), o `playerController` mapeará a resposta de `/player/:playerId/scores` artificialmente para recriar o objeto `saves` com `game` e `data` (sendo `score` e `sessionTimeInSeconds`) para ser lido com sucesso pela view existente.
- **[IMPORTANT]** O script `gamePage.js` precisará extrair o `gameId` da URL (`/game/:gameId`) para fazer um GET assíncrono para `/leaderboard/:gameId` direto do frontend e construir a tabela de recordes e injetar na DOM, já que o backend agora suporta isso e devemos mostrar o "Status Atual" (RichPresenceText) lá.
- Confirmar se o endpoint de leaderboard expõe o nome do jogador na entidade Score ou se apenas expõe um array de `Score`. O plano assume que em `/leaderboard/:gameId`, a API populará os dados do Jogador dentro do `Score`.

## Proposed Changes

### Controllers

Padronizaremos todos os métodos exportados para `PascalCase` e variáveis para `camelCase`, além de adaptar endpoints.

#### [MODIFY] src/controllers/playerController.ts
- Renomear a função de `playerPage` para `PlayerPage`.
- Alterar as chamadas à API de `/player/:playerId/saves` para `/player/:playerId/scores`.
- Mapear a matriz de resposta (nova entidade `Score`) para o modelo que `player.pug` espera (array `saves`).
  - O mapeamento criará o formato: `{ game: score.game, lastPlayed: score.updatedAt, richPresenceText: score.richPresenceText, data: { score: score.score, sessionTimeInSeconds: score.sessionTimeInSeconds } }` (ou mapeamentos condizentes com o pug).
- Ordenar nativamente usando `updatedAt`.

#### [MODIFY] src/controllers/gameController.ts
- Renomear a função principal de `gamePage` para `GamePage`.

#### [MODIFY] src/controllers/gamesController.ts
- Renomear `gamesPage` para `GamesPage`.

#### [MODIFY] src/controllers/homeControllers.ts
- Renomear `homePage` para `HomePage` e utilitários que sejam funções também para PascalCase dependendo do export. Manteremos helpers internos como camelCase. (Ou adotaremos PascalCase de acordo com as regras: "PascalCase para todas as funções")

#### [MODIFY] src/controllers/arcadeController.ts, authClientController.ts, loginController.ts, playersController.ts, registerController.ts.ts
- Padronizar variáveis para `camelCase` e métodos exportados/funções para `PascalCase`. 

---

### Routes

Como as funções exportadas dos controllers serão reescritas para `PascalCase`, os arquivos de rotas precisarão ser apontados para os nomes atualizados.

#### [MODIFY] src/routes/*.ts (Todos os arquivos de Rota)
- Atualizar importações para as funções usando o novo padrão `PascalCase` definido.
  `(Ex: import { HomePage } from "../controllers/homeControllers"; router.get("/", HomePage);)`

---

### Scripts Client-Side (Vanilla JS)

O script das páginas de Jogo precisará interagir com a API de Leaderboard.

#### [MODIFY] public/scripts/gamePage.js
- Injetar requisição `fetch` assíncrona (usando API pública ou derivando da porta atual do localhost/vercel) para buscar os scores do em `/leaderboard/:gameId`.
- Criar dinamicamente os elementos DOM (ex: `table`, `tr`, `td`) listando os Top Scores para o jogo.
- Exibir, numa das colunas da tabela de recordes, a propriedade `richPresenceText` (indicando o "Status Atual" dos jogadores naquele jogo).
- Garantir `PascalCase` para as funções.

#### [MODIFY] public/scripts/*.js
- Varredura para verificar funções que não seguem a regra `PascalCase` e variáveis de lógicas internas para `camelCase`.
- Remoção definitiva de qualquer função ou botão "Restaurar Save na Nuvem" se acharmos traços nos `.js`. (Pelos resultados preliminares, nenhuma função aparente, mas passaremos uma varredura rigorosa nesses arquivos).

## Open Questions

- Como a URL do host da API difere para o Client Side no `gamePage.js`? Atualmente o Controller usa `process.env.APIURL || "http://localhost:3001"`. Se fizermos a chamada diretamente do front-end (`Vanilla JS`), que URL o script usará? Assumiremos `http://localhost:3001` hardcoded ou passaremos essa info via injeção num meta tag?
- O que `game.dataLabels` retornava na antiga API para nós mapearmos o `score` no `player.pug` sem falhas? Por padrão, vamos apenas mapear as chaves `score` com o valor numérico de fato.

## Verification Plan

### Automated Tests
- Build do TypeScript via `tsc` (não há scripts complexos, apenas validando que o código compila corretamente com as renomeações e tipagens básicas).

### Manual Verification
- Iniciar o frontend localmente e visitar `/player/1` (ou um ID real) para verificar se o Pug renderiza silenciosamente as chaves de Score maquiadas como "Saves" incluindo a `richPresenceText` (visto por último).
- Entrar na tela de um Jogo Específico (`/game/1`) e verificar se o `gamePage.js` puxa os dados do `GET `/leaderboard/1` e cria a tabela na DOM com os ranks e presenças ricas.
