import { PrismaClient } from "@prisma/client";
import { dealers, listings, users } from "./seed-data";
import { seedAdminFromEnv } from "./seed-admin";
import { seedVehicleCategories } from "./seed-categories";

const prisma = new PrismaClient();

async function main() {
  await prisma.enquiryMessage.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.viewHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.dealer.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: users.map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      avatarUrl: user.avatarUrl,
      emailVerified: new Date(),
    })),
  });

  await prisma.dealer.createMany({
    data: dealers.map(({ id, name, slug, logoUrl, districts, verified, phone, whatsapp, description, userId }) => ({
      id,
      name,
      slug,
      logoUrl,
      districts,
      verified,
      phone,
      whatsapp,
      description,
      userId,
    })),
  });

  await prisma.listing.createMany({
    data: listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      make: listing.make,
      model: listing.model,
      year: listing.year,
      price: listing.price,
      mileage: listing.mileage,
      transmission: listing.transmission,
      fuelType: listing.fuelType,
      bodyType: listing.bodyType,
      district: listing.district,
      city: listing.city,
      images: listing.images,
      description: listing.description,
      sellerId: listing.sellerId,
      sellerType: listing.sellerType,
      status: listing.status,
      vehicleNumber: listing.vehicleNumber,
      featuredUntil: listing.featuredUntil ? new Date(listing.featuredUntil) : null,
      soldAt: listing.soldAt ? new Date(listing.soldAt) : null,
      createdAt: new Date(listing.createdAt),
    })),
  });

  await seedAdminFromEnv(prisma);
  const categoryCount = await seedVehicleCategories(prisma);

  const [userCount, dealerCount, listingCount] = await Promise.all([
    prisma.user.count(),
    prisma.dealer.count(),
    prisma.listing.count(),
  ]);

  console.log(
    `Seeded ${userCount} users, ${dealerCount} dealers, ${listingCount} listings, ${categoryCount} vehicle categories.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
