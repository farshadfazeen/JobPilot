
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function startServer() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected successfully");

    const server = app.listen(env.PORT, () => {
      console.log(
        `JobPilot API running at http://localhost:${env.PORT}`
      );
    });

    const shutdown = () => {
      server.close(() => {
        void prisma.$disconnect().then(() => process.exit(0));
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  }
}

void startServer();
