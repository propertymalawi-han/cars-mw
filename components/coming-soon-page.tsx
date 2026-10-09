import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { comingSoonCopy } from "@/lib/site-settings";

export function ComingSoonPage({ message }: { message: string }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-primary text-primary-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(16_72%_42%/0.35),transparent_42%),linear-gradient(180deg,hsl(218_41%_14%),hsl(218_41%_8%))]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <BrandMark light />
        <p className="mt-10 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-copper">
          Coming soon
        </p>
        <h1 className="mt-3 text-balance text-[clamp(2rem,1.4rem+2vw,3rem)] font-bold leading-[1.1] tracking-tight">
          We&apos;ll be back shortly
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-primary-foreground/75">
          {comingSoonCopy(message)}
        </p>
        <Link
          href="/sign-in?returnTo=/admin"
          className="mt-10 text-sm text-primary-foreground/60 underline-offset-4 hover:text-primary-foreground hover:underline"
        >
          Staff sign in
        </Link>
      </div>
    </div>
  );
}

export function StaffComingSoonBanner() {
  return (
    <div className="bg-copper px-4 py-2 text-center text-sm text-copper-foreground">
      Coming soon is on for visitors. You can still browse because you are signed in as staff.{" "}
      <Link href="/admin" className="font-semibold underline-offset-4 hover:underline">
        Open dashboard
      </Link>
    </div>
  );
}
