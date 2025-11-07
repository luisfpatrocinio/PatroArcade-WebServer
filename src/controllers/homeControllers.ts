import axios from "axios";
import { NextFunction, Request, Response } from "express";

const apiURL = process.env.APIURL || "http://localhost:3001";

// Esta função helper tenta buscar dados. Se falhar, retorna null.
const safeFetch = async (url: string) => {
  try {
    const { data } = await axios.get(url);
    return data.content; // Retorna o conteúdo em caso de sucesso
  } catch (error) {
    // Em caso de falha, registra o erro no console do servidor
    console.error(
      `AVISO: Falha ao buscar dados de ${url}: ${(error as Error).message}`
    );
    return null; // Retorna null e não quebra a aplicação
  }
};

export async function homePage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("Carregando a página inicial...");
    console.log("API URL:", apiURL);

    const [latestNewsData, gamesData, playersData] = await Promise.all([
      safeFetch(apiURL + "/latestNews"),
      safeFetch(apiURL + "/game"),
      safeFetch(apiURL + "/player"),
    ]);

    if (playersData) {
      playersData.sort((a: any, b: any) => b.totalScore - a.totalScore);
    }

    // Renderiza a página passando os dados que obtivemos (ou arrays vazios como fallback)
    res.render("home", {
      latestNews: latestNewsData || [],
      games: gamesData || [],
      players: playersData || [],
    });
  } catch (_err) {
    // Este catch agora só lidará com erros inesperados (ex: falha no 'res.render')
    console.error("Erro crítico no homeController:", _err);
    next(_err); // Envia para o middleware de erro
  }
}
