"use client";

import { useMemo, useState } from "react";
import data from "@/data/hostels.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";

type Hostel = {
  block: string;
  campus?: string;
  address?: string;
  receptionPhone?: string;
  email?: string;
  wardens: {
    name: string;
    designation?: string;
    officePhone?: string;
    mobiles?: string[];
    email?: string;
  }[];
};

function telHref(phone: string) {
  return phone.replace(/\s+/g, "");
}

function openDialer(phone: string) {
  window.location.href = `tel:${telHref(phone)}`;
}

function blockPhones(h: Hostel): string[] {
  const out: string[] = [];
  if (h.receptionPhone) out.push(h.receptionPhone);
  for (const w of h.wardens) {
    if (w.mobiles) out.push(...w.mobiles);
    if (w.officePhone) out.push(w.officePhone);
  }
  return [...new Set(out)];
}

function wardenPrimaryPhone(w: Hostel["wardens"][number]): string | null {
  if (w.mobiles?.length) return w.mobiles[0];
  if (w.officePhone) return w.officePhone;
  return null;
}

export default function HostelsPage() {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const hostels = data as Hostel[];

  const sortedHostels = useMemo(() => {
    if (!sortOrder) return hostels;
    return [...hostels].sort((a, b) => {
      // Extract block numbers from "Block X" format
      const getBlockNumber = (block: string) => {
        const match = block.match(/Block (\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const numA = getBlockNumber(a.block);
      const numB = getBlockNumber(b.block);

      if (numA !== numB) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      // If numbers are equal, fallback to alphabetical
      return sortOrder === 'asc' ? a.block.localeCompare(b.block) : b.block.localeCompare(a.block);
    });
  }, [hostels, sortOrder]);

  const toggleSort = () => {
    setSortOrder(current => {
      if (current === null) return 'asc';
      if (current === 'asc') return 'desc';
      return null;
    });
  };
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif">Hostels</h1>
          <p className="text-sm text-muted-foreground mt-1">Wardens and block contacts</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
          className="gap-1.5 h-8 text-xs"
        >
          {sortOrder === 'asc' && <ArrowUp className="size-3.5" />}
          {sortOrder === 'desc' && <ArrowDown className="size-3.5" />}
          {sortOrder === null && <ArrowUpDown className="size-3.5" />}
          {sortOrder === 'asc' ? '1→9' : sortOrder === 'desc' ? '9→1' : 'Sort'}
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {sortedHostels.map((h) => {
          const receptionPhone = h.receptionPhone;
          return (
          <Card key={h.block} id={slugify(h.block)} className="glass scroll-mt-24">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-xl font-serif">{h.block}</CardTitle>
                  {h.campus && (
                    <p className="text-xs text-muted-foreground mt-0.5">{h.campus}</p>
                  )}
                </div>
                <FavoriteButton
                  item={{
                    id: `hostel-block-${slugify(h.block)}`,
                    type: "hostel",
                    name: h.block,
                    href: `/hostels#${slugify(h.block)}`,
                    phones: blockPhones(h),
                    subtitle: h.campus,
                  }}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {receptionPhone && (
                <div
                  id={`${slugify(h.block)}-reception`}
                  className="py-2 border-t border-border/50 first:border-t-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">Reception</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialer(receptionPhone)}
                        className="h-7 text-xs px-2 shrink-0"
                        aria-label={`Call reception at ${receptionPhone}`}
                        title="Call reception"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const v = buildVCard({
                            name: "Reception",
                            title: "Hostel reception",
                            phones: [receptionPhone],
                            email: h.email,
                            org: h.block,
                            address: [h.campus, h.address].filter(Boolean).join(", ") || undefined,
                          });
                          downloadVCardFile(`${h.block}-reception`, v);
                        }}
                        className="h-7 text-xs px-2 shrink-0"
                        aria-label="Save reception contact"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm font-medium">
                    <a
                      href={`tel:${telHref(receptionPhone)}`}
                      className="text-foreground underline underline-offset-2 decoration-muted-foreground hover:decoration-foreground"
                    >
                      {receptionPhone}
                    </a>
                    {h.email && (
                      <a
                        href={`mailto:${h.email}`}
                        className="text-xs font-normal text-muted-foreground hover:text-foreground hover:underline underline-offset-2 truncate max-w-[220px]"
                      >
                        {h.email}
                      </a>
                    )}
                  </div>
                </div>
              )}
              {h.wardens.map((w, i) => {
                const quickCall = wardenPrimaryPhone(w);
                return (
                <div key={i} id={slugify(`${h.block}-${w.name}`)} className="py-2 first:pt-0 border-t first:border-0 border-border/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{w.name}</div>
                      {w.designation && (
                        <div className="text-xs text-muted-foreground">{w.designation}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {quickCall && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialer(quickCall)}
                          className="h-7 text-xs px-2 shrink-0"
                          aria-label={`Call ${w.name}`}
                          title="Quick call"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const v = buildVCard({
                            name: w.name,
                            title: w.designation,
                            phones: [...(w.mobiles ?? []), ...(w.officePhone ? [w.officePhone] : [])],
                            email: w.email,
                            org: h.block,
                            address: [h.campus, h.address].filter(Boolean).join(", ") || undefined,
                          });
                          downloadVCardFile(`${h.block}-${w.name}`, v);
                        }}
                        className="h-7 text-xs px-2 shrink-0"
                        aria-label="Save contact"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                    {w.mobiles && w.mobiles.length > 0 && w.mobiles.map((m) => (
                      <a key={m} href={`tel:${telHref(m)}`} className="hover:text-foreground hover:underline underline-offset-2">{m}</a>
                    ))}
                    {w.officePhone && (
                      <a href={`tel:${telHref(w.officePhone)}`} className="hover:text-foreground hover:underline underline-offset-2">Office: {w.officePhone}</a>
                    )}
                    {w.email && (
                      <a href={`mailto:${w.email}`} className="hover:text-foreground hover:underline underline-offset-2 truncate max-w-[200px]">{w.email}</a>
                    )}
                  </div>
                </div>
                );
              })}
            </CardContent>
          </Card>
          );
        })}
      </div>
    </main>
  );
}


