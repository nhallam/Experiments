import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_CATEGORIES = [
  { name: "Groceries", icon: "🛒" },
  { name: "Bills", icon: "💡" },
  { name: "Rent", icon: "🏠" },
  { name: "Household", icon: "🧻" },
  { name: "Takeout", icon: "🥡" },
  { name: "Transport", icon: "🚗" },
  { name: "Other", icon: "📦" },
];

async function main() {
  for (const cat of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon },
      create: cat,
    });
  }
  await prisma.setting.upsert({
    where: { key: "currency" },
    update: {},
    create: { key: "currency", value: "USD" },
  });
  console.log("Seeded categories and default settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
