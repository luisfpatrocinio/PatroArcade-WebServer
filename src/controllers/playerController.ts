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
