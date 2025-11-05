import axios from "axios";
import { Request, Response } from "express";
import dotenv from "dotenv";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function homePage(req: Request, res: Response) {
  try {
    console.log("Carregando a página inicial...");
    console.log("API URL:", apiURL);
    const {
      data: { content: latestNews },
    } = await axios.get(apiURL + "/latestNews");

    // Obter Jogos
    const {
      data: { content: games },
    } = await axios.get(apiURL + "/game");

    // Obter Maiores Pontuações
    const {
      data: { content: players },
    } = await axios.get(apiURL + "/player");
    players.sort((a: any, b: any) => b.totalScore - a.totalScore);

    // // Obter saves
    // const {
    //   data: { content: saves },
    // } = await axios.get(apiURL + "/saves");

    // // Obter apenas os últimos saves:
    // saves.sort((a: any, b: any) => b.lastPlayed - a.lastPlayed);

    res.render("home", { latestNews, games, players });
  } catch (_err) {
    // if (_err instanceof Error) console.error(_err.message);
    console.error(_err);
    res.status(500).send("Erro ao carregar a página inicial.");
  }
}
