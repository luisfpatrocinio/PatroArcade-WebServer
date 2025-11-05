import axios from "axios";
import { Request, Response } from "express";
import dotenv from "dotenv";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function gamesPage(req: Request, res: Response) {
  try {
    console.log("Carregando a página dos jogos...");

    // Solicitar apenas os jogos necessários para a página atual
    const {
      data: { content: gameDatabase },
    } = await axios.get(`${apiURL}/games`);

    res.render("games", { gameDatabase });
  } catch (_err) {
    console.error(_err);
    res.status(500).send("Erro ao carregar a página do jogo.");
  }
}
