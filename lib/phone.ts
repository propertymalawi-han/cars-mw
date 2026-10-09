export function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

export function whatsappHref(phone: string, message?: string) {
  const url = `https://wa.me/${digitsOnly(phone)}`;
  if (!message) return url;
  return `${url}?text=${encodeURIComponent(message)}`;
}

export function telHref(phone: string) {
  return `tel:+${digitsOnly(phone)}`;
}

export function isPlausiblePhone(phone: string) {
  return digitsOnly(phone).length >= 8;
}

/** Group a Malawi number as the seller types, keeping a plain digit string valid. */
export function formatPhoneInput(value: string) {
  const digits = digitsOnly(value);
  if (!digits) return "";

  if (digits.startsWith("265")) {
    const local = digits.slice(3, 12);
    const parts = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 9)].filter(Boolean);
    return parts.length ? `+265 ${parts.join(" ")}` : "+265";
  }

  if (digits.startsWith("0")) {
    const local = digits.slice(0, 10);
    const parts = [local.slice(0, 4), local.slice(4, 7), local.slice(7, 10)].filter(Boolean);
    return parts.join(" ");
  }

  return digits;
}
