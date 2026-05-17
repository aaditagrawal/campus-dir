"use client";

import data from "@/data/travel.json";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Shuffle } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { slugify } from "@/lib/utils";

type Listing = { name: string; phones: string[]; notes?: string };

function renderNotesWithLinks(notes: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = notes.split(urlRegex);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-primary"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default function AutoQuickCallPage() {
  const autos = (data as { autos: Listing[] }).autos;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/travel"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Travel
        </Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Rapid-call an auto</h1>
        <p className="text-muted-foreground">
          Gate stands and drivers — tap to dial. If one line is busy, try the
          next.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
            <Link href={`/travel#${slugify("Autos")}`}>
              <Shuffle className="size-4" aria-hidden />
              Call Random Auto
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {autos.map((i) => (
          <Card
            key={i.name}
            id={slugify(i.name)}
            className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{i.name}</CardTitle>
                <FavoriteButton
                  item={{
                    id: `travel-autos-${slugify(i.name)}`,
                    type: "travel",
                    name: i.name,
                    href: `/travel#${slugify(i.name)}`,
                    phones: i.phones,
                    subtitle: "Autos",
                  }}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                {i.phones.map((p) => (
                  <a
                    key={p}
                    href={`tel:${p.replace(/\s+/g, "")}`}
                    className="underline"
                  >
                    {p}
                  </a>
                ))}
              </div>
              {i.notes && (
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {renderNotesWithLinks(i.notes)}
                </div>
              )}
              <Button
                className="w-full gap-2 h-11 text-base font-semibold"
                onClick={() => {
                  window.location.href = `tel:${i.phones?.[0]?.replace(/\s+/g, "") ?? ""}`;
                }}
              >
                <Phone className="size-5" />
                Call now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
