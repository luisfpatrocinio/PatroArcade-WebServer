import axios from "axios";
import { Request, Response } from "express";
import dotenv from "dotenv";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function homePage(req: Request, res: Response) {
  try {
    const [newsResponse, gamesResponse, playersResponse] = await Promise.all([
      axios.get(apiURL + "/latestNews"),
      axios.get(apiURL + "/game"),
      axios.get(apiURL + "/player"),
    ]);

    console.log("Carregando a página inicial...");
    console.log("API URL:", apiURL);

    const latestNews = newsResponse.data.content;
    const games = gamesResponse.data.content;
    const players = playersResponse.data.content;

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
