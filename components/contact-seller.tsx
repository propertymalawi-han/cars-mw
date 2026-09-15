"use client";

import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { telHref, whatsappHref } from "@/lib/phone";

export function ContactSeller({
  phone,
  whatsapp,
  listingTitle,
}: {
  phone: string;
  whatsapp: string;
  listingTitle: string;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!phone && !whatsapp) {
    return (
      <p className="text-sm text-muted-foreground">
        Contact details are not available for this seller yet.
      </p>
    );
  }

  const chatHref = whatsappHref(
    whatsapp || phone,
    `Hi, I'm interested in your ${listingTitle} listed on CarsMW.`,
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Contact seller</h3>
      {whatsapp || phone ? (
        <Button asChild variant="copper" className="w-full">
          <a href={chatHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
            WhatsApp
          </a>
        </Button>
      ) : null}
      {phone ? (
        revealed ? (
          <Button asChild variant="outline" className="w-full">
            <a href={telHref(phone)}>
              <Phone />
              {phone}
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setRevealed(true)}
          >
            <Phone />
            Show phone number
          </Button>
        )
      ) : null}
    </div>
  );
}
