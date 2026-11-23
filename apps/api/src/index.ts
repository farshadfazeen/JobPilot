import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    application: "JobPilot API",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`JobPilot API running at http://localhost:${PORT}`);
});