import axios from "axios";
import { Request, Response } from "express";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function PlayersPage(req: Request, res: Response) {
  try {
    console.log("Carregando listagem de perfis...");

    // Obter dados dos jogadores: (playerData)
    const {
      data: { content: playerDatabase },
    } = await axios.get(apiURL + "/player/");

    res.render("players", { playerDatabase });
  } catch (_err) {
    console.error(_err);
    res.status(500).send("Erro ao carregar listagem de perfis.");
  }
}
