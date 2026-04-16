import { Router } from "express";
import { GamesPage } from "../controllers/gamesController";

const router = Router();

// Rota index
router.get("/", GamesPage);

export { router as gamesRoutes };
