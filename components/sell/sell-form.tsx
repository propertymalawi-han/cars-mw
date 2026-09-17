"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FormStepper } from "@/components/sell/form-stepper";
import { PhotoUploader } from "@/components/sell/photo-uploader";
import { VehicleId } from "@/components/vehicle-id";
import { formatMWK } from "@/lib/currency";
import { buildListingTitle } from "@/lib/listing-title";
import {
  listingFormDefaults,
  listingSchema,
  SELL_STEPS,
  type ListingFormInput,
  type ListingFormValues,
  type SellStepId,
} from "@/lib/validations/listing";
import {
  BODY_TYPE_LABELS,
  BODY_TYPES,
  COMMON_MAKES,
  FUEL_TYPES,
  MALAWI_CITIES,
  MALAWI_DISTRICTS,
  TRANSMISSIONS,
} from "@/types";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function numberInputValue(value: unknown) {
  return typeof value === "number" && !Number.isNaN(value) ? value : "";
}

export function SellForm({
  defaultValues,
  listingId,
  vehicleNumber,
  redirectTo,
}: {
  defaultValues?: Partial<ListingFormInput>;
  listingId?: string;
  vehicleNumber?: number;
  redirectTo?: string;
} = {}) {
  const router = useRouter();
  const publishLock = useRef(false);
  const [step, setStep] = useState<SellStepId>("vehicle");
  const [highest, setHighest] = useState<SellStepId>(listingId ? "review" : "vehicle");
  const [photosUploading, setPhotosUploading] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const form = useForm<ListingFormInput, unknown, ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: { ...listingFormDefaults, ...defaultValues },
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const { isSubmitting } = form.formState;
  const publishing = isSubmitting || published;

  const currentIndex = SELL_STEPS.findIndex((item) => item.id === step);
  const isLast = currentIndex === SELL_STEPS.length - 1;
  const values = form.watch();
  const generatedTitle = buildListingTitle({
    year: values.year,
    make: values.make,
    model: values.model,
  });

  function goTo(next: SellStepId) {
    const nextIndex = SELL_STEPS.findIndex((item) => item.id === next);
    const highestIndex = SELL_STEPS.findIndex((item) => item.id === highest);
    if (nextIndex > highestIndex) {
      setHighest(next);
    }
    setStep(next);
    setPublishError(null);
  }

  async function handleNext() {
    const fields = SELL_STEPS[currentIndex]?.fields ?? [];
    const valid = fields.length === 0 ? true : await form.trigger(fields);
    if (!valid || photosUploading) return;
    const next = SELL_STEPS[currentIndex + 1];
    if (next) goTo(next.id);
  }

  function handleBack() {
    const previous = SELL_STEPS[currentIndex - 1];
    if (previous) goTo(previous.id);
  }

  async function onPublish(data: ListingFormValues) {
    if (publishLock.current) return;
    publishLock.current = true;
    setPublishError(null);
    try {
      const response = await fetch(listingId ? `/api/listings/${listingId}` : "/api/listings", {
        method: listingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          title: buildListingTitle(data),
        }),
      });
      if (response.status === 401) {
        publishLock.current = false;
        router.push("/sign-in?returnTo=%2Fsell");
        return;
      }
      const json = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !json.id) {
        publishLock.current = false;
        setPublishError(json.error ?? "Could not publish the listing.");
        return;
      }
      setPublished(true);
      router.replace(redirectTo ?? "/account/listings");
    } catch {
      publishLock.current = false;
      setPublishError("Could not publish the listing.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (publishLock.current || published) return;
          if (step !== "review") {
            void handleNext();
            return;
          }
          void form.handleSubmit(onPublish)();
        }}
        className="space-y-6"
      >
        <Tabs
          value={step}
          onValueChange={(value) => goTo(value as SellStepId)}
        >
          <FormStepper current={step} highest={highest} onStepSelect={goTo} />

          <Card className="mt-6 shadow-sm">
            <TabsContent value="vehicle" className="mt-0">
              <CardHeader>
                <CardTitle className="text-xl">Vehicle details</CardTitle>
                <CardDescription>
                  Tell buyers what you are selling and where they can view it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input
                            list="common-makes"
                            placeholder="Toyota"
                            {...field}
                          />
                        </FormControl>
                        <datalist id="common-makes">
                          {COMMON_MAKES.map((make) => (
                            <option key={make} value={make} />
                          ))}
                        </datalist>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Hilux" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            placeholder="2018"
                            value={numberInputValue(field.value)}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === "" ? "" : event.target.valueAsNumber,
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mileage (km)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            placeholder="86400"
                            value={numberInputValue(field.value)}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value === "" ? "" : event.target.valueAsNumber,
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generated-listing-title">Listing title</Label>
                  <Input
                    id="generated-listing-title"
                    readOnly
                    tabIndex={-1}
                    value={generatedTitle}
                    placeholder="2018 BMW X5"
                    className="bg-muted/50"
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Generated from year, make, and model. Buyers will see this on
                    your listing.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="bodyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body type</FormLabel>
                        <SelectField
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select body type"
                        >
                          {BODY_TYPES.map((bodyType) => (
                            <SelectItem key={bodyType} value={bodyType}>
                              {BODY_TYPE_LABELS[bodyType]}
                            </SelectItem>
                          ))}
                        </SelectField>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="transmission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission</FormLabel>
                        <SelectField
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select transmission"
                        >
                          {TRANSMISSIONS.map((transmission) => (
                            <SelectItem key={transmission} value={transmission}>
                              {titleCase(transmission)}
                            </SelectItem>
                          ))}
                        </SelectField>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fuelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel</FormLabel>
                        <SelectField
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select fuel type"
                        >
                          {FUEL_TYPES.map((fuelType) => (
                            <SelectItem key={fuelType} value={fuelType}>
                              {titleCase(fuelType)}
                            </SelectItem>
                          ))}
                        </SelectField>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <SelectField
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a district"
                        >
                          {MALAWI_DISTRICTS.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectField>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <SelectField
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select a city"
                        >
                          {MALAWI_CITIES.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectField>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={5}
                          placeholder="Condition, service history, extras, and where the car can be viewed."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </TabsContent>

            <TabsContent value="photos" className="mt-0">
              <CardHeader>
                <CardTitle className="text-xl">Photos</CardTitle>
                <CardDescription>
                  Upload clear photos of the exterior, interior, and any damage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <PhotoUploader
                        value={field.value}
                        onChange={(urls) => field.onChange(urls)}
                        onUploadingChange={setPhotosUploading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </TabsContent>

            <TabsContent value="price" className="mt-0">
              <CardHeader>
                <CardTitle className="text-xl">Asking price</CardTitle>
                <CardDescription>
                  Price the car in Malawian Kwacha. Buyers will see this on the listing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Price (MWK)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          placeholder="18500000"
                          value={numberInputValue(field.value)}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === "" ? "" : event.target.valueAsNumber,
                            )
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        {typeof field.value === "number" && field.value > 0
                          ? formatMWK(field.value)
                          : "Enter a whole amount, without tambala."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </TabsContent>

            <TabsContent value="contact" className="mt-0">
              <CardHeader>
                <CardTitle className="text-xl">Seller contact</CardTitle>
                <CardDescription>
                  Buyers will use these details to call or WhatsApp you about the car.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sellerName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input placeholder="Yankho Moyo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sellerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="+265 888 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </TabsContent>

            <TabsContent value="review" className="mt-0">
              <CardHeader>
                <CardTitle className="text-xl">Review and publish</CardTitle>
                <CardDescription>
                  Check everything looks right. You can go back to any step to edit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {typeof vehicleNumber === "number" ? (
                  <ReviewSection title="Vehicle ID">
                    <ReviewRow
                      label="ID"
                      value={
                        <VehicleId
                          vehicleNumber={vehicleNumber}
                          className="font-semibold"
                        />
                      }
                    />
                  </ReviewSection>
                ) : null}

                <ReviewSection title="Vehicle" onEdit={() => goTo("vehicle")}>
                  <ReviewRow label="Title" value={generatedTitle} />
                  <ReviewRow label="Make" value={values.make} />
                  <ReviewRow label="Model" value={values.model} />
                  <ReviewRow label="Year" value={values.year ? String(values.year) : ""} />
                  <ReviewRow
                    label="Mileage"
                    value={
                      typeof values.mileage === "number"
                        ? `${values.mileage.toLocaleString("en-MW")} km`
                        : ""
                    }
                  />
                  <ReviewRow
                    label="Body type"
                    value={values.bodyType ? BODY_TYPE_LABELS[values.bodyType] : ""}
                  />
                  <ReviewRow
                    label="Transmission"
                    value={values.transmission ? titleCase(values.transmission) : ""}
                  />
                  <ReviewRow
                    label="Fuel"
                    value={values.fuelType ? titleCase(values.fuelType) : ""}
                  />
                  <ReviewRow label="City" value={values.city} />
                  <ReviewRow label="District" value={values.district} />
                  <ReviewRow label="Description" value={values.description} />
                </ReviewSection>

                <ReviewSection title="Photos" onEdit={() => goTo("photos")}>
                  {values.images.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No photos yet.</p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {values.images.map((url, index) => (
                        <li key={url} className="relative overflow-hidden rounded-md border bg-muted">
                          <div className="relative aspect-[16/10] w-full">
                            <Image
                              src={url}
                              alt={`Photo ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(min-width: 640px) 25vw, 50vw"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </ReviewSection>

                <ReviewSection title="Price" onEdit={() => goTo("price")}>
                  <ReviewRow
                    label="Asking price"
                    value={typeof values.price === "number" ? formatMWK(values.price) : ""}
                  />
                </ReviewSection>

                <ReviewSection title="Seller" onEdit={() => goTo("contact")}>
                  <ReviewRow label="Name" value={values.sellerName} />
                  <ReviewRow label="Email" value={values.sellerEmail} />
                  <ReviewRow label="Phone" value={values.phone} />
                </ReviewSection>

                {publishError ? (
                  <p className="text-sm font-medium text-destructive">{publishError}</p>
                ) : null}
              </CardContent>
            </TabsContent>

            <CardFooter className="flex-col-reverse gap-3 border-t px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={handleBack}
                disabled={currentIndex === 0 || publishing}
              >
                Back
              </Button>
              {isLast ? (
                <Button
                  type="submit"
                  variant="copper"
                  className="h-11 w-full sm:w-auto"
                  disabled={publishing || photosUploading}
                >
                  {publishing
                    ? listingId
                      ? "Saving…"
                      : "Publishing…"
                    : listingId
                      ? "Save listing"
                      : "Publish listing"}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-11 w-full sm:w-auto"
                  onClick={() => void handleNext()}
                  disabled={photosUploading}
                >
                  Continue
                </Button>
              )}
            </CardFooter>
          </Card>
        </Tabs>
      </form>
    </Form>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  children,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  children: ReactNode;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onEdit ? (
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-lg border">{children}</div>
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b px-3 py-2.5 text-sm last:border-b-0 xs:grid-cols-[7.5rem_1fr] xs:gap-3 sm:grid-cols-[8.5rem_1fr] sm:px-4">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium">{value || "—"}</dd>
    </div>
  );
}

export { SellForm as ListingForm };
