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

    // Obter dados do jogador: (playerData)
    const {
      data: { content: playerData },
    } = await axios.get(apiURL + "/player/" + req.params.playerId);

    // Obter jogos que o player jogou: (saves)
    const {
      data: { content: saves },
    } = await axios.get(apiURL + "/player/" + req.params.playerId + "/saves");
    saves.sort((a: any, b: any) => b.lastPlayed - a.lastPlayed);

    // Obter informações dos jogos:
    const gameInfos = await Promise.all(
      saves.map(async (save: any) => {
        const {
          data: { content: gameInfo },
        } = await axios.get(apiURL + "/game/" + save.gameId);
        return gameInfo;
      })
    );

    res.render("player", { playerData, gameInfos, saves });
  } catch (error) {
    next(error); // Passa o erro para o middleware centralizado
  }
}
