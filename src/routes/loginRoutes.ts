import { Router } from "express";
import { loginPage } from "../controllers/loginController";
import { loginCallback } from "../controllers/authClientController";

const router = Router();

router.get("/callback", loginCallback);

router.get("/:arcadeId", loginPage);

export { router as loginRoutes };
