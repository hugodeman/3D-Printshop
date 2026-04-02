import "dotenv/config";
import { PrismaClient, Prisma } from "../app/generated/prisma/client"
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function main() {
  console.log("Seed gestart...");

  //////////////////////////////////////
  // USERS
  //////////////////////////////////////

  const admin = await prisma.user.upsert({
    where: { email: 'admintest@test.com' },
    update: {},
    create: {
      email: 'admintest@test.com',
      password: 'adminpassword',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'usertest@test.com' },
    update: {},
    create: {
      email: 'usertest@test.com',
      password: 'userpassword',
      role: 'USER',
    },
  });

  console.log("Users aangemaakt:", { adminId: admin.id, userId: user.id });

  //////////////////////////////////////
  // PRODUCTS
  //////////////////////////////////////

  const existingProduct1 = await prisma.product.findFirst({
    where: { title: "3D Geprint Beeldje" },
  });

  const product1 =
    existingProduct1 ??
    (await prisma.product.create({
      data: {
        title: "3D Geprint Beeldje",
        description: "Een gepersonaliseerd beeldje",
        price: new Prisma.Decimal(19.99),
        type: "FIGURE",
        filament: "PLA",
        dimensions: "10x10x15 cm",
        deliveryTime: 5,
        createdById: admin.id,
        images: {
          create: [{ url: "/images/figure1.png" }, { url: "/images/figure2.png" }],
        },
        options: {
          create: {
            paintable: true,
          },
        },
      },
    }));

  const existingProduct2 = await prisma.product.findFirst({
    where: { title: "Praktische 3D Print" },
  });

  const product2 =
    existingProduct2 ??
    (await prisma.product.create({
      data: {
        title: "Praktische 3D Print",
        description: "Handige tool voor dagelijks gebruik",
        price: new Prisma.Decimal(9.99),
        type: "PRACTICAL",
        filament: "PETG",
        dimensions: "5x5x5 cm",
        deliveryTime: 3,
        createdById: admin.id,
        images: {
          create: [{ url: "/images/tool1.png" }],
        },
        options: {
          create: {
            color: "black",
          },
        },
      },
    }));

  console.log("Producten aangemaakt:", { product1Id: product1.id, product2Id: product2.id });

  //////////////////////////////////////
  // ADDRESS
  //////////////////////////////////////

  await prisma.address.upsert({
    where: {
      id: `${user.id}-default-address`,
    },
    update: {},
    create: {
      id: `${user.id}-default-address`,
      userId: user.id,
      firstName: "Jan",
      lastName: "Jansen",
      country: "Nederland",
      postal: "1234AB",
      street: "Straat 1",
      city: "Amsterdam",
    },
  });

  console.log("Seed succesvol uitgevoerd!", {
    adminId: admin.id,
    userId: user.id,
    product1Id: product1.id,
    product2Id: product2.id,
  });
}

main()