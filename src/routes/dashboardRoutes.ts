import { Router } from "express";
import { DashboardPage, PartnerLoginPage, PostPartnerLogin } from "../controllers/arcadeController";
import express from "express";

export const dashboardRoutes = Router();

// Parse form bodies nesta rota
dashboardRoutes.use(express.urlencoded({ extended: false }));

// Rota principal do dashboard (protegida por cookie)
dashboardRoutes.get("/arcade", DashboardPage);

// Rota de login do parceiro B2B
dashboardRoutes.get("/arcade/login", PartnerLoginPage);
dashboardRoutes.post("/arcade/login", PostPartnerLogin);
