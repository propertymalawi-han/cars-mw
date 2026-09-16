import type { Metadata } from "next";
import { EnquiryList, type EnquiryThreadItem } from "@/components/account/enquiry-list";
import { getUserEnquiries } from "@/lib/account";
import { requirePageUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Enquiries",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: { open?: string };
};

export default async function EnquiriesPage({ searchParams }: PageProps) {
  const user = await requirePageUser("/account/enquiries");
  const rows = await getUserEnquiries(user.id);

  const enquiries: EnquiryThreadItem[] = rows.map((enquiry) => ({
    id: enquiry.id,
    status: enquiry.status,
    message: enquiry.message,
    createdAt: enquiry.createdAt.toISOString(),
    listing: {
      id: enquiry.listing.id,
      title: enquiry.listing.title,
      make: enquiry.listing.make,
      model: enquiry.listing.model,
      year: enquiry.listing.year,
      images: enquiry.listing.images,
    },
    dealer: enquiry.dealer ? { id: enquiry.dealer.id, name: enquiry.dealer.name } : null,
    messages: enquiry.messages.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        avatarUrl: message.sender.avatarUrl,
      },
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Manage enquiries
        </h1>
        <p className="text-muted-foreground">
          Messages you have sent to sellers, and their replies.
        </p>
      </div>
      <EnquiryList
        enquiries={enquiries}
        userId={user.id}
        initialOpenId={searchParams.open}
      />
    </div>
  );
}
