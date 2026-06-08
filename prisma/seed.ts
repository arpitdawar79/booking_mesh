import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ekantah.com" },
    update: {},
    create: {
      email: "admin@ekantah.com",
      name: "Admin",
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log("Created admin user:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
