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

export async function ManageArcadePage(req: Request, res: Response) {
  const { id } = req.params;
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect("/dashboard/arcade/login");
  }

  res.render('arcadeDashboard', { 
    user: (req as any).user, 
    message: `Gerenciamento da Máquina ${id} em desenvolvimento.`,
    arcades: [],
    summary: { totalMachines: 0, activeMachines: 0 },
    title: `Gerenciar Máquina ${id}`
  });
}

export async function SuperAdminPage(req: Request, res: Response) {
  // Mocks conforme solicitado
  const globalMetrics = { totalMachines: 150, onlineMachines: 87, totalPlayers: 5430 };

  try {
    // Buscar Catálogo de Jogos da Plataforma
    const gamesRes = await fetch(`${apiURL}/games`);
    let platformGames = [];
    if (gamesRes.ok) {
      const gamesData = await gamesRes.json() as any;
      platformGames = gamesData.content || [];
    }

    res.render("superAdminDashboard", {
      title: "PatroArcade Central de Comando (SuperAdmin)",
      globalMetrics,
      platformGames,
      user: (req as any).user // O middleware auth injetou aqui
    });

  } catch (error: any) {
    console.error("[SuperAdminPage] Erro:", error?.message);
    res.render("superAdminDashboard", {
      title: "PatroArcade Central de Comando (SuperAdmin)",
      globalMetrics,
      platformGames: [],
      user: (req as any).user,
      errorMessage: "Erro ao carregar catálogo de jogos."
    });
  }
}
