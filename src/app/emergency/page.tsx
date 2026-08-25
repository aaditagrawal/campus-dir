import * as stylex from "@stylexjs/stylex";
import data from "@/data/emergency.json";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { DownloadVCardButton } from "@/components/contact-actions";
import { colors } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

type Emergency = {
  name: string;
  phones: string[];
  address?: string;
  notes?: string;
  accent?: string;
};

const styles = stylex.create({
  card: { height: "100%", gap: "1rem" },
  header: { paddingBottom: 0 },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  cardTitle: { fontSize: "1.125rem", lineHeight: 1.375 },
  content: { display: "flex", flex: 1, flexDirection: "column", gap: "0.75rem" },
  phones: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  link: { textDecorationLine: "underline" },
  details: { color: colors.mutedForeground, fontSize: "0.875rem", lineHeight: "1.25rem" },
  notes: { lineHeight: 1.625, whiteSpace: "pre-line" },
  footer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0.5rem",
    marginTop: "auto",
  },
  button: { width: "100%" },
  icon: { width: "1rem", height: "1rem" },
  source: {
    marginTop: "1rem",
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  sourceLink: {
    color: { default: colors.mutedForeground, ":hover": colors.blue },
    textDecorationLine: "underline",
    transitionProperty: "color",
    transitionDuration: "150ms",
  },
});

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
      xstyle={[shared.glass, shared.cardHover, shared.scrollTarget, styles.card]}
    >
      <CardHeader xstyle={styles.header}>
        <div {...stylex.props(styles.row)}>
          <CardTitle xstyle={styles.cardTitle}>{entry.name}</CardTitle>
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
      <CardContent xstyle={styles.content}>
        <div {...stylex.props(styles.phones)}>
          {entry.phones.map((phone) => (
            <a key={phone} href={`tel:${phone.replace(/\s+/g, "")}`} {...stylex.props(styles.link)}>
              {phone}
            </a>
          ))}
        </div>
        {entry.address ? <div {...stylex.props(styles.details)}>{entry.address}</div> : null}
        {entry.notes ? (
          <div {...stylex.props(styles.details, styles.notes)}>{entry.notes}</div>
        ) : null}
      </CardContent>
      <CardFooter xstyle={styles.footer}>
        <Button asChild variant="secondary" size="sm" xstyle={styles.button}>
          <a href={`tel:${entry.phones[0]?.replace(/\s+/g, "") ?? ""}`}>
            <Phone {...stylex.props(styles.icon)} />
            Call Now
          </a>
        </Button>
        <DownloadVCardButton
          size="sm"
          xstyle={styles.button}
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
    <main {...stylex.props(shared.page)}>
      <div {...stylex.props(shared.pageHeader)}>
        <h1 {...stylex.props(shared.heading1, shared.heading1Strong)}>Emergency Services</h1>
        <p {...stylex.props(shared.mutedText)}>
          Health and safety contacts. In emergencies, call the ambulance first.
        </p>
      </div>

      <section
        {...stylex.props(shared.section, shared.sectionBottom)}
        id={slugify("Emergency Contacts")}
      >
        <h2 {...stylex.props(shared.heading2, shared.heading2Strong)}>Emergency Contacts</h2>
        <div {...stylex.props(shared.grid2, shared.stretch)}>
          {entries.map((entry) => (
            <EmergencyContactCard
              key={entry.name}
              entry={entry}
              favoriteId={`emergency-${slugify(entry.name)}`}
              href={`/emergency#${slugify(entry.name)}`}
              org="Emergency"
            />
          ))}
        </div>
      </section>

      <section {...stylex.props(shared.section, shared.sectionBottom)} id={slugify("In Manipal")}>
        <h2 {...stylex.props(shared.heading2, shared.heading2Strong)}>In Manipal</h2>
        <div {...stylex.props(shared.grid2, shared.stretch)}>
          {manipalHelplines.map((entry) => (
            <EmergencyContactCard
              key={`manipal-${entry.name}`}
              entry={entry}
              favoriteId={`emergency-manipal-${slugify(entry.name)}`}
              href={`/emergency#${slugify(entry.name)}`}
              subtitle="Manipal Helpline"
              org="Helpline"
            />
          ))}
        </div>
      </section>

      <section
        {...stylex.props(shared.section, shared.sectionBottom)}
        id={slugify("Suicide Prevention Helplines in India")}
      >
        <h2 {...stylex.props(shared.heading2, shared.heading2Strong)}>
          Suicide Prevention Helplines in India
        </h2>
        <div {...stylex.props(shared.grid2, shared.stretch)}>
          {suicidePrevention.map((entry) => (
            <EmergencyContactCard
              key={`sp-${entry.name}`}
              entry={entry}
              favoriteId={`emergency-suicide-${slugify(entry.name)}`}
              href={`/emergency#${slugify(entry.name)}`}
              subtitle="Suicide Prevention"
              org="Helpline"
            />
          ))}
        </div>
      </section>

      <section {...stylex.props(shared.section)} id={slugify("Helplines Across India")}>
        <h2 {...stylex.props(shared.heading2, shared.heading2Strong)}>Helplines Across India</h2>
        <div {...stylex.props(shared.grid2, shared.stretch)}>
          {indiaHelplines.map((entry) => (
            <EmergencyContactCard
              key={`india-${entry.name}`}
              entry={entry}
              favoriteId={`emergency-india-${slugify(entry.name)}`}
              href={`/emergency#${slugify(entry.name)}`}
              subtitle="India Helpline"
              org="Helpline"
            />
          ))}
        </div>
        <p {...stylex.props(styles.source)}>
          Source:{" "}
          <a
            {...stylex.props(styles.sourceLink)}
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
