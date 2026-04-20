import { Router } from "express";
import { DashboardPage, PartnerLoginPage, PostPartnerLogin, SuperAdminPage } from "../controllers/arcadeController";
import { authMiddleware, superAdminAuthMiddleware } from "../middlewares/authMiddleware";
import express from "express";

export const dashboardRoutes = Router();

// Parse form bodies nesta rota
dashboardRoutes.use(express.urlencoded({ extended: false }));

// Rota principal do dashboard (protegida por cookie)
dashboardRoutes.get("/arcade", DashboardPage);

// Rota Mestre do SuperAdmin (Protegida por RBAC)
dashboardRoutes.get("/admin/master", authMiddleware, superAdminAuthMiddleware, SuperAdminPage);

// Rota de login do parceiro B2B
dashboardRoutes.get("/arcade/login", PartnerLoginPage);
dashboardRoutes.post("/arcade/login", PostPartnerLogin);
