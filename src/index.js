import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js"
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit"; 
import cookieParser from "cookie-parser";
import path from 'path';
import mlRouter from "./routes/caseRoutes.js"

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import ragRoutes from "./routes/ragRoutes.js"; 

import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { SuspiciousLog } from "./models/suspiciousLogModel.js";

// load environmental Variable
dotenv.config({
    path : './.env'
})

// connect To mongodb
connectDb();

// initiallize express app
const app = express();

app.use(
  cors({
   origin: "*",
   methods: ["GET", "POST", "PUT", "DELETE"],
   credentials: false,
 })
)

// Rate-Limiting
const limiter = rateLimit({
    windowMs : 60*1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders : false,
    message: "Too many requests from this IP, please try again after 15 minutes",
    
    handler: async (req,res,next,options) => {
        const suspiciousIP = req.ip;
      try {
            await SuspiciousLog.create({
                ipAddress: suspiciousIP,
                endpoint: req.originalUrl,
                reason: "RATE_LIMIT_EXCEEDED",
            });
            console.log(`[ALERT] Stored suspicious activity for IP: ${suspiciousIP}`);

        } catch (error) {
            console.error("Error storing suspicious log:", error.message);
        }
        res.status(options.statusCode).send(options.message);
    },
})

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use(limiter);

// Make sure your temp folder is accessible if needed, or uploads
app.use('/uploads', express.static(path.resolve('public/uploads')));

// test route
app.get("/",(req , res) => {
    res.send("Miles Matrix Legal AI API is running 🚀");
})

// ✅ Routes setup (Clean and to the point)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/document", documentRoutes);
app.use("/api/v1/ml", mlRouter);
app.use("/api/v1/rag", ragRoutes);


app.use(errorMiddleware)

export default app;

// server Listening
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on Port ${PORT}`);
})