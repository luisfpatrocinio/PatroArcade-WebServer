import { Router } from "express";
import { ArcadeFirstLoginPage } from "../controllers/arcadeController";

const router = Router();

// Rota que enviara o pin para API
router.get("/:arcadeTempId", ArcadeFirstLoginPage);

export { router as arcadeLoginRoutes };
