"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listingsHref, parsePriceParam } from "@/lib/listing-filters";
import {
  BODY_TYPE_LABELS,
  COMMON_MAKES,
  type BodyType,
  type MalawiCity,
} from "@/types";

const HERO_BODY_TYPES = [
  "sedan",
  "suv",
  "pickup",
  "hatchback",
  "van",
] as const satisfies readonly BodyType[];

const LOCATIONS = ["Lilongwe", "Blantyre", "Mzuzu", "Zomba"] as const;

export function SearchPanel() {
  const router = useRouter();
  const [make, setMake] = useState("any");
  const [body, setBody] = useState("any");
  const [city, setCity] = useState("any");
  const [maxPrice, setMaxPrice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedMax = parsePriceParam(maxPrice);
    router.push(
      listingsHref({
        make: make === "any" ? undefined : make,
        body: body === "any" ? [] : [body as BodyType],
        city: city === "any" ? undefined : (city as MalawiCity),
        maxPrice: parsedMax,
        page: 1,
      }),
    );
  }

  return (
    <Card className="mt-8 p-4 shadow-md sm:mt-10 sm:p-5">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto]"
      >
        <Field label="Make" htmlFor="f-make">
          <Select value={make} onValueChange={setMake}>
            <SelectTrigger id="f-make" className="h-11">
              <SelectValue placeholder="Any make" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any make</SelectItem>
              {COMMON_MAKES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Body type" htmlFor="f-body">
          <Select value={body} onValueChange={setBody}>
            <SelectTrigger id="f-body" className="h-11">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any type</SelectItem>
              {HERO_BODY_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {BODY_TYPE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Location" htmlFor="f-loc">
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger id="f-loc" className="h-11">
              <SelectValue placeholder="Anywhere in Malawi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Anywhere in Malawi</SelectItem>
              {LOCATIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Max price (MWK)" htmlFor="f-price">
          <Input
            id="f-price"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="e.g. 25,000,000"
            inputMode="numeric"
            className="h-11"
          />
        </Field>
        <Button
          type="submit"
          variant="copper"
          size="lg"
          className="col-span-full h-11 w-full lg:col-auto lg:w-auto"
        >
          Search
        </Button>
      </form>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
