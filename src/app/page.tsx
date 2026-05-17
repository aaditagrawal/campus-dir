"use client";

import Link from "next/link";
import {
  Siren,
  GraduationCap,
  Search,
  Settings,
  Mail,
  Utensils,
  Building,
  Car,
  Wrench,
  Star,
  MessageSquareWarning,
  Phone,
  ChevronRight,
  Shuffle,
} from "lucide-react";
import { useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { slugify } from "@/lib/utils";

export default function Home() {
  const isMac = useMemo(
    () => navigator.platform.toUpperCase().includes("MAC"),
    [],
  );
  const { count: favoritesCount, isLoaded } = useFavorites();
  return (
    <main className="max-w-5xl mx-auto px-6 py-14 md:py-24 grid gap-12">
      <section className="text-center space-y-6">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-tight">
          MIT Manipal Directory
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Find restaurants, hostels, travel, services, and emergency contacts.
        </p>
        <div className="mx-auto max-w-sm pt-2">
          <button
            className="w-full flex items-center gap-3 rounded-full border border-border/60 bg-card/50 px-5 py-3 text-left text-sm shadow-sm hover:bg-muted/40 hover:border-border hover:shadow transition-all duration-200"
            onClick={() => {
              window.dispatchEvent(new Event("open-global-search"));
            }}
            aria-label="Open search"
          >
            <Search className="size-4 text-muted-foreground" />
            <span className="flex-1 text-muted-foreground">
              Search anything…
            </span>
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {isMac ? "⌘K" : "Ctrl+K"}
            </kbd>
          </button>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="overflow-hidden rounded-xl border-2 border-amber-600/35 bg-amber-500/[0.07] shadow-md transition-shadow hover:shadow-lg dark:border-amber-500/40 dark:bg-amber-500/10">
          <Link
            href={`/travel#${slugify("Autos")}`}
            className="group flex items-center gap-4 border-b border-amber-600/20 px-4 py-4 outline-none transition hover:bg-amber-500/12 focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-amber-600/45 focus-visible:ring-inset sm:px-5 dark:border-amber-500/25 dark:hover:bg-amber-500/15 dark:focus-visible:ring-amber-400/50"
          >
            <Shuffle
              className="size-5 shrink-0 text-amber-700 dark:text-amber-400"
              aria-hidden
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-base font-semibold tracking-tight">
                Call Random Auto
              </p>
              <p className="text-sm text-muted-foreground">
                Jump to the autos section on Travel
              </p>
            </div>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link
            href="/travel/auto"
            className="group flex items-center gap-4 px-4 py-4 outline-none transition hover:bg-amber-500/12 focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-amber-600/45 focus-visible:ring-inset sm:px-5 dark:hover:bg-amber-500/15 dark:focus-visible:ring-amber-400/50"
          >
            <Phone
              className="size-5 shrink-0 text-amber-700 dark:text-amber-400"
              aria-hidden
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-base font-semibold tracking-tight">
                Explore Autos list
              </p>
              <p className="text-sm text-muted-foreground">
                Gate stands &amp; drivers — one tap to dial
              </p>
            </div>
            <ChevronRight
              className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        <Link
          href={`/travel#${slugify("Cabs & Taxis")}`}
          className="group flex items-center gap-4 rounded-xl border-2 border-neutral-950/90 bg-[#facc15] px-4 py-4 shadow-md outline-none transition hover:bg-[#eab308] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-neutral-950/40 focus-visible:ring-offset-2 sm:px-5 dark:border-neutral-950 dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:focus-visible:ring-yellow-700/60"
        >
          <Car
            className="size-5 shrink-0 text-neutral-950"
            aria-hidden
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-base font-semibold tracking-tight text-neutral-950">
              Get taxis
            </p>
            <p className="text-sm text-neutral-900/75">
              Cabs, airport rates &amp; taxi union contacts
            </p>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-neutral-950/70 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>

        <Link
          href="/tools/mail-to-warden"
          className="group flex items-center gap-4 rounded-xl border-2 border-emerald-600/35 bg-emerald-500/[0.06] px-4 py-4 shadow-md outline-none transition hover:border-emerald-600/50 hover:bg-emerald-500/10 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-600/45 focus-visible:ring-offset-2 sm:px-5 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/40 dark:focus-visible:ring-emerald-400/45"
        >
          <Mail
            className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-base font-semibold tracking-tight">
              Generate Mail to Warden
            </p>
            <p className="text-sm text-muted-foreground">
              Leave requests &amp; hostel email
            </p>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Link href="/academics" className="group">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <GraduationCap className="h-6 w-6 mb-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            <h3 className="text-base font-medium mb-1 font-serif">Academics</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Systems & portals
            </p>
          </div>
        </Link>
        <Link href="/restaurants" className="group">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Utensils className="h-6 w-6 mb-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            <h3 className="text-base font-medium mb-1 font-serif">Restaurants</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Menus & delivery
            </p>
          </div>
        </Link>
        <Link href="/hostels" className="group">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Building className="h-6 w-6 mb-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            <h3 className="text-base font-medium mb-1 font-serif">Hostels</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Wardens & contacts
            </p>
          </div>
        </Link>
        <Link href="/travel" className="group">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Car className="h-6 w-6 mb-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            <h3 className="text-base font-medium mb-1 font-serif">Travel</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Autos, cabs & taxis
            </p>
          </div>
        </Link>
        <Link href="/services" className="group">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Wrench className="h-6 w-6 mb-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            <h3 className="text-base font-medium mb-1 font-serif">Services</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Laundry & xerox
            </p>
          </div>
        </Link>
        <Link href="/tools" className="group">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Settings className="h-6 w-6 mb-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            <h3 className="text-base font-medium mb-1 font-serif">Tools</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Maps & resources
            </p>
          </div>
        </Link>
        <Link href="/favorites" className="group">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <Star className="h-6 w-6 mb-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            <h3 className="text-base font-medium mb-1 font-serif">Favorites</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              {!isLoaded ? "Loading..." : favoritesCount === 0 ? "Save your contacts" : "Your saved items"}
            </p>
          </div>
        </Link>
        <Link href="/grievance" className="group">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-border/50 bg-card/60 hover:bg-card hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <MessageSquareWarning className="h-6 w-6 mb-3 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            <h3 className="text-base font-medium mb-1 font-serif">Grievance Redressal</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Complaints & contacts
            </p>
          </div>
        </Link>
        <Link href="/emergency" className="group sm:col-span-2 md:col-span-3 lg:col-span-2">
          <div className="h-full p-5 sm:p-6 rounded-xl border border-rose-400/40 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-400/60 hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-rose-500 shrink-0" />
              <div>
                <h3 className="text-base font-medium text-rose-600 dark:text-rose-400 font-serif">
                  Emergency
                </h3>
                <p className="text-sm text-rose-500/80">
                  Clinic, ambulance & security
                </p>
              </div>
            </div>
          </div>
        </Link>
      </section>
    </main>
  );
}
