import data from "@/data/emergency.json";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { DownloadVCardButton } from "@/components/contact-actions";

type Emergency = {
  name: string;
  phones: string[];
  address?: string;
  notes?: string;
  accent?: string;
};

function EmergencyContactCard({
  entry,
  favoriteId,
  href,
  subtitle,
  org,
}: {
  entry: Emergency;
  favoriteId: string;
  href: string;
  subtitle?: string;
  org: string;
}) {
  return (
    <Card
      id={slugify(entry.name)}
      className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24 h-full gap-4"
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{entry.name}</CardTitle>
          <FavoriteButton
            item={{
              id: favoriteId,
              type: "emergency",
              name: entry.name,
              href,
              phones: entry.phones,
              subtitle: subtitle ?? entry.address,
            }}
            size="sm"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          {entry.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="underline">
              {p}
            </a>
          ))}
        </div>
        {entry.address ? (
          <div className="text-sm text-muted-foreground">{entry.address}</div>
        ) : null}
        {entry.notes ? (
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {entry.notes}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto grid grid-cols-2 gap-2">
        <Button asChild variant="secondary" size="sm" className="w-full gap-2">
          <a href={`tel:${entry.phones?.[0]?.replace(/\s+/g, "") ?? ""}`}>
            <Phone className="size-4" />
            Call Now
          </a>
        </Button>
        <DownloadVCardButton
          size="sm"
          className="w-full"
          filename={entry.name}
          vcard={buildVCard({
            name: entry.name,
            phones: entry.phones,
            address: entry.address,
            org,
          })}
        >
          Download contact
        </DownloadVCardButton>
      </CardFooter>
    </Card>
  );
}

export default function EmergencyPage() {
  const entries: Emergency[] = data;
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
        <div className="grid sm:grid-cols-2 gap-4 items-stretch">
          {entries.map((e) => (
            <EmergencyContactCard
              key={e.name}
              entry={e}
              favoriteId={`emergency-${slugify(e.name)}`}
              href={`/emergency#${slugify(e.name)}`}
              org="Emergency"
            />
          ))}
        </div>
      </section>

      <section className="space-y-4 mb-8" id={slugify("In Manipal")}>
        <h2 className="text-xl font-semibold">In Manipal</h2>
        <div className="grid sm:grid-cols-2 gap-4 items-stretch">
          {manipalHelplines.map((e) => (
            <EmergencyContactCard
              key={`manipal-${e.name}`}
              entry={e}
              favoriteId={`emergency-manipal-${slugify(e.name)}`}
              href={`/emergency#${slugify(e.name)}`}
              subtitle="Manipal Helpline"
              org="Helpline"
            />
          ))}
        </div>
      </section>

      <section className="space-y-4 mb-8" id={slugify("Suicide Prevention Helplines in India")}>
        <h2 className="text-xl font-semibold">Suicide Prevention Helplines in India</h2>
        <div className="grid sm:grid-cols-2 gap-4 items-stretch">
          {suicidePrevention.map((e) => (
            <EmergencyContactCard
              key={`sp-${e.name}`}
              entry={e}
              favoriteId={`emergency-suicide-${slugify(e.name)}`}
              href={`/emergency#${slugify(e.name)}`}
              subtitle="Suicide Prevention"
              org="Helpline"
            />
          ))}
        </div>
      </section>

      <section className="space-y-4" id={slugify("Helplines Across India")}>
        <h2 className="text-xl font-semibold">Helplines Across India</h2>
        <div className="grid sm:grid-cols-2 gap-4 items-stretch">
          {indiaHelplines.map((e) => (
            <EmergencyContactCard
              key={`india-${e.name}`}
              entry={e}
              favoriteId={`emergency-india-${slugify(e.name)}`}
              href={`/emergency#${slugify(e.name)}`}
              subtitle="India Helpline"
              org="Helpline"
            />
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
