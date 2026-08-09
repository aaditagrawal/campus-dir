"use client";

import data from "@/data/emergency.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";

type Emergency = {
  name: string;
  phones: string[];
  address?: string;
  notes?: string;
  accent?: string;
};

export default function EmergencyPage() {
  const entries = data as Emergency[];
  const manipalHelplines: Emergency[] = [
    { name: "Student Health Clinic", phones: ["0820-2922057"] },
    { name: "KMC Ambulance", phones: ["0820-2922761"] },
    {
      name: "KMC Emergency",
      phones: ["0820-2922761", "0820-2922246", "0820-2923154", "0820-2922352", "0820-2922721"],
    },
    { name: "Fire", phones: ["0820-2922607"] },
    { name: "MAHE Control Room (All Emergency)", phones: ["0820-2922515"] },
    { name: "Police Station", phones: ["0820-2570328", "0820-2526444"] },
    { name: "SP Udupi", phones: ["94808 05401"] },
    { name: "Anti-Ragging", phones: ["1800 425 6090"] },
    { name: "Campus Patrol", phones: ["99456 70913", "96321 01004"] },
  ];

  const suicidePrevention: Emergency[] = [
    { name: "Aasra 24x7 Helpline", phones: ["91-22-27546669"] },
    { name: "Spandana (24-hour)", phones: ["65000111", "65000222"] },
  ];

  const indiaHelplines: Emergency[] = [
    { name: "Police Control Room", phones: ["100"] },
    { name: "Fire", phones: ["101"] },
    { name: "Ambulance", phones: ["102"] },
    { name: "Women’s Helpline", phones: ["181"] },
    { name: "Women in Distress", phones: ["1091"] },
    { name: "Child in Distress", phones: ["1098"] },
    { name: "AIDS Helpline", phones: ["1097"] },
    { name: "Alcohol and Drug Helpline (9:30 am to 6 pm)", phones: ["1800-11-0031"] },
    { name: "All-in-one Emergency Number", phones: ["112"] },
  ];
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Emergency Services</h1>
        <p className="text-muted-foreground">
          Health and safety contacts. In emergencies, call the ambulance first.
        </p>
      </div>

      <section className="space-y-4 mb-8" id={slugify("Emergency Contacts")}>
        <h2 className="text-xl font-semibold">Emergency Contacts</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {entries.map((e) => (
            <Card
              key={e.name}
              id={slugify(e.name)}
              className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">{e.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `emergency-${slugify(e.name)}`,
                    type: "emergency",
                    name: e.name,
                    href: `/emergency#${slugify(e.name)}`,
                    phones: e.phones,
                    subtitle: e.address,
                  }}
                  size="sm"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  {e.phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="underline">
                      {p}
                    </a>
                  ))}
                </div>
                {e.address && <div className="text-sm text-muted-foreground">{e.address}</div>}
                {e.notes && (
                  <div className="text-sm text-muted-foreground leading-relaxed">{e.notes}</div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `tel:${e.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
                    }}
                    className="gap-2"
                  >
                    <Phone className="size-4" />
                    Call Now
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const v = buildVCard({
                        name: e.name,
                        phones: e.phones,
                        address: e.address,
                        org: "Emergency",
                      });
                      downloadVCardFile(e.name, v);
                    }}
                  >
                    Download contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4 mb-8" id={slugify("In Manipal")}>
        <h2 className="text-xl font-semibold">In Manipal</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {manipalHelplines.map((e) => (
            <Card
              key={`manipal-${e.name}`}
              id={slugify(e.name)}
              className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">{e.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `emergency-manipal-${slugify(e.name)}`,
                    type: "emergency",
                    name: e.name,
                    href: `/emergency#${slugify(e.name)}`,
                    phones: e.phones,
                    subtitle: "Manipal Helpline",
                  }}
                  size="sm"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  {e.phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="underline">
                      {p}
                    </a>
                  ))}
                </div>
                {e.address && <div className="text-sm text-muted-foreground">{e.address}</div>}
                {e.notes && (
                  <div className="text-sm text-muted-foreground leading-relaxed">{e.notes}</div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `tel:${e.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
                    }}
                    className="gap-2"
                  >
                    <Phone className="size-4" />
                    Call Now
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const v = buildVCard({
                        name: e.name,
                        phones: e.phones,
                        address: e.address,
                        org: "Helpline",
                      });
                      downloadVCardFile(e.name, v);
                    }}
                  >
                    Download contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4 mb-8" id={slugify("Suicide Prevention Helplines in India")}>
        <h2 className="text-xl font-semibold">Suicide Prevention Helplines in India</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {suicidePrevention.map((e) => (
            <Card
              key={`sp-${e.name}`}
              id={slugify(e.name)}
              className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">{e.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `emergency-suicide-${slugify(e.name)}`,
                    type: "emergency",
                    name: e.name,
                    href: `/emergency#${slugify(e.name)}`,
                    phones: e.phones,
                    subtitle: "Suicide Prevention",
                  }}
                  size="sm"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  {e.phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="underline">
                      {p}
                    </a>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `tel:${e.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
                    }}
                    className="gap-2"
                  >
                    <Phone className="size-4" />
                    Call Now
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const v = buildVCard({ name: e.name, phones: e.phones, org: "Helpline" });
                      downloadVCardFile(e.name, v);
                    }}
                  >
                    Download contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4" id={slugify("Helplines Across India")}>
        <h2 className="text-xl font-semibold">Helplines Across India</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {indiaHelplines.map((e) => (
            <Card
              key={`india-${e.name}`}
              id={slugify(e.name)}
              className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">{e.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `emergency-india-${slugify(e.name)}`,
                    type: "emergency",
                    name: e.name,
                    href: `/emergency#${slugify(e.name)}`,
                    phones: e.phones,
                    subtitle: "India Helpline",
                  }}
                  size="sm"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  {e.phones.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="underline">
                      {p}
                    </a>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      window.location.href = `tel:${e.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
                    }}
                    className="gap-2"
                  >
                    <Phone className="size-4" />
                    Call Now
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const v = buildVCard({ name: e.name, phones: e.phones, org: "Helpline" });
                      downloadVCardFile(e.name, v);
                    }}
                  >
                    Download contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Source:{" "}
          <a
            className="underline hover:text-blue-600 transition-colors"
            href="https://ssc.manipal.edu/resources.aspx"
            target="_blank"
            rel="noreferrer"
          >
            Student Support Centre resources
          </a>
        </p>
      </section>
    </main>
  );
}
