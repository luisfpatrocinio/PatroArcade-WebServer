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

    const [playerResponse, scoresResponse] = await Promise.all([
      axios.get(apiURL + "/player/" + req.params.playerId),
      axios.get(apiURL + "/player/" + req.params.playerId + "/scores"),
    ]);

    // Obter dados do player:
    const playerData = playerResponse.data.content;

    // Obter jogos que o player jogou: (scores formatados como saves)
    const scores = scoresResponse.data.content || [];
    const saves = scores.map((score: any) => ({
      game: score.game,
      lastPlayed: score.updatedAt,
      richPresenceText: score.richPresenceText,
      score: score.score,
      sessionTimeInSeconds: score.sessionTimeInSeconds,
    }));

    // Correção na ordenação de datas (strings JSON precisam virar Date)
    saves.sort(
      (a: any, b: any) =>
        new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
    );

    res.render("player", { playerData, saves });
  } catch (error) {
    next(error);
  }
}
