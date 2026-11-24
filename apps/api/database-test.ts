
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const userCount = await prisma.user.count();
    const applicationCount = await prisma.application.count();

    console.log("JobPilot database connected successfully!");
    console.log("Users:", userCount);
    console.log("Applications:", applicationCount);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Database verification failed:", error);
  process.exitCode = 1;
});
