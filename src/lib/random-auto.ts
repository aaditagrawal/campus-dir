import travelData from "@/data/travel.json";

type AutoListing = { name: string; phones: string[]; notes?: string };
type TravelData = { autos: AutoListing[] };

const travel: TravelData = travelData;

/** Phone lists for each auto listing (travel.json), for RandomTelButton. */
export function getAutoPhoneOptions(): string[][] {
  return travel.autos.map((a) => a.phones ?? []);
}
