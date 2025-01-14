import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import multer from "multer";

import RootRouter from "./routes/index.js";

//Connect with mongo db by using mongoose
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
