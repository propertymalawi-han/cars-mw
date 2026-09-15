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
