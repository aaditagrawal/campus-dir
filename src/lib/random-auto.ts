import travelData from "@/data/travel.json";

type AutoListing = { name: string; phones: string[]; notes?: string };

/** Picks a random phone from the autos list (travel.json) for tel: links. */
export function pickRandomAutoTel(): string | null {
  const autos = (travelData as { autos: AutoListing[] }).autos;
  if (autos.length === 0) return null;
  const listing = autos[Math.floor(Math.random() * autos.length)]!;
  const { phones } = listing;
  if (!phones?.length) return null;
  const phone = phones[Math.floor(Math.random() * phones.length)]!;
  return phone.replace(/\s+/g, "");
}
