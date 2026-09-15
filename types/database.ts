import type { BodyType, FuelType, ListingStatus, SellerType, Transmission, UserRole } from "@/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ListingRow = {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: Transmission;
  fuel_type: FuelType;
  body_type: BodyType;
  district: string;
  city: string;
  images: string[] | null;
  description: string;
  seller_id: string;
  seller_type: SellerType;
  status: ListingStatus;
  created_at: string;
};

export type DealerRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  districts: string[] | null;
  verified: boolean;
  phone: string;
  whatsapp: string;
  user_id: string;
};

export type UserRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
};

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: ListingRow;
        Insert: Partial<ListingRow> &
          Pick<
            ListingRow,
            | "title"
            | "make"
            | "model"
            | "year"
            | "price"
            | "mileage"
            | "transmission"
            | "fuel_type"
            | "body_type"
            | "district"
            | "city"
            | "description"
            | "seller_id"
            | "seller_type"
          >;
        Update: Partial<ListingRow>;
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      dealers: {
        Row: DealerRow;
        Insert: Partial<DealerRow> &
          Pick<DealerRow, "name" | "slug" | "phone" | "whatsapp" | "user_id">;
        Update: Partial<DealerRow>;
        Relationships: [
          {
            foreignKeyName: "dealers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> & Pick<UserRow, "name" | "phone" | "email">;
        Update: Partial<UserRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_private_listing: {
        Args: { payload: Json };
        Returns: string;
      };
    };
    Enums: {
      UserRole: UserRole;
      SellerType: SellerType;
      ListingStatus: ListingStatus;
      Transmission: Transmission;
      FuelType: FuelType;
      BodyType: BodyType;
    };
    CompositeTypes: Record<string, never>;
  };
};
