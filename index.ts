import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function unseed() {
  await prisma.user.deleteMany();
  await prisma.account.deleteMany({
    where: {
      OR: [{ email: "alice@prisma.io" }, { email: "bob@prisma.io" }],
    },
  });
}

async function seed() {
  await prisma.account.create({
    data: {
      email: "alice@prisma.io",
      balance: 100,
      User: {
        create: {
          name: "alice",
        },
      },
    },
  });
  await prisma.account.create({
    data: {
      email: "bob@prisma.io",
      balance: 100,
    },
  });
}

async function main() {
  await prisma.$connect();
  await unseed();
  await seed();
  console.time("queries");

  const req = new Array(2000).fill(0).map(
    (_, i) =>
      new Promise((res) =>
        setTimeout(() => {
          res(
            prisma
              .$transaction([
                prisma.account.findUnique({
                  where: { email: "alice@prisma.io" },
                }),
                prisma.user.findUnique({
                  where: { name: "alice" },
                }),
              ])
              .then(() => console.log(`Done transaction ${i}`))
          );
        }, Math.floor(Math.random() * (10 - 1 + 1) + 1))
      )
  );

  await Promise.all(req);

  console.timeEnd("queries");
}

main()
  .catch(console.error)
  .finally(async () => {
    console.log("Doing last query...");
    console.time("lastQuery");

    console.log(await prisma.account.findMany());

    console.timeEnd("lastQuery");
    prisma.$disconnect();
    console.log("Done");
  });
