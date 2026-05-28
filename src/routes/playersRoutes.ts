import { Router } from "express";
import { PlayersPage } from "../controllers/playersController";

const router = Router();

router.get("/", PlayersPage);

export { router as playersRoutes };
