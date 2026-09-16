"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  NOTIFICATION_PREFERENCES,
  type NotificationChannel,
  type NotificationKey,
} from "@/lib/notification-preferences";

export type NotificationPreferenceValue = {
  key: NotificationKey;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
};

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

function channelKey(channel: NotificationChannel) {
  if (channel === "email") return "emailEnabled" as const;
  if (channel === "sms") return "smsEnabled" as const;
  return "whatsappEnabled" as const;
}

function isEnabled(value: NotificationPreferenceValue) {
  return value.emailEnabled || value.smsEnabled || value.whatsappEnabled;
}

export function NotificationSettings({
  initial,
}: {
  initial: NotificationPreferenceValue[];
}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function update(key: NotificationKey, patch: Partial<NotificationPreferenceValue>) {
    let saved: NotificationPreferenceValue | undefined;
    setValues((current) => {
      const next = current.map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      );
      saved = next.find((item) => item.key === key);
      return next;
    });
    if (saved) void persist(saved, key);
  }

  async function persist(next: NotificationPreferenceValue, key: NotificationKey) {
    setError(null);
    const response = await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setError(json.error ?? "Could not save that setting.");
      setValues((current) =>
        current.map((item) =>
          item.key === key ? (initial.find((row) => row.key === key) ?? item) : item,
        ),
      );
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {NOTIFICATION_PREFERENCES.map((item) => {
        const value = values.find((entry) => entry.key === item.key);
        if (!value) return null;
        const enabled = isEnabled(value);
        return (
          <div key={item.key} className="rounded-lg border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    update(item.key, {
                      emailEnabled: true,
                      smsEnabled: false,
                      whatsappEnabled: item.channels.includes("whatsapp")
                        ? item.defaults.whatsappEnabled
                        : false,
                    });
                  } else {
                    update(item.key, {
                      emailEnabled: false,
                      smsEnabled: false,
                      whatsappEnabled: false,
                    });
                  }
                }}
                aria-label={item.label}
              />
            </div>
            {enabled && item.channels.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-4">
                {item.channels.map((channel) => {
                  const field = channelKey(channel);
                  return (
                    <label key={channel} className="inline-flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={value[field]}
                        onCheckedChange={(checked) => {
                          const next = { ...value, [field]: checked === true };
                          if (!isEnabled(next)) {
                            next.emailEnabled = item.channels.includes("email");
                          }
                          update(item.key, next);
                        }}
                      />
                      <span>{CHANNEL_LABEL[channel]}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
