import axios from "axios";
import { Request, Response, NextFunction } from "express";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function playerPage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("Carregando a página de perfil...");

    const [playerResponse, savesResponse] = await Promise.all([
      axios.get(apiURL + "/player/" + req.params.playerId),
      axios.get(apiURL + "/player/" + req.params.playerId + "/saves"),
    ]);

    // Obter dados do player:
    const playerData = playerResponse.data.content;

    // Obter jogos que o player jogou: (saves)
    const saves = savesResponse.data.content;

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
