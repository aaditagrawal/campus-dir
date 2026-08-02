"use client";

import {
  clearAll,
  removeFavorite,
  useFavorites,
  useFavoritesLoaded,
  type FavoriteItem,
  type FavoriteType,
} from "@/hooks/useFavorites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Phone, ExternalLink, Trash2, Download, Check, Copy } from "lucide-react";
import Link from "next/link";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import { useMemo, useState } from "react";

/**
 * Also fixes the section order. Any type missing from this list is simply not
 * rendered — previously an unlisted type (`grievance`) crashed the page.
 */
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

export default function FavoritesPage() {
  const favorites = useFavorites();
  const isLoaded = useFavoritesLoaded();
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const groupedFavorites = useMemo(() => {
    const grouped = new Map<FavoriteType, FavoriteItem[]>();
    for (const fav of favorites) {
      const bucket = grouped.get(fav.type);
      if (bucket) bucket.push(fav);
      else grouped.set(fav.type, [fav]);
    }
    return grouped;
  }, [favorites]);

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  };

  const handleDownloadVCard = (item: FavoriteItem) => {
    if (!item.phones || item.phones.length === 0) return;
    
    const vcard = buildVCard({
      name: item.name,
      phones: item.phones,
    });
    downloadVCardFile(item.name, vcard);
  };

  if (!isLoaded) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center text-muted-foreground">Loading favorites...</div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight mb-2">
            Your Favorites
          </h1>
          <p className="text-muted-foreground">
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
              if (confirm("Are you sure you want to clear all favorites?")) {
                clearAll();
              }
            }}
            className="text-destructive hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Browse through restaurants, hostels, emergency contacts, services, or travel
              options and click the star icon to add them to your favorites.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/restaurants">
                <Button variant="outline" size="sm">
                  Browse Restaurants
                </Button>
              </Link>
              <Link href="/emergency">
                <Button variant="outline" size="sm">
                  Emergency Contacts
                </Button>
              </Link>
              <Link href="/hostels">
                <Button variant="outline" size="sm">
                  Hostels
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map(({ type, label }) => {
            const items = groupedFavorites.get(type);
            if (!items) return null;

            return (
              <section key={type}>
                <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                  {label}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((item) => (
                    <Card key={item.id} className="relative group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {item.href.startsWith('http') ? (
                              <a href={item.href} target="_blank" rel="noreferrer" className="hover:underline cursor-pointer">
                                <CardTitle className="text-lg mb-1">
                                  {item.name}
                                </CardTitle>
                              </a>
                            ) : (
                              <Link href={item.href} className="hover:underline cursor-pointer">
                                <CardTitle className="text-lg mb-1">
                                  {item.name}
                                </CardTitle>
                              </Link>
                            )}
                            {item.subtitle && (
                              <p className="text-sm text-muted-foreground">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {item.phones && item.phones.length > 0 && (
                          <div className="space-y-2">
                            {item.phones.map((phone, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <a
                                  href={`tel:${phone}`}
                                  className="hover:underline font-mono flex-1"
                                >
                                  {phone}
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyPhone(phone)}
                                  className="h-7 px-2 cursor-pointer"
                                >
                                  {copiedPhone === phone ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t">
                          {item.href.startsWith('http') ? (
                            <a href={item.href} target="_blank" rel="noreferrer" className="flex-1">
                              <Button variant="outline" size="sm" className="w-full cursor-pointer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                Open Link
                              </Button>
                            </a>
                          ) : (
                            <Link href={item.href} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full cursor-pointer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                View Details
                              </Button>
                            </Link>
                          )}
                          {item.phones && item.phones.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadVCard(item)}
                              title="Download vCard"
                              className="cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFavorite(item.id)}
                            className="text-destructive hover:text-destructive cursor-pointer"
                            title="Remove from favorites"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
