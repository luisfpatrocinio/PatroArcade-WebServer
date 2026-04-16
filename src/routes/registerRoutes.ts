import { Router } from "express";
import { RegisterPage } from "../controllers/registerController.ts";

const router = Router();

// Nova Rota para renderizar página de registro para um novo usuario:
router.get("/:arcadeId", RegisterPage);

export { router as registerRoutes };
