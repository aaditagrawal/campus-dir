"use client";

import { useMemo, useState, useTransition, memo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import {
  byOpenFirst,
  BY_NAME_ASC,
  BY_NAME_DESC,
  RESTAURANTS,
  type OpenStatus,
  type Restaurant,
} from "@/lib/restaurant-hours";
import { useRestaurantStatuses } from "@/hooks/useRestaurantStatuses";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Clock, Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { breakpoints, colors, fonts } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

function downloadRestaurantVcf(restaurant: Restaurant) {
  const vcard = buildVCard({
    name: restaurant.name,
    org: restaurant.name,
    phones: restaurant.phones,
    address: restaurant.address,
  });
  downloadVCardFile(restaurant.name, vcard);
}

const styles = stylex.create({
  page: { paddingBlock: { default: "2rem", [breakpoints.md]: "3rem" } },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: { default: "1.5rem", [breakpoints.md]: "1.875rem" },
    lineHeight: { default: "2rem", [breakpoints.md]: "2.25rem" },
  },
  subtitle: {
    marginTop: "0.25rem",
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  sortButton: { height: "2rem", gap: "0.375rem", fontSize: "0.75rem" },
  icon14: { width: "0.875rem", height: "0.875rem" },
  columns: {
    columnCount: { default: 1, [breakpoints.sm]: 2 },
    columnGap: "0.75rem",
  },
  card: { marginBottom: "0.75rem", breakInside: "avoid", scrollMarginTop: "6rem" },
  cardHeader: { paddingBottom: "0.5rem" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  grow: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: "1.125rem" },
  statusRow: { display: "flex", alignItems: "center", gap: "0.25rem" },
  open: { borderColor: "oklch(0.723 0.219 149.579 / 50%)", color: "oklch(0.627 0.194 149.214)" },
  closed: { borderColor: "oklch(0.712 0.194 13.428 / 50%)", color: colors.rose },
  hours: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  clockIcon: { width: "0.75rem", height: "0.75rem" },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    paddingTop: 0,
  },
  phones: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "0.75rem",
    rowGap: "0.25rem",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  phoneLink: {
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    textUnderlineOffset: "2px",
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
  fees: { color: colors.mutedForeground, fontSize: "0.75rem", lineHeight: "1rem" },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.5rem", paddingTop: "0.25rem" },
  actionButton: { height: "2rem" },
});

const RestaurantCard = memo(function RestaurantCard({
  restaurant,
  status,
}: {
  restaurant: Restaurant;
  status: OpenStatus;
}) {
  return (
    <Card id={restaurant.slug} xstyle={[shared.glass, styles.card]}>
      <CardHeader xstyle={styles.cardHeader}>
        <div {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.grow)}>
            <CardTitle xstyle={styles.cardTitle}>{restaurant.name}</CardTitle>
          </div>
          <div {...stylex.props(styles.statusRow)}>
            {status && (
              <Badge variant="outline" xstyle={status.open ? styles.open : styles.closed}>
                {status.open ? "Open" : "Closed"}
              </Badge>
            )}
            <FavoriteButton
              item={{
                id: `restaurant-${restaurant.slug}`,
                type: "restaurant",
                name: restaurant.name,
                href: `/restaurants#${restaurant.slug}`,
                phones: restaurant.phones,
                subtitle: restaurant.address,
              }}
              size="sm"
            />
          </div>
        </div>
        {status && (
          <div {...stylex.props(styles.hours)}>
            <Clock {...stylex.props(styles.clockIcon)} />
            {status.range}
          </div>
        )}
      </CardHeader>
      <CardContent xstyle={styles.content}>
        <div {...stylex.props(styles.phones)}>
          {restaurant.phones?.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s+/g, "")}`}
              {...stylex.props(styles.phoneLink)}
            >
              {phone}
            </a>
          ))}
        </div>
        {(restaurant.deliveryFee || restaurant.packagingFee) && (
          <div {...stylex.props(styles.fees)}>
            {restaurant.deliveryFee && <span>Delivery: {restaurant.deliveryFee}</span>}
            {restaurant.deliveryFee && restaurant.packagingFee && <span> · </span>}
            {restaurant.packagingFee && <span>Packaging: {restaurant.packagingFee}</span>}
          </div>
        )}
        <div {...stylex.props(styles.actions)}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.href = `tel:${restaurant.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
            }}
            xstyle={styles.actionButton}
          >
            <Phone {...stylex.props(styles.icon14)} />
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadRestaurantVcf(restaurant)}
            xstyle={styles.actionButton}
          >
            Save Contact
          </Button>
          {restaurant.menuUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(restaurant.menuUrl, "_blank")}
              xstyle={styles.actionButton}
            >
              <ExternalLink {...stylex.props(styles.icon14)} />
              Menu
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function RestaurantsPage() {
  const [sortOrder, setSortOrder] = useState<"alpha-asc" | "alpha-desc" | "open-now" | null>(null);
  const [, startTransition] = useTransition();
  const statuses = useRestaurantStatuses();
  const sortedRestaurants = useMemo(() => {
    switch (sortOrder) {
      case "alpha-asc":
        return BY_NAME_ASC;
      case "alpha-desc":
        return BY_NAME_DESC;
      case "open-now":
        return byOpenFirst(statuses);
      default:
        return RESTAURANTS;
    }
  }, [sortOrder, statuses]);

  const toggleSort = () => {
    startTransition(() => {
      setSortOrder((current) => {
        if (current === null) return "alpha-asc";
        if (current === "alpha-asc") return "alpha-desc";
        if (current === "alpha-desc") return "open-now";
        return null;
      });
    });
  };

  return (
    <main {...stylex.props(shared.page, styles.page)}>
      <div {...stylex.props(styles.pageHeader)}>
        <div>
          <h1 {...stylex.props(styles.title)}>Restaurants</h1>
          <p {...stylex.props(styles.subtitle)}>Call or save contacts</p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleSort} xstyle={styles.sortButton}>
          {sortOrder === "alpha-asc" && <ArrowUp {...stylex.props(styles.icon14)} />}
          {sortOrder === "alpha-desc" && <ArrowDown {...stylex.props(styles.icon14)} />}
          {sortOrder === "open-now" && <Clock {...stylex.props(styles.icon14)} />}
          {sortOrder === null && <ArrowUpDown {...stylex.props(styles.icon14)} />}
          {sortOrder === "alpha-asc"
            ? "A-Z"
            : sortOrder === "alpha-desc"
              ? "Z-A"
              : sortOrder === "open-now"
                ? "Open"
                : "Sort"}
        </Button>
      </div>
      <div {...stylex.props(styles.columns)}>
        {sortedRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.name}
            restaurant={restaurant}
            status={statuses[restaurant.index]}
          />
        ))}
      </div>
    </main>
  );
}
