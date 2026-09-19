import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export async function seedAdminFromEnv(prisma: PrismaClient) {
  loadEnvFiles();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log("ADMIN_EMAIL is not set; skipping admin seed.");
    return;
  }

  if (!email.includes("@")) {
    console.warn("ADMIN_EMAIL is not a valid email; skipping admin seed.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "admin") {
      console.log(`Admin already exists for ${email}.`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { role: "admin" },
    });
    console.log(`Promoted ${email} to admin. Sign out and sign in again to refresh access.`);
    return;
  }

  await prisma.user.create({
    data: {
      name: "CarsMW Admin",
      email,
      role: "admin",
      accountType: "individual",
      emailVerified: new Date(),
    },
  });
  console.log(
    `Created admin user ${email}. Sign in or register with this email to access /admin.`,
  );
}

async function main() {
  loadEnvFiles();
  const prisma = new PrismaClient();
  try {
    await seedAdminFromEnv(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
