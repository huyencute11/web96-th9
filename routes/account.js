import { Router } from "express";
import AccountController from "../controllers/account.controller.js";
import verifyToken from "../middlewares/authentication.js";
import upload from "../middlewares/uploadFile.js";

const AccountRouter = Router();

AccountRouter.post("/register", AccountController.register);
AccountRouter.post("/login", AccountController.login);
AccountRouter.get("/getProfile", AccountController.getProfile);
AccountRouter.post(
  "/createEmployee",
  verifyToken,
  AccountController.createEmployee
);
AccountRouter.post(
  "/createProperty",
  verifyToken,
  AccountController.createProperty2
);

export default AccountRouter;
