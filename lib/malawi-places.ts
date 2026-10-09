import { MALAWI_DISTRICTS, type MalawiCity, type MalawiDistrict } from "@/types";

/**
 * Nearest listing city for each district. Cities that share a name with a
 * district use that city; Mzuzu stands in for the northern districts.
 */
const CITY_BY_DISTRICT: Record<MalawiDistrict, MalawiCity> = {
  Balaka: "Zomba",
  Blantyre: "Blantyre",
  Chikwawa: "Blantyre",
  Chiradzulu: "Blantyre",
  Chitipa: "Mzuzu",
  Dedza: "Lilongwe",
  Dowa: "Lilongwe",
  Karonga: "Mzuzu",
  Kasungu: "Kasungu",
  Likoma: "Mzuzu",
  Lilongwe: "Lilongwe",
  Machinga: "Zomba",
  Mangochi: "Mangochi",
  Mchinji: "Lilongwe",
  Mulanje: "Blantyre",
  Mwanza: "Blantyre",
  Mzimba: "Mzuzu",
  Neno: "Blantyre",
  "Nkhata Bay": "Mzuzu",
  Nkhotakota: "Lilongwe",
  Nsanje: "Blantyre",
  Ntcheu: "Lilongwe",
  Ntchisi: "Lilongwe",
  Phalombe: "Blantyre",
  Rumphi: "Mzuzu",
  Salima: "Lilongwe",
  Thyolo: "Blantyre",
  Zomba: "Zomba",
};

export function cityForDistrict(district: string): MalawiCity | undefined {
  if (!(MALAWI_DISTRICTS as readonly string[]).includes(district)) return undefined;
  return CITY_BY_DISTRICT[district as MalawiDistrict];
}
