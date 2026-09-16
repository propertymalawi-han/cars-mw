import { Resend } from "resend";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  debugUrl?: string;
};

const fromAddress =
  process.env.EMAIL_FROM?.trim() || "CarsMW <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, text, debugUrl }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(
      `[email] RESEND_API_KEY is not set. Skipping send to ${to}.`,
      debugUrl ? `Verify URL: ${debugUrl}` : "",
    );
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Failed to send email", error);
    throw new Error("Could not send email.");
  }
}
