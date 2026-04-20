import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "patro_jwt_secret";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect("/dashboard/arcade/login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[authMiddleware] Token inválido:", error);
    res.clearCookie("token");
    return res.redirect("/dashboard/arcade/login");
  }
};

export const adminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res.status(403).render("error", { message: "Acesso negado. Apenas administradores." });
  }
  next();
};

export const superAdminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).render("error", { message: "Acesso negado. Requer privilégios de SuperAdmin." });
  }
  next();
};
