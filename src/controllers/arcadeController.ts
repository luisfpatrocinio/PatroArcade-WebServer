import axios from "axios";
import { Request, Response } from "express";

const apiURL = process.env.APIURL || "http://localhost:3001";

export async function ArcadeFirstLoginPage(req: Request, res: Response) {
  try {
    const arcadeTempId = req.params.arcadeTempId;
    console.log("Página de Login de Administrador de Arcade");
    console.log("Arcade Temp ID: " + arcadeTempId);
    console.log("API URL: " + apiURL);

    res.render("adminLogin", {
      arcadeTempId: arcadeTempId,
      apiURL: apiURL,
    });
  } catch (error) {
    console.log("Erro!");
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
