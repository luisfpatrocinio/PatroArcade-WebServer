import { Router } from "express";
import { GamePage } from "../controllers/gameController";

const router = Router();

router.get("/:gameId", GamePage);

export { router as gameRoutes };
