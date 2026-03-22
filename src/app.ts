import express from "express";
import cookieParser from "cookie-parser"

export const app = express();
app.use(express.json())
app.use(cookieParser())


// Routes required
import authRouter  from "./routes/auth.routes";
import accountRouter from "./routes/accounts.route"

// Use Routes 
app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)