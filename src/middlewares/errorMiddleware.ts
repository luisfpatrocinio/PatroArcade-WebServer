import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);
  res.status(500).render("error", {
    message: "Ocorreu um erro inesperado no servidor.",
  });
}
