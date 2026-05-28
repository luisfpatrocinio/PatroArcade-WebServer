import { Router } from "express";
import { HomePage } from "../controllers/homeControllers";

const router = Router();

router.get("/", HomePage);

export { router as homeRoutes };
