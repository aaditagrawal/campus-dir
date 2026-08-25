"use client";

import {
  clearAll,
  removeFavorite,
  useFavorites,
  useFavoritesLoaded,
  type FavoriteItem,
  type FavoriteType,
} from "@/hooks/useFavorites";
import * as stylex from "@stylexjs/stylex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Phone, ExternalLink, Trash2, Download, Check, Copy } from "lucide-react";
import Link from "next/link";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import { useMemo, useState } from "react";
import { breakpoints, colors, fonts } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

const SECTIONS: ReadonlyArray<{ type: FavoriteType; label: string }> = [
  { type: "restaurant", label: "Restaurants" },
  { type: "hostel", label: "Hostels" },
  { type: "emergency", label: "Emergency Contacts" },
  { type: "service", label: "Services" },
  { type: "travel", label: "Travel" },
  { type: "academic", label: "Academic Resources" },
  { type: "tool", label: "Tools" },
  { type: "grievance", label: "Grievance Redressal" },
];

const styles = stylex.create({
  page: { paddingInline: "1.5rem", paddingBlock: "3rem" },
  loading: { color: colors.mutedForeground, textAlign: "center" },
  stack: { display: "flex", flexDirection: "column", gap: "2rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" },
  title: {
    marginBottom: "0.5rem",
    fontFamily: fonts.serif,
    fontSize: { default: "1.875rem", [breakpoints.md]: "2.25rem" },
    lineHeight: { default: "2.25rem", [breakpoints.md]: "2.5rem" },
    letterSpacing: "-0.025em",
  },
  destructive: {
    color: { default: colors.destructive, ":hover": colors.destructive },
    cursor: "pointer",
  },
  icon16: { width: "1rem", height: "1rem" },
  icon14: { width: "0.875rem", height: "0.875rem" },
  clearIcon: { marginRight: "0.5rem" },
  emptyCard: { borderStyle: "dashed" },
  emptyContent: { paddingTop: "3rem", paddingBottom: "3rem", textAlign: "center" },
  emptyIcon: {
    width: "3rem",
    height: "3rem",
    marginInline: "auto",
    marginBottom: "1rem",
    color: `color-mix(in oklab, ${colors.mutedForeground} 50%, transparent)`,
  },
  emptyTitle: {
    marginBottom: "0.5rem",
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
    fontWeight: 500,
  },
  emptyCopy: {
    maxWidth: "28rem",
    marginInline: "auto",
    marginBottom: "1.5rem",
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  emptyActions: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem" },
  sections: { display: "flex", flexDirection: "column", gap: "2rem" },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "1rem",
    fontFamily: fonts.serif,
    fontSize: "1.25rem",
    lineHeight: "1.75rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [breakpoints.md]: "repeat(2, minmax(0, 1fr))",
    },
    gap: "1rem",
  },
  card: { position: "relative" },
  cardHeader: { paddingBottom: "0.75rem" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  grow: { minWidth: 0, flex: 1 },
  titleLink: { cursor: "pointer", textDecorationLine: { default: "none", ":hover": "underline" } },
  cardTitle: { marginBottom: "0.25rem", fontSize: "1.125rem" },
  subtitle: { color: colors.mutedForeground, fontSize: "0.875rem", lineHeight: "1.25rem" },
  cardContent: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  phones: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  phoneRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  phoneIcon: { width: "1rem", height: "1rem", flexShrink: 0, color: colors.mutedForeground },
  phoneLink: {
    flex: 1,
    fontFamily: fonts.mono,
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
  copyButton: { height: "1.75rem", paddingInline: "0.5rem", cursor: "pointer" },
  actions: {
    display: "flex",
    gap: "0.5rem",
    paddingTop: "0.5rem",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
  },
  actionGrow: { flex: 1, width: "100%", cursor: "pointer" },
  actionIcon: { marginRight: "0.375rem" },
  pointer: { cursor: "pointer" },
});

export default function FavoritesPage() {
  const favorites = useFavorites();
  const isLoaded = useFavoritesLoaded();
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const groupedFavorites = useMemo(() => {
    const grouped = new Map<FavoriteType, FavoriteItem[]>();
    for (const favorite of favorites) {
      const bucket = grouped.get(favorite.type);
      if (bucket) bucket.push(favorite);
      else grouped.set(favorite.type, [favorite]);
    }
    return grouped;
  }, [favorites]);

  const copyPhone = (phone: string) => {
    navigator.clipboard
      .writeText(phone)
      .then(() => {
        setCopiedPhone(phone);
        setTimeout(() => setCopiedPhone(null), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
      });
  };

  const handleDownloadVCard = (item: FavoriteItem) => {
    if (!item.phones?.length) return;
    downloadVCardFile(item.name, buildVCard({ name: item.name, phones: item.phones }));
  };

  if (!isLoaded) {
    return (
      <main {...stylex.props(shared.page, styles.page)}>
        <div {...stylex.props(styles.loading)}>Loading favorites...</div>
      </main>
    );
  }

  return (
    <main {...stylex.props(shared.page, styles.page, styles.stack)}>
      <div {...stylex.props(styles.header)}>
        <div>
          <h1 {...stylex.props(styles.title)}>Your Favorites</h1>
          <p {...stylex.props(shared.mutedText)}>
            {favorites.length === 0
              ? "No favorites yet. Start adding items from any page!"
              : `${favorites.length} item${favorites.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>
        {favorites.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to clear all favorites?")) clearAll();
            }}
            xstyle={styles.destructive}
          >
            <Trash2 {...stylex.props(styles.icon16, styles.clearIcon)} />
            Clear All
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card xstyle={styles.emptyCard}>
          <CardContent xstyle={styles.emptyContent}>
            <Star {...stylex.props(styles.emptyIcon)} />
            <h3 {...stylex.props(styles.emptyTitle)}>No favorites yet</h3>
            <p {...stylex.props(styles.emptyCopy)}>
              Browse through restaurants, hostels, emergency contacts, services, or travel options
              and click the star icon to add them to your favorites.
            </p>
            <div {...stylex.props(styles.emptyActions)}>
              <Button asChild variant="outline" size="sm">
                <Link href="/restaurants">Browse Restaurants</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/emergency">Emergency Contacts</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/hostels">Hostels</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div {...stylex.props(styles.sections)}>
          {SECTIONS.map(({ type, label }) => {
            const items = groupedFavorites.get(type);
            if (!items) return null;
            return (
              <section key={type}>
                <h2 {...stylex.props(styles.sectionTitle)}>{label}</h2>
                <div {...stylex.props(styles.grid)}>
                  {items.map((item) => (
                    <Card key={item.id} xstyle={styles.card}>
                      <CardHeader xstyle={styles.cardHeader}>
                        <div {...stylex.props(styles.row)}>
                          <div {...stylex.props(styles.grow)}>
                            {item.href.startsWith("http") ? (
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noreferrer"
                                {...stylex.props(styles.titleLink)}
                              >
                                <CardTitle xstyle={styles.cardTitle}>{item.name}</CardTitle>
                              </a>
                            ) : (
                              <Link href={item.href} {...stylex.props(styles.titleLink)}>
                                <CardTitle xstyle={styles.cardTitle}>{item.name}</CardTitle>
                              </Link>
                            )}
                            {item.subtitle && (
                              <p {...stylex.props(styles.subtitle)}>{item.subtitle}</p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent xstyle={styles.cardContent}>
                        {item.phones && item.phones.length > 0 && (
                          <div {...stylex.props(styles.phones)}>
                            {item.phones.map((phone) => (
                              <div key={`${item.id}-${phone}`} {...stylex.props(styles.phoneRow)}>
                                <Phone {...stylex.props(styles.phoneIcon)} />
                                <a href={`tel:${phone}`} {...stylex.props(styles.phoneLink)}>
                                  {phone}
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyPhone(phone)}
                                  xstyle={styles.copyButton}
                                >
                                  {copiedPhone === phone ? (
                                    <Check {...stylex.props(styles.icon14)} />
                                  ) : (
                                    <Copy {...stylex.props(styles.icon14)} />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div {...stylex.props(styles.actions)}>
                          <Button asChild variant="outline" size="sm" xstyle={styles.actionGrow}>
                            {item.href.startsWith("http") ? (
                              <a href={item.href} target="_blank" rel="noreferrer">
                                <ExternalLink {...stylex.props(styles.icon14, styles.actionIcon)} />
                                Open Link
                              </a>
                            ) : (
                              <Link href={item.href}>
                                <ExternalLink {...stylex.props(styles.icon14, styles.actionIcon)} />
                                View Details
                              </Link>
                            )}
                          </Button>
                          {item.phones && item.phones.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadVCard(item)}
                              title="Download vCard"
                              xstyle={styles.pointer}
                            >
                              <Download {...stylex.props(styles.icon14)} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFavorite(item.id)}
                            xstyle={[styles.destructive, styles.pointer]}
                            title="Remove from favorites"
                          >
                            <Trash2 {...stylex.props(styles.icon14)} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
