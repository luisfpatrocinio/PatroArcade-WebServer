import axios from "axios";
import { Request, Response } from "express";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function ArcadeFirstLoginPage(req: Request, res: Response) {
  try {
    const arcadeTempId = req.params.arcadeTempId;
    console.log("Página de Login de Administrador de Arcade");
    console.log("Arcade Temp ID: " + arcadeTempId);
    console.log("API URL: " + apiURL);

    res.render("adminLogin", {
      arcadeTempId: arcadeTempId,
      apiURL: apiURL,
    });
  } catch (error) {
    console.log("Erro!");
    if (axios.isAxiosError(error) && error.response) {
      // Captura o código de status e a mensagem de erro
      const statusCode = error.response.status; // Ex: 404
      const statusText = error.response.statusText; // Ex: "Not Found"

      // Renderiza a página de erro com as informações do erro
      res.render("error", {
        message: `Erro ${statusCode}: ${statusText}`,
      });
    } else {
      // Para outros tipos de erro (como problemas de rede)
      console.error("Erro inesperado:", (error as Error).message);

      res.render("error", {
        message: "Erro inesperado",
      });
    }
  }
}

export function PartnerLoginPage(req: Request, res: Response) {
  res.render("partnerLogin", {
    errorMessage: null,
  });
}

export async function PostPartnerLogin(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("partnerLogin", {
      errorMessage: "Usuário e senha são obrigatórios.",
    });
  }

  try {
    const loginResponse = await axios.post(
      `${apiURL}/login/dev`,
      { username, password },
      { headers: { "Content-Type": "application/json" } }
    );

    const token: string = loginResponse.data?.content?.token;

    if (!token) {
      return res.render("partnerLogin", {
        errorMessage: "Resposta inválida da API. Tente novamente.",
      });
    }

    // Salva o JWT num cookie HttpOnly — inacessível via JS no browser
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000, // 8 horas (mesmo TTL do JWT)
      sameSite: "lax",
    });

    // Decodifica o token para verificar a role
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64));
    const decoded = JSON.parse(jsonPayload);

    if (decoded.role === 'superadmin') {
      return res.redirect("/dashboard/admin/master");
    }
    return res.redirect("/dashboard/arcade");
  } catch (error: any) {
    console.error("[PostPartnerLogin] Erro:", error?.message);

    const apiMessage =
      axios.isAxiosError(error) && error.response?.data?.content
        ? error.response.data.content
        : "Credenciais inválidas ou erro de conexão.";

    return res.render("partnerLogin", {
      errorMessage: apiMessage,
    });
  }
}

export async function DashboardPage(req: Request, res: Response) {
  // JWT enviado pelo browser via cookie após o login do parceiro
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect("/dashboard/arcade/login");
  }

  try {
    // 1. Buscar Arcades do dono
    const arcadesRes = await fetch(`${apiURL}/dashboard/admin/arcades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!arcadesRes.ok) throw new Error('Falha ao carregar arcades');
    const arcadesData = await arcadesRes.json() as any;
    const arcades = arcadesData.content || [];

    // 2. Buscar Catálogo de Jogos para traduzir IDs em Nomes
    let gamesMap: Record<number, string> = {};
    try {
      const gamesRes = await fetch(`${apiURL}/games`);
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json() as any;
        // Cria um dicionário: { 1: "Space Squadron", 2: "Tetris" }
        gamesData.content.forEach((game: any) => {
          gamesMap[game.id] = game.title;
        });
      }
    } catch (e) {
      console.error('Aviso: Não foi possível carregar o catálogo de jogos.', e);
    }

    // 3. Buscar Métricas de cada Arcade e combinar tudo
    const arcadesWithMetrics = await Promise.all(
      arcades.map(async (arcade: any) => {
        try {
          const metricsRes = await fetch(`${apiURL}/dashboard/arcade/${arcade.id}/metrics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const metricsData = await metricsRes.json() as any;
          const metrics = metricsData.content;
          
          // Traduzir o ID para o Nome do Jogo
          let gameName = "Nenhum";
          if (metrics && metrics.currentGameId) {
            gameName = gamesMap[metrics.currentGameId] || `Jogo #${metrics.currentGameId}`;
          }

          return { 
            ...arcade, 
            metrics, 
            gameName, 
            managementLink: `/dashboard/arcade/manage/${arcade.id}` 
          };
        } catch (error) {
          return { 
            ...arcade, 
            metrics: null, 
            gameName: "Erro de Conexão", 
            managementLink: `/dashboard/arcade/manage/${arcade.id}` 
          };
        }
      })
    );

    // 4) Calcular totais para os cards de resumo
    const activeMachines = arcadesWithMetrics.filter(
      (a) => a.metrics?.status === "online"
    ).length;

    const summary = {
      totalMachines: arcadesWithMetrics.length,
      activeMachines,
    };

    res.render("arcadeDashboard", {
      title: "Painel de Gestão",
      arcades: arcadesWithMetrics,
      summary,
    });
  } catch (error: any) {
    console.error("[DashboardPage] Erro ao buscar dados da API:", error?.message);

    // Se a API retornar 401, redirecionar para login
    if (error.status === 401) {
      return res.redirect("/arcadeLogin");
    }

    // Renderizar a página com lista vazia para não travar o parceiro
    res.render("arcadeDashboard", {
      title: "Painel de Gestão",
      arcades: [],
      summary: { totalMachines: 0, activeMachines: 0 },
      errorMessage: "Não foi possível conectar à API. Tente novamente mais tarde.",
    });
  }
}

export async function ManageArcadePage(req: any, res: any) {
  try {
    const { id } = req.params;
    const token = req.cookies?.token;

    // Buscar Métricas Reais da Máquina
    let arcadeMetrics: any = { status: 'offline', currentGameId: null, currentPlayerId: null, uptimeMinutes: 0, totalSessions: 0 };
    try {
      const metricsRes = await fetch(`${apiURL}/dashboard/arcade/${id}/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (metricsRes.ok) {
        const data = await metricsRes.json() as any;
        arcadeMetrics = { ...arcadeMetrics, ...(data.content || {}) };
      }
    } catch (e) {
      console.error("[ManageArcadePage] Erro ao buscar métricas:", e);
    }

    // Buscar Jogo Atual
    let currentGameTitle = 'Nenhum';
    if (arcadeMetrics.currentGameId) {
      try {
        const gameRes = await fetch(`${apiURL}/games/${arcadeMetrics.currentGameId}`);
        if (gameRes.ok) {
          const gameData = await gameRes.json() as any;
          currentGameTitle = gameData.content?.title || 'Jogo #' + arcadeMetrics.currentGameId;
        }
      } catch (e) {
        console.error("[ManageArcadePage] Erro ao buscar jogo:", e);
      }
    }

    // Buscar Jogador Atual
    let currentPlayer = null;
    if (arcadeMetrics.currentPlayerId) {
      try {
        const playerRes = await fetch(`${apiURL}/players/${arcadeMetrics.currentPlayerId}`);
        if (playerRes.ok) {
          const playerData = await playerRes.json() as any;
          currentPlayer = playerData.content;
        }
      } catch(e) { console.error("Erro ao buscar jogador atual", e); }
    }

    res.render('manageArcade', { 
      arcadeId: id,
      user: req.user,
      arcadeMetrics,
      currentGameTitle,
      currentPlayer
    });
  } catch (error) {
    console.error("Erro na rota manage arcade:", error);
    res.status(500).send("Erro interno ao carregar página de gerenciamento.");
  }
}

export async function SuperAdminPage(req: Request, res: Response) {
  const token = req.cookies?.token;

  try {
    // Buscar Métricas Reais da API
    const metricsRes = await fetch(`${apiURL}/dashboard/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let globalMetrics = { totalMachines: 0, onlineMachines: 0, totalPlayers: 0 };
    if (metricsRes.ok) {
      const metricsData = await metricsRes.json() as any;
      globalMetrics = metricsData.content || globalMetrics;
    }

    // Buscar Catálogo de Jogos da Plataforma
    const gamesRes = await fetch(`${apiURL}/games`);
    let platformGames = [];
    if (gamesRes.ok) {
      const gamesData = await gamesRes.json() as any;
      platformGames = gamesData.content || [];
    }

    // Buscar TODAS as máquinas da plataforma
    const arcadesRes = await fetch(`${apiURL}/dashboard/admin/arcades`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let allArcades = [];
    if (arcadesRes.ok) {
      const arcadesData = await arcadesRes.json() as any;
      allArcades = arcadesData.content || [];
    }

    // Buscar usuários para mapear nomes
    let usersMap: Record<number, string> = {};
    try {
      const usersRes = await fetch(`${apiURL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json() as any;
        usersData.content.forEach((u: any) => { usersMap[u.id] = u.name || u.username || `User #${u.id}`; });
      }
    } catch (e) { console.error("Erro ao buscar usuários", e); }

    // Injetar ownerName em cada arcade
    allArcades = allArcades.map((arcade: any) => ({
      ...arcade,
      ownerName: arcade.userId ? (usersMap[arcade.userId] || `User #${arcade.userId}`) : 'Desconhecido'
    }));

    res.render("superAdminDashboard", {
      title: "PatroArcade Central de Comando (SuperAdmin)",
      globalMetrics,
      platformGames,
      allArcades,
      user: (req as any).user
    });

  } catch (error: any) {
    console.error("[SuperAdminPage] Erro:", error?.message);
    res.render("superAdminDashboard", {
      title: "PatroArcade Central de Comando (SuperAdmin)",
      globalMetrics: { totalMachines: 0, onlineMachines: 0, totalPlayers: 0 },
      platformGames: [],
      allArcades: [],
      user: (req as any).user,
      errorMessage: "Erro ao carregar métricas."
    });
  }
}

export async function RegisterGamePage(req: Request, res: Response) {
  res.render('registerGame', { user: (req as any).user, title: "Cadastrar Novo Jogo" });
}

export async function PostRegisterGame(req: Request, res: Response) {
  const { title, genre, description } = req.body;
  const token = req.cookies?.token;

  try {
    const response = await fetch(`${apiURL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, genre, description })
    });
    if (response.ok) return res.redirect('/dashboard/admin/master');
    else throw new Error("Falha na API");
  } catch (error) {
    console.error(error);
    res.render('registerGame', { user: (req as any).user, error: "Erro ao cadastrar jogo. Tente novamente." });
  }
}
