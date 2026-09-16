import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/return-to";
import { sendEmail } from "@/lib/email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateVerificationToken() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}

export async function createEmailVerificationToken(email: string) {
  const identifier = email.toLowerCase();
  const { token, hash } = generateVerificationToken();

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hash,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return token;
}

export async function sendVerificationEmail(email: string, name: string) {
  const token = await createEmailVerificationToken(email);
  const verifyUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: email,
    subject: "Verify your CarsMW account",
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Confirm your email to finish setting up your CarsMW account.</p>
      <p><a href="${verifyUrl}">Verify email address</a></p>
      <p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
    `,
    text: `Hi ${name},\n\nConfirm your email to finish setting up your CarsMW account:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    debugUrl: verifyUrl,
  });
}

export async function verifyEmailToken(email: string, token: string) {
  const identifier = email.toLowerCase();
  const hash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({
    where: { token: hash },
  });

  if (!record || record.identifier !== identifier) {
    return { ok: false as const, reason: "invalid" };
  }

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token: hash } }).catch(() => undefined);
    return { ok: false as const, reason: "expired" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: hash } }),
  ]);

  return { ok: true as const };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
