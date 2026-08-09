"use client";

import data from "@/data/services.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorite-button";

type Listing = { name: string; phones: string[]; notes?: string };
type ServicesData = { laundry: Listing[]; xerox: Listing[] };

export default function ServicesPage() {
  const services = data as ServicesData;
  const Section = ({ title, items }: { title: string; items: Listing[] }) => (
    <div className="space-y-2 scroll-mt-24" id={slugify(title)}>
      <h2 className="text-xl">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((i) => (
          <Card key={i.name} id={slugify(i.name)} className="glass scroll-mt-24">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{i.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `service-${slugify(title)}-${slugify(i.name)}`,
                    type: "service",
                    name: i.name,
                    href: `/services#${slugify(i.name)}`,
                    phones: i.phones,
                    subtitle: title,
                  }}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2 items-center">
                {i.phones.map((p) => (
                  <a key={p} href={`tel:${p}`} className="underline">
                    {p}
                  </a>
                ))}
              </div>
              {i.notes && <div className="text-muted-foreground">{i.notes}</div>}
              <div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const v = buildVCard({
                      name: i.name,
                      phones: i.phones,
                      org: "General Services",
                    });
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
    <main className="max-w-5xl mx-auto px-4 py-8 grid gap-8">
      <div>
        <h1 className="text-3xl">Services</h1>
        <p className="text-muted-foreground">Various student-centric services on campus.</p>
      </div>
      <div className="space-y-2" id={slugify("Web Resources")}>
        <h2 className="text-xl">Web Resources</h2>
        <div className="[column-fill:_balance]_columns-1 sm:columns-2 gap-4">
          <Card className="glass hover:shadow-lg transition-colors mb-4 break-inside-avoid">
            <CardHeader>
              <CardTitle>MIT Map – Nakshatra</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Interactive campus map
              <br />
              <a href="https://mit.nakshatramaps.com/" target="_blank" rel="noreferrer">
                <span className="text-xs text-gray-500 hover:underline">
                  https://mit.nakshatramaps.com/
                </span>
              </a>
            </CardContent>
          </Card>
          <Card className="glass hover:shadow-lg transition-colors mb-4 break-inside-avoid">
            <CardHeader>
              <CardTitle>Indian Kitchen – Weekly Menu</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Current week&apos;s mess menu
              <br />
              <a href="https://fc2.coolstuff.work" target="_blank" rel="noreferrer">
                <span className="text-xs text-gray-500 hover:underline">
                  https://fc2.coolstuff.work
                </span>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
      <Section title="Laundry Services" items={services.laundry} />
      <Section title="Xerox & Printing" items={services.xerox} />
    </main>
  );
}
