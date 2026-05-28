import { Router } from "express";
import { PlayerPage } from "../controllers/playerController";

const router = Router();

// Rota de perfil do player
router.get("/:playerId", PlayerPage);

export { router as playerRoutes };
