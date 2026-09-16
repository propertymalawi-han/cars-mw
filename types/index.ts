export const MALAWI_CITIES = [
  "Lilongwe",
  "Blantyre",
  "Mzuzu",
  "Zomba",
  "Mangochi",
  "Kasungu",
] as const;

export const MALAWI_DISTRICTS = [
  "Balaka",
  "Blantyre",
  "Chikwawa",
  "Chiradzulu",
  "Chitipa",
  "Dedza",
  "Dowa",
  "Karonga",
  "Kasungu",
  "Likoma",
  "Lilongwe",
  "Machinga",
  "Mangochi",
  "Mchinji",
  "Mulanje",
  "Mwanza",
  "Mzimba",
  "Neno",
  "Nkhata Bay",
  "Nkhotakota",
  "Nsanje",
  "Ntcheu",
  "Ntchisi",
  "Phalombe",
  "Rumphi",
  "Salima",
  "Thyolo",
  "Zomba",
] as const;

export const BODY_TYPES = [
  "sedan",
  "suv",
  "pickup",
  "hatchback",
  "van",
  "other",
] as const;

export const BODY_TYPE_LABELS: Record<(typeof BODY_TYPES)[number], string> = {
  sedan: "Sedan",
  suv: "SUV / 4x4",
  pickup: "Pickup / Bakkie",
  hatchback: "Hatchback",
  van: "Minibus",
  other: "Other",
};

export const TRANSMISSIONS = ["automatic", "manual"] as const;

export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric"] as const;

export const SELLER_TYPES = ["dealer", "private"] as const;

export const LISTING_STATUSES = ["active", "sold", "draft", "expired"] as const;

export const USER_ROLES = ["user", "dealer", "admin"] as const;

export const ACCOUNT_TYPES = ["individual", "dealer"] as const;

export const ENQUIRY_STATUSES = ["pending", "replied", "closed"] as const;

export const COMMON_MAKES = [
  "Toyota",
  "Nissan",
  "Honda",
  "Mazda",
  "Mitsubishi",
  "Suzuki",
] as const;

export type MalawiCity = (typeof MALAWI_CITIES)[number];
export type MalawiDistrict = (typeof MALAWI_DISTRICTS)[number];
export type BodyType = (typeof BODY_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type SellerType = (typeof SELLER_TYPES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  role: UserRole;
  accountType: AccountType;
  avatarUrl: string | null;
  emailVerified?: string | null;
}

export interface Dealer {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  districts: MalawiDistrict[];
  verified: boolean;
  phone: string;
  whatsapp: string;
  description: string;
  /** Owning user; listing.sellerId equals this when sellerType is dealer. */
  userId: string;
}

export interface Listing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  /** Price in Malawian Kwacha (integer, no decimals). */
  price: number;
  mileage: number;
  transmission: Transmission;
  fuelType: FuelType;
  bodyType: BodyType;
  district: MalawiDistrict;
  city: MalawiCity;
  images: string[];
  description: string;
  sellerId: string;
  sellerType: SellerType;
  status: ListingStatus;
  featuredUntil?: string | null;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  userId: string;
  listingId: string;
  dealerId: string | null;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}
