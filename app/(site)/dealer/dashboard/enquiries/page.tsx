import type { Metadata } from "next";
import { DealerEnquiryInbox, type DealerEnquiryItem } from "@/components/dealer/enquiry-inbox";
import { getDealerEnquiries, requireDealerPage } from "@/lib/dealer";

export const metadata: Metadata = {
  title: "Dealer enquiries",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: { open?: string };
};

export default async function DealerEnquiriesPage({ searchParams }: PageProps) {
  const { user, dealer } = await requireDealerPage("/dealer/dashboard/enquiries");
  if (!dealer) return null;

  const rows = await getDealerEnquiries(dealer.id);
  const enquiries: DealerEnquiryItem[] = rows.map((enquiry) => ({
    id: enquiry.id,
    status: enquiry.status,
    message: enquiry.message,
    createdAt: enquiry.createdAt.toISOString(),
    listing: enquiry.listing,
    buyer: enquiry.user,
    messages: enquiry.messages.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,1.875rem)] font-semibold tracking-tight">
          Enquiries
        </h1>
        <p className="text-muted-foreground">
          Replies and status for every buyer message across your listings.
        </p>
      </div>
      <DealerEnquiryInbox
        enquiries={enquiries}
        userId={user.id}
        initialOpenId={searchParams.open}
      />
    </div>
  );
}
