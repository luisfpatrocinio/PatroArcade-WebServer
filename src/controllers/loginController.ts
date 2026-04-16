import axios from "axios";
import { Request, Response } from "express";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function LoginPage(req: Request, res: Response) {
  try {
    console.log("Carregando a página de login...");

    const arcadeInfo = await axios.get(
      apiURL + "/arcade/" + req.params.arcadeId
    );

    res.render("login", {
      arcadeData: arcadeInfo.data.content,
      arcadeId: req.params.arcadeId,
      apiURL: apiURL,
    });
  } catch (error) {
    // Verifica se o erro possui uma resposta da API
    if (axios.isAxiosError(error) && error.response) {
      // Captura o código de status e a mensagem de erro
      const statusCode = error.response.status; // Ex: 404
      const statusText = error.response.statusText; // Ex: "Not Found"

      // Renderiza a página de erro com as informações do erro
      res.render("error", {
        message: `Erro ${statusCode}: ${statusText}`,
      });
    } else {
      // Para outros tipos de erro (como problemas de rede)
      console.error("Erro inesperado:", (error as Error).message);

      res.render("error", {
        message: "Erro inesperado",
      });
    }
  }
}
