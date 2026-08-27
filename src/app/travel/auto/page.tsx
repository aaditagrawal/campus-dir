import * as stylex from "@stylexjs/stylex";
import data from "@/data/travel.json";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Shuffle } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { RandomTelButton } from "@/components/contact-actions";
import { getAutoPhoneOptions } from "@/lib/random-auto";
import { slugify } from "@/lib/utils";
import { colors, radii } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

type Listing = { name: string; phones: string[]; notes?: string };
type TravelData = { autos: Listing[]; cabs: Listing[] };
const travel: TravelData = data;

const styles = stylex.create({
  back: {
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
  title: { marginTop: "1rem", marginBottom: "0.5rem" },
  randomWrap: { marginTop: "1.5rem" },
  randomButton: {
    display: "inline-flex",
    width: { default: "100%", "@media (min-width: 640px)": "auto" },
    height: "2.25rem",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    borderRadius: radii.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.input,
    backgroundColor: { default: colors.background, ":hover": colors.accent },
    color: { default: colors.foreground, ":hover": colors.accentForeground },
    paddingInline: "1rem",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 500,
    cursor: "pointer",
    transform: { default: "scale(1)", ":active": "scale(0.97)" },
    transitionProperty: "color, background-color, border-color, box-shadow, transform",
    transitionDuration: "150ms",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
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
  link: { textDecorationLine: "underline" },
  noteLink: {
    color: { default: colors.mutedForeground, ":hover": colors.primary },
    textDecorationLine: "underline",
  },
  notes: { color: colors.mutedForeground, fontSize: "0.875rem", lineHeight: 1.625 },
  callButton: { width: "100%", height: "2.75rem", fontSize: "1rem", fontWeight: 600 },
  icon16: { width: "1rem", height: "1rem" },
  icon20: { width: "1.25rem", height: "1.25rem" },
});

function renderNotesWithLinks(notes: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return notes.split(urlRegex).map((part, index) =>
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

export default function AutoQuickCallPage() {
  return (
    <main {...stylex.props(shared.page)}>
      <div {...stylex.props(shared.pageHeader)}>
        <Link href="/travel" {...stylex.props(styles.back)}>
          ← Travel
        </Link>
        <h1 {...stylex.props(shared.heading1, shared.heading1Strong, styles.title)}>
          Rapid-call an auto
        </h1>
        <p {...stylex.props(shared.mutedText)}>
          Gate stands and drivers - tap to dial. If one line is busy, try the next.
        </p>
        <div {...stylex.props(styles.randomWrap)}>
          <RandomTelButton options={getAutoPhoneOptions()} xstyle={styles.randomButton}>
            <Shuffle aria-hidden {...stylex.props(styles.icon16)} />
            Call Random Auto
          </RandomTelButton>
        </div>
      </div>
      <div {...stylex.props(shared.grid2)}>
        {travel.autos.map((listing) => (
          <Card
            key={listing.name}
            id={slugify(listing.name)}
            xstyle={[shared.glass, shared.cardHover, shared.scrollTarget]}
          >
            <CardHeader xstyle={styles.header}>
              <div {...stylex.props(styles.row)}>
                <CardTitle xstyle={styles.cardTitle}>{listing.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `travel-autos-${slugify(listing.name)}`,
                    type: "travel",
                    name: listing.name,
                    href: `/travel#${slugify(listing.name)}`,
                    phones: listing.phones,
                    subtitle: "Autos",
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
                    {...stylex.props(styles.link)}
                  >
                    {phone}
                  </a>
                ))}
              </div>
              {listing.notes && (
                <div {...stylex.props(styles.notes)}>{renderNotesWithLinks(listing.notes)}</div>
              )}
              <Button asChild xstyle={styles.callButton}>
                <a href={`tel:${listing.phones[0]?.replace(/\s+/g, "") ?? ""}`}>
                  <Phone {...stylex.props(styles.icon20)} />
                  Call now
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
