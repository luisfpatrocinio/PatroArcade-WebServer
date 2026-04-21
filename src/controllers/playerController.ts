import { Request, Response, NextFunction } from "express";

const apiURL = process.env.APIURL || "http://localhost:3001";

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
      try { data = JSON.parse(text); } catch (_) { data = { message: text }; }
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    console.error(`[safeFetch] Erro de rede para ${url}:`, err.message);
    return { ok: false, status: 0, data: null };
  }
}

function authHeaders(token?: string): Record<string, string> {
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

export async function PlayerPage(req: Request, res: Response, next: NextFunction) {
  const playerId = req.params.playerId;
  const token = req.cookies?.token;

  console.log(`[PlayerPage] Carregando perfil do jogador ID=${playerId}`);

  // Buscar dados do jogador
  const playerResult = await safeFetch(`${apiURL}/player/${playerId}`);
  if (!playerResult.ok || !playerResult.data) {
    console.error(`[PlayerPage] Não foi possível carregar o jogador ${playerId}. Status:`, playerResult.status);
    return res.render("error", { message: `Jogador #${playerId} não encontrado.` });
  }
  const playerData = playerResult.data?.content || playerResult.data;

  if (!playerData || !playerData.name) {
    return res.render("error", { message: `Dados do jogador #${playerId} estão incompletos.` });
  }

  // Buscar histórico de scores
  const scoresResult = await safeFetch(`${apiURL}/player/${playerId}/scores`);
  const rawScores = (scoresResult.ok && Array.isArray(scoresResult.data?.content))
    ? scoresResult.data.content
    : [];

  const saves = rawScores
    .map((score: any) => ({
      game: score.game || { id: null, title: "Jogo Desconhecido" },
      lastPlayed: score.updatedAt || score.createdAt || null,
      richPresenceText: score.richPresenceText || "",
      score: score.score ?? 0,
      sessionTimeInSeconds: score.sessionTimeInSeconds ?? 0,
    }))
    .sort((a: any, b: any) =>
      new Date(b.lastPlayed || 0).getTime() - new Date(a.lastPlayed || 0).getTime()
    );

  // Checar se o jogador está online (requer token — gracioso em 401)
  let isOnline = false;
  let currentGameName: string | null = null;

  if (token) {
    const arcadesResult = await safeFetch(`${apiURL}/dashboard/admin/arcades`, {
      headers: authHeaders(token),
    });
    if (arcadesResult.ok && Array.isArray(arcadesResult.data?.content)) {
      for (const arcade of arcadesResult.data.content) {
        if (arcade.metrics?.currentPlayerId == playerId) {
          isOnline = true;
          if (arcade.metrics?.currentGameId) {
            const gameResult = await safeFetch(`${apiURL}/games/${arcade.metrics.currentGameId}`);
            if (gameResult.ok && gameResult.data) {
              const g = gameResult.data?.content || gameResult.data;
              currentGameName = g?.title || null;
            }
          }
          break;
        }
      }
    }
  }

  res.render("player", { playerData, saves, isOnline, currentGameName });
}
