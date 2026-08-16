import travelData from "@/data/travel.json";

type AutoListing = { name: string; phones: string[]; notes?: string };

/** Phone lists for each auto listing (travel.json), for RandomTelButton. */
export function getAutoPhoneOptions(): string[][] {
  const autos = (travelData as { autos: AutoListing[] }).autos;
  return autos.map((a) => a.phones ?? []);
}
