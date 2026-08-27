import * as stylex from "@stylexjs/stylex";
import data from "@/data/services.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildVCard } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorite-button";
import { DownloadVCardButton } from "@/components/contact-actions";
import { colors } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

type Listing = { name: string; phones: string[]; notes?: string };
type ServicesData = { laundry: Listing[]; xerox: Listing[] };

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  phones: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  muted: { color: colors.mutedForeground },
  link: { textDecorationLine: "underline" },
  resourceContent: {
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  resourceUrl: {
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
});

function Section({ title, items }: { title: string; items: Listing[] }) {
  return (
    <div {...stylex.props(shared.sectionCompact)} id={slugify(title)}>
      <h2 {...stylex.props(shared.heading2)}>{title}</h2>
      <div {...stylex.props(shared.grid2)}>
        {items.map((item) => (
          <Card
            key={item.name}
            id={slugify(item.name)}
            xstyle={[shared.glass, shared.scrollTarget]}
          >
            <CardHeader>
              <div {...stylex.props(styles.row)}>
                <CardTitle>{item.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `service-${slugify(title)}-${slugify(item.name)}`,
                    type: "service",
                    name: item.name,
                    href: `/services#${slugify(item.name)}`,
                    phones: item.phones,
                    subtitle: title,
                  }}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent xstyle={styles.content}>
              <div {...stylex.props(styles.phones)}>
                {item.phones.map((phone) => (
                  <a key={phone} href={`tel:${phone}`} {...stylex.props(styles.link)}>
                    {phone}
                  </a>
                ))}
              </div>
              {item.notes && <div {...stylex.props(styles.muted)}>{item.notes}</div>}
              <div>
                <DownloadVCardButton
                  variant="secondary"
                  filename={item.name}
                  vcard={buildVCard({
                    name: item.name,
                    phones: item.phones,
                    org: "General Services",
                  })}
                >
                  Download contact
                </DownloadVCardButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const services: ServicesData = data;
  return (
    <main {...stylex.props(shared.page, shared.pageGrid)}>
      <div>
        <h1 {...stylex.props(shared.heading1)}>Services</h1>
        <p {...stylex.props(shared.mutedText)}>Various student-centric services on campus.</p>
      </div>
      <div {...stylex.props(shared.sectionCompact)} id={slugify("Web Resources")}>
        <h2 {...stylex.props(shared.heading2)}>Web Resources</h2>
        <div {...stylex.props(shared.columns2)}>
          <Card xstyle={[shared.glass, shared.cardHover, shared.breakInsideAvoid]}>
            <CardHeader>
              <CardTitle>MIT Map – Nakshatra</CardTitle>
            </CardHeader>
            <CardContent xstyle={styles.resourceContent}>
              Interactive campus map
              <br />
              <a href="https://mit.nakshatramaps.com/" target="_blank" rel="noreferrer">
                <span {...stylex.props(styles.resourceUrl)}>https://mit.nakshatramaps.com/</span>
              </a>
            </CardContent>
          </Card>
          <Card xstyle={[shared.glass, shared.cardHover, shared.breakInsideAvoid]}>
            <CardHeader>
              <CardTitle>Indian Kitchen – Weekly Menu</CardTitle>
            </CardHeader>
            <CardContent xstyle={styles.resourceContent}>
              Current week&apos;s mess menu
              <br />
              <a href="https://fc2.coolstuff.work" target="_blank" rel="noreferrer">
                <span {...stylex.props(styles.resourceUrl)}>https://fc2.coolstuff.work</span>
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
