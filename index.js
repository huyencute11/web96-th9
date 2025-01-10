import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import RootRouter from "./routes/index.js";

//Connect with mongo db by using mongoose
dotenv.config();
mongoose.connect(
  // pass your connection mongodb string here
  process.env.MONGO_URL
);

const app = express();
app.use(express.json());

app.use("/api/v1", RootRouter);

app.listen(8080, () => {
  console.log("Server is running!");
});
