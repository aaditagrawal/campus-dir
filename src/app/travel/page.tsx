"use client";

import data from "@/data/travel.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";

type Listing = { name: string; phones: string[]; notes?: string };
type TravelData = { autos: Listing[]; cabs: Listing[] };

function renderNotesWithLinks(notes: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = notes.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default function TravelPage() {
  const travel = data as TravelData;
  const Section = ({ title, items }: { title: string; items: Listing[] }) => (
    <div className="space-y-4 scroll-mt-24" id={slugify(title)}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((i) => (
          <Card
            key={i.name}
            id={slugify(i.name)}
            className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{i.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `travel-${slugify(title)}-${slugify(i.name)}`,
                    type: "travel",
                    name: i.name,
                    href: `/travel#${slugify(i.name)}`,
                    phones: i.phones,
                    subtitle: title,
                  }}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                {i.phones.map((p) => (
                  <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="underline">
                    {p}
                  </a>
                ))}
              </div>
              {i.notes && (
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {renderNotesWithLinks(i.notes)}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    window.location.href = `tel:${i.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
                  }}
                  className="gap-2"
                >
                  <Phone className="size-4" />
                  Call Now
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const v = buildVCard({ name: i.name, phones: i.phones, org: "Travel" });
                    downloadVCardFile(i.name, v);
                  }}
                >
                  Download contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Travel</h1>
        <p className="text-muted-foreground">Autos, cabs and taxi transport.</p>
      </div>
      <div className="space-y-8">
        <Section title="Autos" items={travel.autos} />
        <div className="space-y-4 scroll-mt-24" id={slugify("Cabs & Taxis")}>
          <h2 className="text-xl font-semibold">Cabs & Taxis</h2>
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">
              Udupi Manipal Taxi Union - Airport Prices (After Jan 2026)
            </h3>
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
              <Card
                key={i.name}
                id={slugify(i.name)}
                className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{i.name}</CardTitle>
                    <FavoriteButton
                      item={{
                        id: `travel-cabs-taxis-${slugify(i.name)}`,
                        type: "travel",
                        name: i.name,
                        href: `/travel#${slugify(i.name)}`,
                        phones: i.phones,
                        subtitle: "Cabs & Taxis",
                      }}
                      size="sm"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    {i.phones.map((p) => (
                      <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="underline">
                        {p}
                      </a>
                    ))}
                  </div>
                  {i.notes && (
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {renderNotesWithLinks(i.notes)}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        window.location.href = `tel:${i.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
                      }}
                      className="gap-2"
                    >
                      <Phone className="size-4" />
                      Call Now
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const v = buildVCard({ name: i.name, phones: i.phones, org: "Travel" });
                        downloadVCardFile(i.name, v);
                      }}
                    >
                      Download contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
