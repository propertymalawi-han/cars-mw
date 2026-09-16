import { z } from "zod";
import {
  BODY_TYPES,
  FUEL_TYPES,
  MALAWI_CITIES,
  MALAWI_DISTRICTS,
  TRANSMISSIONS,
} from "@/types";

const currentYear = new Date().getFullYear();

const requiredInt = (message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number({ error: message }).int({ error: message }),
  );

export const vehicleStepSchema = z.object({
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  year: requiredInt("Enter the year")
    .refine((year) => year >= 1980, "Year must be 1980 or later")
    .refine(
      (year) => year <= currentYear + 1,
      `Year cannot be after ${currentYear + 1}`,
    ),
  mileage: requiredInt("Enter the mileage").refine(
    (mileage) => mileage >= 0,
    "Mileage cannot be negative",
  ),
  city: z.enum(MALAWI_CITIES, { message: "Select a city in Malawi" }),
  district: z.enum(MALAWI_DISTRICTS, { message: "Select a district" }),
  bodyType: z.enum(BODY_TYPES, { message: "Select a body type" }),
  transmission: z.enum(TRANSMISSIONS, { message: "Select a transmission" }),
  fuelType: z.enum(FUEL_TYPES, { message: "Select a fuel type" }),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters"),
});

export const photosStepSchema = z.object({
  images: z
    .array(z.string().url("Each photo must be a valid upload URL"))
    .min(1, "Add at least one photo")
    .max(12, "You can add up to 12 photos"),
});

export const priceStepSchema = z.object({
  price: requiredInt("Enter the price in MWK").refine(
    (price) => price > 0,
    "Price must be greater than 0",
  ),
});

export const contactStepSchema = z.object({
  sellerName: z.string().trim().min(2, "Enter your name"),
  sellerEmail: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number"),
});

export const listingSchema = vehicleStepSchema
  .merge(photosStepSchema)
  .merge(priceStepSchema)
  .merge(contactStepSchema);

export type VehicleStepValues = z.infer<typeof vehicleStepSchema>;
export type PhotosStepValues = z.infer<typeof photosStepSchema>;
export type PriceStepValues = z.infer<typeof priceStepSchema>;
export type ContactStepValues = z.infer<typeof contactStepSchema>;
export type ListingFormValues = z.output<typeof listingSchema>;
export type ListingFormInput = z.input<typeof listingSchema>;

export const SELL_STEPS = [
  {
    id: "vehicle",
    label: "Vehicle",
    description: "Car details",
    fields: [
      "make",
      "model",
      "year",
      "mileage",
      "city",
      "district",
      "bodyType",
      "transmission",
      "fuelType",
      "description",
    ] as const satisfies readonly (keyof ListingFormValues)[],
  },
  {
    id: "photos",
    label: "Photos",
    description: "Upload images",
    fields: ["images"] as const satisfies readonly (keyof ListingFormValues)[],
  },
  {
    id: "price",
    label: "Price",
    description: "Asking price",
    fields: ["price"] as const satisfies readonly (keyof ListingFormValues)[],
  },
  {
    id: "contact",
    label: "Contact",
    description: "Seller info",
    fields: [
      "sellerName",
      "sellerEmail",
      "phone",
    ] as const satisfies readonly (keyof ListingFormValues)[],
  },
  {
    id: "review",
    label: "Review",
    description: "Publish",
    fields: [] as const satisfies readonly (keyof ListingFormValues)[],
  },
] as const;

export type SellStepId = (typeof SELL_STEPS)[number]["id"];

export const listingFormDefaults: ListingFormInput = {
  make: "",
  model: "",
  year: undefined,
  mileage: undefined,
  city: "" as ListingFormInput["city"],
  district: "" as ListingFormInput["district"],
  bodyType: "" as ListingFormInput["bodyType"],
  transmission: "" as ListingFormInput["transmission"],
  fuelType: "" as ListingFormInput["fuelType"],
  description: "",
  images: [],
  price: undefined,
  sellerName: "",
  sellerEmail: "",
  phone: "",
};
