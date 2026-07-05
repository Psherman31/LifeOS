import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const domains = ["Work", "Home / Parenting"];
  for (let i = 0; i < domains.length; i++) {
    await prisma.domain.upsert({
      where: { name: domains[i] },
      update: {},
      create: { name: domains[i], sortOrder: i },
    });
  }
  await prisma.appState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  console.log("Seeded domains:", domains.join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
