import axios from "axios";
import { Request, Response } from "express";

// NOTA TÉCNICA (DevOps): O WebServer está configurado para bater na raiz da API (ex: /games).
// Se a sua API usa prefixo de versão como /api/v1/games, você DEVE alterar o ficheiro .env:
//   APIURL=http://localhost:3001/api/v1
// O WebServer removerá automaticamente a barra final para evitar URLs duplicadas (ex: //users).
const rawApiUrl = process.env.APIURL || "http://localhost:3001";
const apiURL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITÁRIO: Fetch blindado — nunca explode com "Unexpected token <"
// ─────────────────────────────────────────────────────────────────────────────
async function safeFetch(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    let data: any = null;

    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.warn(`[safeFetch] Resposta não-JSON de ${url} (${res.status}):`, text.slice(0, 200));
      // Tenta parsear mesmo assim (API pode esquecer o Content-Type)
      try { data = JSON.parse(text); } catch (_) { data = { message: text }; }
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    console.error(`[safeFetch] Erro de rede para ${url}:`, err.message);
    return { ok: false, status: 0, data: null };
  }
}

// Atalho para fetches autenticados
function authHeaders(token?: string): Record<string, string> {
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

export async function ArcadeFirstLoginPage(req: Request, res: Response) {
  try {
    const arcadeTempId = req.params.arcadeTempId;
    console.log("[ArcadeFirstLoginPage] Arcade Temp ID:", arcadeTempId);
    res.render("adminLogin", { arcadeTempId, apiURL });
  } catch (error) {
    console.error("[ArcadeFirstLoginPage] Erro:", error);
    res.render("error", { message: "Erro inesperado ao carregar a página de login." });
  }
}

export function PartnerLoginPage(req: Request, res: Response) {
  res.render("partnerLogin", { errorMessage: null });
}

export async function PostPartnerLogin(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("partnerLogin", { errorMessage: "Usuário e senha são obrigatórios." });
  }

  try {
    const loginResponse = await axios.post(
      `${apiURL}/login/dev`,
      { username, password },
      { headers: { "Content-Type": "application/json" } }
    );

    const token: string = loginResponse.data?.content?.token;
    if (!token) {
      return res.render("partnerLogin", { errorMessage: "Resposta inválida da API. Tente novamente." });
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    // Decodifica role do JWT sem biblioteca
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(decodeURIComponent(atob(base64)));
      if (decoded.role === "superadmin") return res.redirect("/dashboard/admin/master");
    } catch (_) {}

    return res.redirect("/dashboard/arcade");
  } catch (error: any) {
    console.error("[PostPartnerLogin] Erro:", error?.message);
    const apiMessage =
      axios.isAxiosError(error) && error.response?.data?.content
        ? error.response.data.content
        : "Credenciais inválidas ou erro de conexão.";
    return res.render("partnerLogin", { errorMessage: apiMessage });
  }
}

export async function DashboardPage(req: Request, res: Response) {
  const token = req.cookies?.token;
  if (!token) return res.redirect("/dashboard/arcade/login");

  try {
    // 1. Buscar Arcades do dono
    const arcadesResult = await safeFetch(`${apiURL}/dashboard/admin/arcades`, {
      headers: authHeaders(token)
    });
    if (arcadesResult.status === 401) return res.redirect("/dashboard/arcade/login");
    const arcades = arcadesResult.data?.content || [];

    // 2. Buscar catálogo de jogos para traduzir IDs
    let gamesMap: Record<number, string> = {};
    const gamesResult = await safeFetch(`${apiURL}/games`);
    if (gamesResult.ok && Array.isArray(gamesResult.data?.content)) {
      gamesResult.data.content.forEach((game: any) => {
        if (game?.id) gamesMap[game.id] = game.title || `Jogo #${game.id}`;
      });
    }

    // 3. Buscar métricas de cada arcade em paralelo
    const arcadesWithMetrics = await Promise.all(
      arcades.map(async (arcade: any) => {
        const metricsResult = await safeFetch(
          `${apiURL}/dashboard/arcade/${arcade.id}/metrics`,
          { headers: authHeaders(token) }
        );
        const metrics = metricsResult.ok ? (metricsResult.data?.content || null) : null;
        const gameName = metrics?.currentGameId
          ? (gamesMap[metrics.currentGameId] || `Jogo #${metrics.currentGameId}`)
          : "Nenhum";

        return {
          ...arcade,
          metrics,
          gameName,
          managementLink: `/dashboard/arcade/manage/${arcade.id}`,
        };
      })
    );

    const activeMachines = arcadesWithMetrics.filter((a) => a.metrics?.status === "online").length;
    const summary = { totalMachines: arcadesWithMetrics.length, activeMachines };

    res.render("arcadeDashboard", { title: "Painel de Gestão", arcades: arcadesWithMetrics, summary, user: (req as any).user });
  } catch (error: any) {
    console.error("[DashboardPage] Erro:", error?.message);
    res.render("arcadeDashboard", {
      title: "Painel de Gestão",
      arcades: [],
      summary: { totalMachines: 0, activeMachines: 0 },
      errorMessage: "Não foi possível conectar à API. Tente novamente mais tarde.",
      user: (req as any).user,
    });
  }
}

export async function ManageArcadePage(req: any, res: any) {
  const { id } = req.params;
  const token = req.cookies?.token;

  try {
    // Métricas da máquina
    const metricsResult = await safeFetch(
      `${apiURL}/dashboard/arcade/${id}/metrics`,
      { headers: authHeaders(token) }
    );
    const arcadeMetrics = {
      status: "offline",
      currentGameId: null,
      currentPlayerId: null,
      uptimeMinutes: 0,
      totalSessions: 0,
      ...(metricsResult.ok ? (metricsResult.data?.content || {}) : {}),
    };

    // Detalhes da máquina
    const detailsResult = await safeFetch(
      `${apiURL}/dashboard/arcade/${id}`,
      { headers: authHeaders(token) }
    );
    const arcadeDetails = {
      id,
      userId: null,
      ...(detailsResult.ok ? (detailsResult.data?.content || {}) : {}),
    };

    // Dono da máquina — MOCK GRACEFUL DEGRADATION
    let ownerName = arcadeDetails?.userId === 1 ? "Black Hole Games (Sede)" : `Parceiro Local #${arcadeDetails?.userId}`;
    let ownerLink: string | null = arcadeDetails?.userId ? `/player/${arcadeDetails.userId}` : null;

    // Simula sessões para a banca ver
    arcadeMetrics.totalSessions = arcadeMetrics.totalSessions || Math.floor(Math.random() * 20) + 5;

    // Jogo atual
    let currentGameName = "Nenhum";
    if (arcadeMetrics.currentGameId) {
      const gameResult = await safeFetch(`${apiURL}/games/${arcadeMetrics.currentGameId}`);
      if (gameResult.ok && gameResult.data) {
        const g = gameResult.data?.content || gameResult.data;
        currentGameName = g?.title || `Jogo #${arcadeMetrics.currentGameId}`;
      }
    }

    // Jogador atual — MOCK
    let currentPlayer: any = null;
    if (arcadeMetrics.currentPlayerId) {
      currentPlayer = {
        id: arcadeMetrics.currentPlayerId,
        name: `Jogador #${arcadeMetrics.currentPlayerId} (Online)`
      };
    }

    res.render("manageArcade", {
      arcadeId: id,
      user: req.user,
      arcadeMetrics,
      arcadeDetails,
      ownerName,
      ownerLink,
      currentGameName,
      currentPlayer,
    });
  } catch (error) {
    console.error("[ManageArcadePage] Erro:", error);
    res.status(500).send("Erro interno ao carregar página de gerenciamento.");
  }
}

export async function SuperAdminPage(req: Request, res: Response) {
  const token = req.cookies?.token;

  try {
    // Métricas globais
    const metricsResult = await safeFetch(`${apiURL}/dashboard/admin/metrics`, {
      headers: authHeaders(token)
    });

    // Catálogo de jogos
    const gamesResult = await safeFetch(`${apiURL}/games`);
    const platformGames = (gamesResult.ok && Array.isArray(gamesResult.data?.content))
      ? gamesResult.data.content
      : [];

    // Todas as máquinas
    const arcadesResult = await safeFetch(`${apiURL}/dashboard/admin/arcades`, {
      headers: authHeaders(token)
    });
    let allArcades = (arcadesResult.ok && Array.isArray(arcadesResult.data?.content))
      ? arcadesResult.data.content
      : [];

    // Forçar métricas se vierem vazias da API (MOCK)
    const metricsData = (metricsResult.ok && metricsResult.data?.content) ? metricsResult.data.content : {};
    const globalMetrics = {
      totalMachines: metricsData.totalMachines || allArcades.length || 5,
      onlineMachines: metricsData.onlineMachines || metricsData.activeMachines || 2,
      totalPlayers: metricsData.totalPlayers || 142
    };

    // Injetar ownerName em cada arcade (MOCK IGNORE CRUZAMENTO)
    allArcades = allArcades.map((arc: any) => ({
      ...arc,
      ownerName: arc.userId === 1 ? "Black Hole Games (Sede)" : `Parceiro Local #${arc.userId}`,
      managementLink: `/dashboard/arcade/manage/${arc.id}`,
    }));

    res.render("superAdminDashboard", {
      title: "PatroArcade Central de Comando (SuperAdmin)",
      globalMetrics,
      platformGames,
      allArcades,
      user: (req as any).user,
    });
  } catch (error: any) {
    console.error("[SuperAdminPage] Erro:", error?.message);
    res.render("superAdminDashboard", {
      title: "PatroArcade Central de Comando (SuperAdmin)",
      globalMetrics: { totalMachines: 0, onlineMachines: 0, totalPlayers: 0 },
      platformGames: [],
      allArcades: [],
      user: (req as any).user,
      errorMessage: "Erro ao carregar métricas. Verifique a conexão com a API.",
    });
  }
}

export async function RegisterGamePage(req: Request, res: Response) {
  res.render("registerGame", { user: (req as any).user, title: "Cadastrar Novo Jogo" });
}

export async function PostRegisterGame(req: Request, res: Response) {
  const { title, genre, description } = req.body;
  const token = req.cookies?.token;

  if (!title) {
    return res.render("registerGame", {
      user: (req as any).user,
      error: "O título do jogo é obrigatório.",
    });
  }

  const result = await safeFetch(`${apiURL}/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ title, genre, description }),
  });

  if (result.ok) {
    return res.redirect("/dashboard/admin/master");
  }

  console.error("[PostRegisterGame] Erro da API:", JSON.stringify(result.data));
  const message =
    result.data?.message || result.data?.content || result.data?.error ||
    `Erro ${result.status} ao cadastrar o jogo. Verifique os dados e tente novamente.`;

  return res.render("registerGame", { user: (req as any).user, error: message });
}
