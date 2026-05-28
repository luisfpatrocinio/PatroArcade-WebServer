import { Router } from "express";
import { LoginPage } from "../controllers/loginController";
import { LoginCallback } from "../controllers/authClientController";

const router = Router();

router.get("/callback", LoginCallback);

router.get("/:arcadeId", LoginPage);

export { router as loginRoutes };
