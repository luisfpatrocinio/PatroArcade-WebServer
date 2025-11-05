import axios from "axios";
import { Request, Response } from "express";
import dotenv from "dotenv";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function gamePage(req: Request, res: Response) {
  try {
    console.log("Carregando a página do jogo...");
    console.log("API URL:", apiURL);
    const gameId = req.params.gameId;
    console.log("ID do jogo:", gameId);
    const {
      data: { content: game },
    } = await axios.get(apiURL + "/game/" + req.params.gameId);
    res.render("game", { game });
  } catch (_err) {
    console.error(_err);
    res.status(500).send("Erro ao carregar a página do jogo.");
  }
}
