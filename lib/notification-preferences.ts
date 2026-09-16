export const NOTIFICATION_KEYS = [
  "enquiry_replies",
  "price_drops",
  "saved_searches",
  "marketing",
] as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];
export type NotificationChannel = "email" | "sms" | "whatsapp";

export type NotificationPreferenceDefinition = {
  key: NotificationKey;
  label: string;
  description: string;
  channels: NotificationChannel[];
  defaults: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
  };
};

export const NOTIFICATION_PREFERENCES: NotificationPreferenceDefinition[] = [
  {
    key: "enquiry_replies",
    label: "New enquiry replies",
    description: "Get notified when a seller responds to an enquiry you sent.",
    channels: ["email", "sms", "whatsapp"],
    defaults: { emailEnabled: true, smsEnabled: false, whatsappEnabled: true },
  },
  {
    key: "price_drops",
    label: "Price drops on favourited listings",
    description: "Hear about price cuts on cars you have saved.",
    channels: ["email", "sms", "whatsapp"],
    defaults: { emailEnabled: true, smsEnabled: false, whatsappEnabled: false },
  },
  {
    key: "saved_searches",
    label: "New listings matching saved searches",
    description: "A heads-up when new cars match searches you have saved.",
    channels: ["email", "sms", "whatsapp"],
    defaults: { emailEnabled: true, smsEnabled: false, whatsappEnabled: false },
  },
  {
    key: "marketing",
    label: "Marketing emails",
    description: "Occasional tips, featured stock, and CarsMW news. Email only.",
    channels: ["email"],
    defaults: { emailEnabled: false, smsEnabled: false, whatsappEnabled: false },
  },
];

export function isNotificationKey(value: string): value is NotificationKey {
  return (NOTIFICATION_KEYS as readonly string[]).includes(value);
}
