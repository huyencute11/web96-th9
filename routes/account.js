import { Router } from "express";
import AccountController from "../controllers/account.controller.js";

const AccountRouter = Router();

AccountRouter.post("/register", AccountController.register);
AccountRouter.post("/login", AccountController.login);

export default AccountRouter;