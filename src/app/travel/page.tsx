import * as stylex from "@stylexjs/stylex";
import data from "@/data/travel.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { DownloadVCardButton } from "@/components/contact-actions";
import { colors, radii } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

type Listing = { name: string; phones: string[]; notes?: string };
type TravelData = { autos: Listing[]; cabs: Listing[] };

const styles = stylex.create({
  noteLink: {
    color: { default: colors.mutedForeground, ":hover": colors.primary },
    textDecorationLine: "underline",
  },
  header: { paddingBottom: "0.75rem" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  cardTitle: { fontSize: "1.125rem" },
  content: { display: "flex", flexDirection: "column", gap: "1rem" },
  phones: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  phoneLink: { textDecorationLine: "underline" },
  notes: { color: colors.mutedForeground, fontSize: "0.875rem", lineHeight: 1.625 },
  actions: { display: "flex", gap: "0.5rem", paddingTop: "0.5rem" },
  icon: { width: "1rem", height: "1rem" },
  groups: { display: "flex", flexDirection: "column", gap: "2rem" },
  priceCard: {
    borderRadius: radii.lg,
    backgroundColor: `color-mix(in oklab, ${colors.muted} 50%, transparent)`,
    padding: "1rem",
  },
  priceTitle: { marginBottom: "0.75rem", fontWeight: 600 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", lineHeight: "1.25rem" },
  tableRow: {
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  tableRowMuted: {
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: `color-mix(in oklab, ${colors.muted} 50%, transparent)`,
  },
  cell: { paddingBlock: "0.5rem" },
  left: { textAlign: "left", fontWeight: 500 },
  right: { textAlign: "right", fontWeight: 500 },
  dataRight: { textAlign: "right" },
});

function renderNotesWithLinks(notes: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = notes.split(urlRegex);
  return parts.map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        {...stylex.props(styles.noteLink)}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function ListingCard({ listing, sectionTitle }: { listing: Listing; sectionTitle: string }) {
  return (
    <Card id={slugify(listing.name)} xstyle={[shared.glass, shared.cardHover, shared.scrollTarget]}>
      <CardHeader xstyle={styles.header}>
        <div {...stylex.props(styles.row)}>
          <CardTitle xstyle={styles.cardTitle}>{listing.name}</CardTitle>
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
      <CardContent xstyle={styles.content}>
        <div {...stylex.props(styles.phones)}>
          {listing.phones.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s+/g, "")}`}
              {...stylex.props(styles.phoneLink)}
            >
              {phone}
            </a>
          ))}
        </div>
        {listing.notes && (
          <div {...stylex.props(styles.notes)}>{renderNotesWithLinks(listing.notes)}</div>
        )}
        <div {...stylex.props(styles.actions)}>
          <Button asChild variant="secondary" size="sm">
            <a href={`tel:${listing.phones[0]?.replace(/\s+/g, "") ?? ""}`}>
              <Phone {...stylex.props(styles.icon)} />
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
  const travel: TravelData = data;
  return (
    <main {...stylex.props(shared.page)}>
      <div {...stylex.props(shared.pageHeader)}>
        <h1 {...stylex.props(shared.heading1, shared.heading1Strong)}>Travel</h1>
        <p {...stylex.props(shared.mutedText)}>Autos, cabs and taxi transport.</p>
      </div>
      <div {...stylex.props(styles.groups)}>
        <div {...stylex.props(shared.section)} id={slugify("Autos")}>
          <h2 {...stylex.props(shared.heading2, shared.heading2Strong)}>Autos</h2>
          <div {...stylex.props(shared.grid2)}>
            {travel.autos.map((listing) => (
              <ListingCard key={listing.name} listing={listing} sectionTitle="Autos" />
            ))}
          </div>
        </div>
        <div {...stylex.props(shared.section)} id={slugify("Cabs & Taxis")}>
          <h2 {...stylex.props(shared.heading2, shared.heading2Strong)}>Cabs & Taxis</h2>
          <div {...stylex.props(styles.priceCard)}>
            <h3 {...stylex.props(styles.priceTitle)}>
              Udupi Manipal Taxi Union - Airport Prices (After Jan 2026)
            </h3>
            <div {...stylex.props(styles.tableWrap)}>
              <table {...stylex.props(styles.table)}>
                <thead>
                  <tr {...stylex.props(styles.tableRow)}>
                    <th {...stylex.props(styles.cell, styles.left)}>Vehicle</th>
                    <th {...stylex.props(styles.cell, styles.right)}>Airport Drop</th>
                    <th {...stylex.props(styles.cell, styles.right)}>Airport Pick Up</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Small Car", "₹1700", "₹1800"],
                    ["Ertiga", "₹2200", "₹2300"],
                    ["Innova", "₹2800", "₹2900"],
                    ["Innova Crista", "₹3000", "₹3100"],
                  ].map(([vehicle, drop, pickup], index, rows) => (
                    <tr
                      key={vehicle}
                      {...stylex.props(index < rows.length - 1 && styles.tableRowMuted)}
                    >
                      <td {...stylex.props(styles.cell)}>{vehicle}</td>
                      <td {...stylex.props(styles.cell, styles.dataRight)}>{drop}</td>
                      <td {...stylex.props(styles.cell, styles.dataRight)}>{pickup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div {...stylex.props(shared.grid2)}>
            {travel.cabs.map((listing) => (
              <ListingCard key={listing.name} listing={listing} sectionTitle="Cabs & Taxis" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
