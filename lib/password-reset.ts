import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/return-to";
import { sendEmail } from "@/lib/email";
import { generateVerificationToken, hashToken } from "@/lib/email-verification";
import { hashPassword } from "@/lib/password";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function resetIdentifier(email: string) {
  return `password-reset:${email.toLowerCase()}`;
}

export async function sendPasswordResetEmail(email: string, name: string) {
  const identifier = resetIdentifier(email);
  const { token, hash } = generateVerificationToken();

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hash,
      expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.toLowerCase())}`;

  await sendEmail({
    to: email,
    subject: "Reset your CarsMW password",
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>We received a request to reset your CarsMW password.</p>
      <p><a href="${resetUrl}">Choose a new password</a></p>
      <p>This link expires in 1 hour. If you did not ask to reset your password, you can ignore this email.</p>
    `,
    text: `Hi ${name},\n\nReset your CarsMW password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not ask to reset your password, you can ignore this email.`,
    debugUrl: resetUrl,
  });
}

export async function resetPasswordWithToken(email: string, token: string, password: string) {
  const identifier = resetIdentifier(email);
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

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    await prisma.verificationToken.delete({ where: { token: hash } }).catch(() => undefined);
    return { ok: false as const, reason: "invalid" };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: new Date(),
      },
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
