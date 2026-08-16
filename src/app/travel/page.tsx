import data from "@/data/travel.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { DownloadVCardButton } from "@/components/contact-actions";

type Listing = { name: string; phones: string[]; notes?: string };
type TravelData = { autos: Listing[]; cabs: Listing[] };

function renderNotesWithLinks(notes: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = notes.split(urlRegex);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
        {part}
      </a>
    ) : (
      part
    )
  );
}

function ListingCard({ listing, sectionTitle }: { listing: Listing; sectionTitle: string }) {
  return (
    <Card id={slugify(listing.name)} className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{listing.name}</CardTitle>
          <FavoriteButton
            item={{
              id: `travel-${slugify(sectionTitle)}-${slugify(listing.name)}`,
              type: "travel",
              name: listing.name,
              href: `/travel#${slugify(listing.name)}`,
              phones: listing.phones,
              subtitle: sectionTitle,
            }}
            size="sm"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          {listing.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="underline">
              {p}
            </a>
          ))}
        </div>
        {listing.notes && <div className="text-sm text-muted-foreground leading-relaxed">{renderNotesWithLinks(listing.notes)}</div>}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="secondary" size="sm" className="gap-2">
            <a href={`tel:${listing.phones?.[0]?.replace(/\s+/g, "") ?? ""}`}>
              <Phone className="size-4" />
              Call Now
            </a>
          </Button>
          <DownloadVCardButton
            size="sm"
            filename={listing.name}
            vcard={buildVCard({ name: listing.name, phones: listing.phones, org: "Travel" })}
          >
            Download contact
          </DownloadVCardButton>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TravelPage() {
  const travel = data as TravelData;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Travel</h1>
        <p className="text-muted-foreground">Autos, cabs and taxi transport.</p>
      </div>
      <div className="space-y-8">
        <div className="space-y-4 scroll-mt-24" id={slugify("Autos")}>
          <h2 className="text-xl font-semibold">Autos</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {travel.autos.map((i) => (
              <ListingCard key={i.name} listing={i} sectionTitle="Autos" />
            ))}
          </div>
        </div>
        <div className="space-y-4 scroll-mt-24" id={slugify("Cabs & Taxis")}>
          <h2 className="text-xl font-semibold">Cabs & Taxis</h2>
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Udupi Manipal Taxi Union - Airport Prices (After Jan 2026)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Vehicle</th>
                    <th className="text-right py-2 font-medium">Airport Drop</th>
                    <th className="text-right py-2 font-medium">Airport Pick Up</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-muted/50">
                    <td className="py-2">Small Car</td>
                    <td className="text-right py-2">₹1700</td>
                    <td className="text-right py-2">₹1800</td>
                  </tr>
                  <tr className="border-b border-muted/50">
                    <td className="py-2">Ertiga</td>
                    <td className="text-right py-2">₹2200</td>
                    <td className="text-right py-2">₹2300</td>
                  </tr>
                  <tr className="border-b border-muted/50">
                    <td className="py-2">Innova</td>
                    <td className="text-right py-2">₹2800</td>
                    <td className="text-right py-2">₹2900</td>
                  </tr>
                  <tr>
                    <td className="py-2">Innova Crista</td>
                    <td className="text-right py-2">₹3000</td>
                    <td className="text-right py-2">₹3100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {travel.cabs.map((i) => (
              <ListingCard key={i.name} listing={i} sectionTitle="Cabs & Taxis" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
