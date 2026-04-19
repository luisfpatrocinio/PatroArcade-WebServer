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

export async function DashboardPage(req: Request, res: Response) {
  // JWT enviado pelo browser via cookie após o login do parceiro
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect("/arcadeLogin");
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
