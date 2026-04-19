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

  const authHeader = { Authorization: `Bearer ${token}` };

  try {
    // 1) Buscar todos os arcades deste owner (Multi-Tenant)
    const arcadesResponse = await axios.get(`${apiURL}/dashboard/admin/arcades`, {
      headers: authHeader,
    });

    const arcades: any[] = arcadesResponse.data?.content ?? [];

    // 2) Buscar métricas de cada arcade em paralelo (fan-out)
    const arcadesWithMetrics = await Promise.all(
      arcades.map(async (arcade) => {
        try {
          const metricsResponse = await axios.get(
            `${apiURL}/dashboard/arcade/${arcade.id}/metrics`,
            { headers: authHeader }
          );
          const metrics = metricsResponse.data?.content ?? null;
          return { ...arcade, metrics };
        } catch {
          // Se uma máquina falhar nas métricas, não derruba o dashboard inteiro
          return { ...arcade, metrics: null };
        }
      })
    );

    // 3) Calcular totais para os cards de resumo
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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
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
