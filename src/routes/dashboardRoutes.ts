import { Router } from "express";
import { DashboardPage } from "../controllers/arcadeController";

export const dashboardRoutes = Router();

dashboardRoutes.get("/arcade", DashboardPage);
