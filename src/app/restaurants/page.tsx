"use client";

import { useMemo, useState, useTransition, memo } from "react";
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

function downloadRestaurantVcf(r: Restaurant) {
  const v = buildVCard({ name: r.name, org: r.name, phones: r.phones, address: r.address });
  downloadVCardFile(r.name, v);
}

const RestaurantCard = memo(function RestaurantCard({
  r,
  status,
}: {
  r: Restaurant;
  status: OpenStatus;
}) {
  return (
    <Card id={r.slug} className="glass mb-3 break-inside-avoid scroll-mt-24">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{r.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {status && (
              <Badge variant="outline" className={status.open ? "border-green-500/50 text-green-600 dark:text-green-400" : "border-rose-400/50 text-rose-500"}>
                {status.open ? "Open" : "Closed"}
              </Badge>
            )}
            <FavoriteButton
              item={{
                id: `restaurant-${r.slug}`,
                type: "restaurant",
                name: r.name,
                href: `/restaurants#${r.slug}`,
                phones: r.phones,
                subtitle: r.address,
              }}
              size="sm"
            />
          </div>
        </div>
        {status && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            {status.range}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {r.phones?.map((p) => (
            <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
              {p}
            </a>
          ))}
        </div>
        {(r.deliveryFee || r.packagingFee) && (
          <div className="text-xs text-muted-foreground">
            {r.deliveryFee && <span>Delivery: {r.deliveryFee}</span>}
            {r.deliveryFee && r.packagingFee && <span> · </span>}
            {r.packagingFee && <span>Packaging: {r.packagingFee}</span>}
          </div>
        )}
        <div className="flex gap-2 flex-wrap pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.location.href = `tel:${r.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
            }}
            className="gap-1.5 h-8"
          >
            <Phone className="size-3.5" />
            Call
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadRestaurantVcf(r)} className="h-8">
            Save Contact
          </Button>
          {r.menuUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(r.menuUrl, '_blank')}
              className="gap-1.5 h-8"
            >
              <ExternalLink className="size-3.5" />
              Menu
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function RestaurantsPage() {
  const [sortOrder, setSortOrder] = useState<'alpha-asc' | 'alpha-desc' | 'open-now' | null>(null);
  const [, startTransition] = useTransition();
  const statuses = useRestaurantStatuses();

  // Both alphabetical orders were computed when the module loaded; only
  // open-first depends on the clock, and it is a stable partition of the
  // alphabetical order rather than another comparator sort.
  const sortedRestaurants = useMemo(() => {
    switch (sortOrder) {
      case 'alpha-asc':
        return BY_NAME_ASC;
      case 'alpha-desc':
        return BY_NAME_DESC;
      case 'open-now':
        return byOpenFirst(statuses);
      default:
        return RESTAURANTS;
    }
  }, [sortOrder, statuses]);

  const toggleSort = () => {
    startTransition(() => {
      setSortOrder(current => {
        if (current === null) return 'alpha-asc';
        if (current === 'alpha-asc') return 'alpha-desc';
        if (current === 'alpha-desc') return 'open-now';
        return null;
      });
    });
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif">Restaurants</h1>
          <p className="text-sm text-muted-foreground mt-1">Call or save contacts</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
          className="gap-1.5 h-8 text-xs"
        >
          {sortOrder === 'alpha-asc' && <ArrowUp className="size-3.5" />}
          {sortOrder === 'alpha-desc' && <ArrowDown className="size-3.5" />}
          {sortOrder === 'open-now' && <Clock className="size-3.5" />}
          {sortOrder === null && <ArrowUpDown className="size-3.5" />}
          {sortOrder === 'alpha-asc' ? 'A-Z' : sortOrder === 'alpha-desc' ? 'Z-A' : sortOrder === 'open-now' ? 'Open' : 'Sort'}
        </Button>
      </div>
      <div className="columns-1 sm:columns-2 gap-3">
        {sortedRestaurants.map((r) => (
          <RestaurantCard key={r.name} r={r} status={statuses[r.index]} />
        ))}
      </div>
    </main>
  );
}
