"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleSignInButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { withReturnTo } from "@/lib/return-to";
import { cn } from "@/lib/utils";
import {
  signUpSchema,
  type SignUpInput,
  type SignUpValues,
} from "@/lib/validations/auth";
import { MALAWI_DISTRICTS } from "@/types";

const signUpDefaults: SignUpInput = {
  accountType: "individual",
  name: "",
  email: "",
  password: "",
  phone: "",
  dealerName: "",
  dealerPhone: "",
  whatsapp: "",
  districts: [],
};

export function SignUpForm({
  returnTo,
}: {
  returnTo: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "details">("choose");
  const [selectedType, setSelectedType] = useState<"individual" | "dealer" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: signUpDefaults,
    mode: "onTouched",
  });

  const accountType = form.watch("accountType");

  function chooseAccountType(next: "individual" | "dealer") {
    const current = form.getValues();
    if (next === "dealer") {
      form.reset({
        accountType: "dealer",
        name: current.name,
        email: current.email,
        password: current.password,
        phone: current.phone || "",
        dealerName: current.dealerName || "",
        dealerPhone: current.dealerPhone || current.phone || "",
        whatsapp: current.whatsapp || current.phone || "",
        districts: current.districts ?? [],
      });
      return;
    }

    form.reset({
      accountType: "individual",
      name: current.name,
      email: current.email,
      password: current.password,
      phone: current.phone || "",
      dealerName: "",
      dealerPhone: "",
      whatsapp: "",
      districts: [],
    });
  }

  async function onSubmit(values: SignUpValues) {
    setFormError(null);
    setPending(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setPending(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setFormError(payload?.error ?? "Could not create your account.");
      return;
    }

    router.push(
      withReturnTo(
        `/verify-email/sent?email=${encodeURIComponent(values.email)}`,
        returnTo,
      ),
    );
  }

  if (step === "choose") {
    return (
      <div className="space-y-5">
        <GoogleSignInButton returnTo={returnTo} />
        <AuthDivider />
        <RadioGroup
          className="grid gap-3 sm:grid-cols-2"
          value={selectedType ?? ""}
          onValueChange={(value) => setSelectedType(value as "individual" | "dealer")}
        >
          <AccountTypeCard
            value="individual"
            selected={selectedType === "individual"}
            icon={<UserRound className="size-5" />}
            title="I'm buying or selling as an individual"
            description="Browse listings and sell a personal car without a dealership profile."
          />
          <AccountTypeCard
            value="dealer"
            selected={selectedType === "dealer"}
            icon={<Building2 className="size-5" />}
            title="I'm a dealership"
            description="List stock, show a public dealer page, and request a Verified dealer badge."
          />
        </RadioGroup>
        <Button
          type="button"
          variant="copper"
          className="w-full"
          disabled={!selectedType}
          onClick={() => {
            if (!selectedType) return;
            chooseAccountType(selectedType);
            setStep("details");
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
        <p className="text-sm text-muted-foreground">
          {accountType === "dealer"
            ? "Creating a dealership account."
            : "Creating an individual account."}
        </p>
        <button
          type="button"
          className="shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setSelectedType(accountType);
            setStep("choose");
          }}
        >
          Change
        </button>
      </div>

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      {accountType === "individual" ? (
        <>
          <GoogleSignInButton returnTo={returnTo} />
          <AuthDivider />
        </>
      ) : null}

      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{accountType === "dealer" ? "Contact name" : "Full name"}</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {accountType === "dealer" ? (
            <>
              <FormField
                control={form.control}
                name="dealerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input autoComplete="organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dealerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business phone</FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp number</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="districts"
                render={() => (
                  <FormItem>
                    <FormLabel>Districts served</FormLabel>
                    <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                      {MALAWI_DISTRICTS.map((district) => (
                        <FormField
                          key={district}
                          control={form.control}
                          name="districts"
                          render={({ field }) => {
                            const checked = field.value?.includes(district);
                            return (
                              <label className="flex min-h-11 items-center gap-2 text-sm">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    const current = field.value ?? [];
                                    field.onChange(
                                      value
                                        ? [...current, district]
                                        : current.filter((item) => item !== district),
                                    );
                                  }}
                                />
                                {district}
                              </label>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="rounded-md border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                Dealer accounts start unverified. The{" "}
                <span className="font-medium text-foreground">Verified dealer</span> badge
                is added to your listings after a manual review by CarsMW — there is no
                self-serve verification yet.
              </p>
            </>
          ) : null}

          <Button type="submit" variant="copper" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function AccountTypeCard({
  value,
  selected,
  icon,
  title,
  description,
}: {
  value: "individual" | "dealer";
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <label className="block cursor-pointer">
      <Card
        className={cn(
          "h-full shadow-sm transition-colors hover:border-foreground/30",
          selected && "border-foreground ring-1 ring-foreground",
        )}
      >
        <CardHeader className="space-y-3">
          <span className="flex items-start justify-between gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-muted text-foreground">
              {icon}
            </span>
            <RadioGroupItem value={value} className="mt-1" />
          </span>
          <CardTitle className="text-sm font-semibold leading-snug">{title}</CardTitle>
          <CardDescription className="leading-snug">{description}</CardDescription>
        </CardHeader>
      </Card>
    </label>
  );
}
