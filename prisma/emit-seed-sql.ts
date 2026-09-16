import { dealers, listings, users } from "./seed-data";

function sqlStr(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlStrArr(values: string[]) {
  if (values.length === 0) return "'{}'";
  return `ARRAY[${values.map(sqlStr).join(", ")}]`;
}

const userRows = users
  .map(
    (user) =>
      `(${sqlStr(user.id)}, ${sqlStr(user.name)}, ${sqlStr(user.phone ?? "")}, ${sqlStr(user.email)}, ${sqlStr(user.role)}::"UserRole", ${sqlStr(user.accountType)}::"AccountType")`,
  )
  .join(",\n");

const dealerRows = dealers
  .map(
    (dealer) =>
      `(${sqlStr(dealer.id)}, ${sqlStr(dealer.name)}, ${sqlStr(dealer.slug)}, ${dealer.logoUrl ? sqlStr(dealer.logoUrl) : "NULL"}, ${sqlStrArr(dealer.districts)}, ${dealer.verified}, ${sqlStr(dealer.phone)}, ${sqlStr(dealer.whatsapp)}, ${sqlStr(dealer.description)}, ${sqlStr(dealer.userId)})`,
  )
  .join(",\n");

const listingRows = listings
  .map(
    (listing) =>
      `(${sqlStr(listing.id)}, ${sqlStr(listing.title)}, ${sqlStr(listing.make)}, ${sqlStr(listing.model)}, ${listing.year}, ${listing.price}, ${listing.mileage}, ${sqlStr(listing.transmission)}::"Transmission", ${sqlStr(listing.fuelType)}::"FuelType", ${sqlStr(listing.bodyType)}::"BodyType", ${sqlStr(listing.district)}, ${sqlStr(listing.city)}, ${sqlStrArr(listing.images)}, ${sqlStr(listing.description)}, ${sqlStr(listing.sellerId)}, ${sqlStr(listing.sellerType)}::"SellerType", ${sqlStr(listing.status)}::"ListingStatus", ${listing.featuredUntil ? `${sqlStr(listing.featuredUntil)}::timestamptz` : "NULL"}, ${sqlStr(listing.createdAt)}::timestamptz)`,
  )
  .join(",\n");

const sql = `DELETE FROM listings;
DELETE FROM dealers;
DELETE FROM users;

INSERT INTO users (id, name, phone, email, role, account_type) VALUES
${userRows};

INSERT INTO dealers (id, name, slug, logo_url, districts, verified, phone, whatsapp, description, user_id) VALUES
${dealerRows};

INSERT INTO listings (id, title, make, model, year, price, mileage, transmission, fuel_type, body_type, district, city, images, description, seller_id, seller_type, status, featured_until, created_at) VALUES
${listingRows};
`;

process.stdout.write(sql);
