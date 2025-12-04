import { Request, Response } from "express";

export function loginCallback(req: Request, res: Response) {
    // Pega os dados que a API mandou via URL
    const { token, playerId } = req.query;

    // Renderiza uma página temporária (loginCallback.pug) passando esses dados
    res.render("loginCallback", { token, playerId });
}