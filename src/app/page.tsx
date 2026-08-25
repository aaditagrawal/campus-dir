import Link from "next/link";
import {
  Siren,
  GraduationCap,
  Settings,
  Mail,
  Utensils,
  Building,
  Car,
  Wrench,
  Star,
  MessageSquareWarning,
  ChevronRight,
  Shuffle,
} from "lucide-react";
import * as stylex from "@stylexjs/stylex";
import { FavoritesTileLabel, SearchLauncher } from "@/components/home-client";
import { RandomTelButton } from "@/components/contact-actions";
import { getAutoPhoneOptions } from "@/lib/random-auto";
import { slugify } from "@/lib/utils";
import { breakpoints, colors, fonts, motion } from "@/styles/constants.stylex";

const styles = stylex.create({
  page: {
    maxWidth: "48rem",
    marginInline: "auto",
    paddingInline: "1.25rem",
    paddingTop: { default: "3.5rem", [breakpoints.md]: "6rem" },
    paddingBottom: "6rem",
  },
  hero: { textAlign: "center" },
  title: {
    fontFamily: fonts.serif,
    fontSize: {
      default: "2.25rem",
      [breakpoints.sm]: "3rem",
      [breakpoints.md]: "3.75rem",
    },
    lineHeight: 1,
    letterSpacing: "-0.025em",
    textWrap: "balance",
  },
  subtitle: {
    maxWidth: "28rem",
    marginInline: "auto",
    marginTop: "0.75rem",
    color: colors.mutedForeground,
    fontSize: { default: "1rem", [breakpoints.md]: "1.125rem" },
    lineHeight: { default: "1.5rem", [breakpoints.md]: "1.75rem" },
    textWrap: "balance",
  },
  searchWrap: { maxWidth: "24rem", marginInline: "auto", marginTop: "1.75rem" },
  quickSection: { marginTop: "3.5rem" },
  browseSection: { marginTop: "3rem" },
  sectionLabel: {
    marginBottom: "0.75rem",
    paddingInline: "0.25rem",
    color: colors.mutedForeground,
    fontFamily: fonts.sans,
    fontSize: "0.75rem",
    lineHeight: "1rem",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  quickList: {
    overflow: "hidden",
    borderRadius: "1rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `color-mix(in oklab, ${colors.border} 60%, transparent)`,
    backgroundColor: `color-mix(in oklab, ${colors.card} 40%, transparent)`,
  },
  quickAction: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "1rem",
    borderWidth: 0,
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${colors.muted} 50%, transparent)`,
      ":active": `color-mix(in oklab, ${colors.muted} 70%, transparent)`,
    },
    paddingInline: { default: "1rem", [breakpoints.sm]: "1.25rem" },
    paddingBlock: "0.875rem",
    color: colors.foreground,
    textAlign: "left",
    textDecorationLine: "none",
    outline: "none",
    cursor: "pointer",
    transitionProperty: "background-color",
    transitionDuration: motion.fast,
    boxShadow: {
      default: "none",
      ":focus-visible": `inset 0 0 0 2px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
    },
  },
  quickDivider: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `color-mix(in oklab, ${colors.border} 60%, transparent)`,
  },
  quickIconWrap: {
    display: "flex",
    width: "2.25rem",
    height: "2.25rem",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.5rem",
    backgroundColor: `color-mix(in oklab, ${colors.muted} 70%, transparent)`,
    color: {
      default: colors.mutedForeground,
      [stylex.when.ancestor(":hover")]: colors.foreground,
    },
    transitionProperty: "color",
    transitionDuration: motion.fast,
  },
  icon16: { width: "1rem", height: "1rem" },
  icon20: { width: "1.25rem", height: "1.25rem" },
  quickCopy: { minWidth: 0, flex: 1 },
  quickTitle: {
    display: "block",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 500,
    letterSpacing: "-0.025em",
  },
  quickDescription: {
    display: "block",
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  chevron: {
    width: "1rem",
    height: "1rem",
    flexShrink: 0,
    color: `color-mix(in oklab, ${colors.mutedForeground} 60%, transparent)`,
    transform: {
      default: "translateX(0)",
      [stylex.when.ancestor(":hover")]: "translateX(0.125rem)",
    },
    transitionProperty: "transform",
    transitionDuration: motion.fast,
  },
  browseGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [breakpoints.md]: "repeat(3, minmax(0, 1fr))",
    },
    gap: "0.5rem",
  },
  tile: {
    borderRadius: "0.75rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: `color-mix(in oklab, ${colors.border} 50%, transparent)`,
      ":hover": colors.border,
    },
    backgroundColor: {
      default: `color-mix(in oklab, ${colors.card} 40%, transparent)`,
      ":hover": `color-mix(in oklab, ${colors.card} 80%, transparent)`,
      ":active": colors.card,
    },
    padding: "1rem",
    color: colors.foreground,
    textDecorationLine: "none",
    outline: "none",
    transitionProperty: "background-color, border-color",
    transitionDuration: motion.fast,
    boxShadow: {
      default: "none",
      ":focus-visible": `0 0 0 2px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
    },
  },
  tileIcon: {
    color: {
      default: colors.mutedForeground,
      [stylex.when.ancestor(":hover")]: colors.foreground,
    },
    transitionProperty: "color",
    transitionDuration: motion.fast,
  },
  tileTitle: {
    display: "block",
    marginTop: "0.75rem",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 500,
    letterSpacing: "-0.025em",
  },
  tileDescription: {
    display: "block",
    marginTop: "0.125rem",
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  emergencyTile: {
    gridColumn: { default: "span 2 / span 2", [breakpoints.md]: "span 1 / span 1" },
    borderColor: {
      default: "oklch(0.645 0.246 16.439 / 20%)",
      ":hover": "oklch(0.645 0.246 16.439 / 40%)",
    },
    backgroundColor: {
      default: "oklch(0.645 0.246 16.439 / 4%)",
      ":hover": "oklch(0.645 0.246 16.439 / 8%)",
    },
    boxShadow: {
      default: "none",
      ":focus-visible": "0 0 0 2px oklch(0.645 0.246 16.439 / 40%)",
    },
  },
  emergencyText: { color: colors.rose },
  emergencyTitle: { color: colors.rose },
  emergencyDescription: { color: "oklch(0.645 0.246 16.439 / 70%)" },
});

function QuickActionBody({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <>
      <span {...stylex.props(styles.quickIconWrap)}>{icon}</span>
      <span {...stylex.props(styles.quickCopy)}>
        <span {...stylex.props(styles.quickTitle)}>{title}</span>
        <span {...stylex.props(styles.quickDescription)}>{description}</span>
      </span>
      <ChevronRight {...stylex.props(styles.chevron)} aria-hidden />
    </>
  );
}

function TileBody({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <>
      <span {...stylex.props(accent ? styles.emergencyText : styles.tileIcon)}>{icon}</span>
      <span {...stylex.props(styles.tileTitle, accent && styles.emergencyTitle)}>{title}</span>
      <span {...stylex.props(styles.tileDescription, accent && styles.emergencyDescription)}>
        {description}
      </span>
    </>
  );
}

export default function Home() {
  return (
    <main {...stylex.props(styles.page)}>
      <section {...stylex.props(styles.hero)}>
        <h1 {...stylex.props(styles.title)}>MIT Manipal Directory</h1>
        <p {...stylex.props(styles.subtitle)}>
          Restaurants, hostels, travel, and emergency contacts - in one place.
        </p>
        <div {...stylex.props(styles.searchWrap)}>
          <SearchLauncher />
        </div>
      </section>

      <section {...stylex.props(styles.quickSection)} aria-label="Quick actions">
        <h2 {...stylex.props(styles.sectionLabel)}>Quick actions</h2>
        <div {...stylex.props(styles.quickList)}>
          <RandomTelButton
            options={getAutoPhoneOptions()}
            xstyle={[stylex.defaultMarker(), styles.quickAction]}
            aria-label="Call a random auto from the directory"
          >
            <QuickActionBody
              icon={<Shuffle {...stylex.props(styles.icon16)} aria-hidden />}
              title="Call a random auto"
              description="Opens your dialer with a stand or driver number"
            />
          </RandomTelButton>
          <Link
            href="/travel/auto"
            {...stylex.props(stylex.defaultMarker(), styles.quickAction, styles.quickDivider)}
          >
            <QuickActionBody
              icon={<Car {...stylex.props(styles.icon16)} aria-hidden />}
              title="Get a taxi or auto"
              description="Gate stands, cabs & airport rates"
            />
          </Link>
          <Link
            href="/tools/mail-to-warden"
            {...stylex.props(stylex.defaultMarker(), styles.quickAction, styles.quickDivider)}
          >
            <QuickActionBody
              icon={<Mail {...stylex.props(styles.icon16)} aria-hidden />}
              title="Mail to warden"
              description="Generate leave request emails"
            />
          </Link>
        </div>
      </section>

      <section {...stylex.props(styles.browseSection)} aria-label="Browse">
        <h2 {...stylex.props(styles.sectionLabel)}>Browse</h2>
        <div {...stylex.props(styles.browseGrid)}>
          <Link href="/academics" {...stylex.props(stylex.defaultMarker(), styles.tile)}>
            <TileBody
              icon={<GraduationCap {...stylex.props(styles.icon20)} />}
              title="Academics"
              description="Systems & portals"
            />
          </Link>
          <Link href="/restaurants" {...stylex.props(stylex.defaultMarker(), styles.tile)}>
            <TileBody
              icon={<Utensils {...stylex.props(styles.icon20)} />}
              title="Restaurants"
              description="Menus & delivery"
            />
          </Link>
          <Link href="/hostels" {...stylex.props(stylex.defaultMarker(), styles.tile)}>
            <TileBody
              icon={<Building {...stylex.props(styles.icon20)} />}
              title="Hostels"
              description="Wardens & contacts"
            />
          </Link>
          <Link
            href={`/travel#${slugify("Cabs & Taxis")}`}
            {...stylex.props(stylex.defaultMarker(), styles.tile)}
          >
            <TileBody
              icon={<Car {...stylex.props(styles.icon20)} />}
              title="Travel"
              description="Autos, cabs & taxis"
            />
          </Link>
          <Link href="/services" {...stylex.props(stylex.defaultMarker(), styles.tile)}>
            <TileBody
              icon={<Wrench {...stylex.props(styles.icon20)} />}
              title="Services"
              description="Laundry & xerox"
            />
          </Link>
          <Link href="/tools" {...stylex.props(stylex.defaultMarker(), styles.tile)}>
            <TileBody
              icon={<Settings {...stylex.props(styles.icon20)} />}
              title="Tools"
              description="Maps & resources"
            />
          </Link>
          <Link href="/grievance" {...stylex.props(stylex.defaultMarker(), styles.tile)}>
            <TileBody
              icon={<MessageSquareWarning {...stylex.props(styles.icon20)} />}
              title="Grievance Redressal"
              description="Complaints & contacts"
            />
          </Link>
          <Link href="/favorites" {...stylex.props(stylex.defaultMarker(), styles.tile)}>
            <TileBody
              icon={<Star {...stylex.props(styles.icon20)} />}
              title="Favorites"
              description={<FavoritesTileLabel />}
            />
          </Link>
          <Link href="/emergency" {...stylex.props(styles.tile, styles.emergencyTile)}>
            <TileBody
              accent
              icon={<Siren {...stylex.props(styles.icon20)} />}
              title="Emergency"
              description="Clinic, ambulance & security"
            />
          </Link>
        </div>
      </section>
    </main>
  );
}
