import { Router } from "express";
import AccountRouter from "./account.js";

const RootRouter = Router();
RootRouter.use('/account', AccountRouter);

export default RootRouter;