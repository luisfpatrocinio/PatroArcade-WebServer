import axios from "axios";
import { Request, Response, NextFunction } from "express";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function PlayerPage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("Carregando a página de perfil...");

    const playerId = req.params.playerId;
    const [playerResponse, scoresResponse, arcadesResponse] = await Promise.all([
      axios.get(apiURL + "/player/" + playerId),
      axios.get(apiURL + "/player/" + playerId + "/scores"),
      axios.get(apiURL + "/dashboard/admin/arcades"),
    ]);

    const playerData = playerResponse.data.content;
    const scores = scoresResponse.data.content || [];
    const saves = scores.map((score: any) => ({
      game: score.game,
      lastPlayed: score.updatedAt,
      richPresenceText: score.richPresenceText,
      score: score.score,
      sessionTimeInSeconds: score.sessionTimeInSeconds,
    }));

    saves.sort(
      (a: any, b: any) =>
        new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
    );

    // Verificar se o jogador está online em alguma máquina
    let isOnline = false;
    let currentGameName = null;
    const allArcades = arcadesResponse.data.content || [];
    for (const arcade of allArcades) {
      if (arcade.metrics?.currentPlayerId == playerId) {
        isOnline = true;
        if (arcade.metrics.currentGameId) {
          try {
            const gameRes = await axios.get(apiURL + "/games/" + arcade.metrics.currentGameId);
            currentGameName = gameRes.data.content?.title || gameRes.data.title || null;
          } catch(e) {}
        }
        break;
      }
    }

    res.render("player", { playerData, saves, isOnline, currentGameName });
  } catch (error) {
    next(error);
  }
}
