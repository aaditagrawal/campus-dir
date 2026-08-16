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
import { FavoritesTileLabel, SearchLauncher } from "@/components/home-client";
import { RandomTelButton } from "@/components/contact-actions";
import { getAutoPhoneOptions } from "@/lib/random-auto";
import { slugify } from "@/lib/utils";

const quickActionRow =
  "group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-muted/50 active:bg-muted/70 outline-none focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset sm:px-5";

const sectionLabel =
  "mb-3 px-1 font-sans text-xs font-medium uppercase tracking-widest text-muted-foreground";

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
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium tracking-tight">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/60 transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden
      />
    </>
  );
}

const browseTile =
  "group rounded-xl border border-border/50 bg-card/40 p-4 outline-none transition-colors duration-150 hover:border-border hover:bg-card/80 active:bg-card focus-visible:ring-2 focus-visible:ring-ring/50";

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
      <span
        className={
          accent
            ? "text-rose-500"
            : "text-muted-foreground transition-colors duration-150 group-hover:text-foreground"
        }
      >
        {icon}
      </span>
      <span
        className={`mt-3 block text-sm font-medium tracking-tight ${accent ? "text-rose-600 dark:text-rose-400" : ""}`}
      >
        {title}
      </span>
      <span
        className={`mt-0.5 block text-xs ${accent ? "text-rose-500/70" : "text-muted-foreground"}`}
      >
        {description}
      </span>
    </>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 pt-14 pb-24 md:pt-24">
      <section className="text-center">
        <h1 className="font-serif text-4xl tracking-tight text-balance sm:text-5xl md:text-6xl">
          MIT Manipal Directory
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground text-balance md:text-lg">
          Restaurants, hostels, travel, and emergency contacts — in one place.
        </p>
        <div className="mx-auto mt-7 max-w-sm">
          <SearchLauncher />
        </div>
      </section>

      <section className="mt-14" aria-label="Quick actions">
        <h2 className={sectionLabel}>Quick actions</h2>
        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
          <RandomTelButton
            options={getAutoPhoneOptions()}
            className={quickActionRow}
            aria-label="Call a random auto from the directory"
          >
            <QuickActionBody
              icon={<Shuffle className="size-4" aria-hidden />}
              title="Call a random auto"
              description="Opens your dialer with a stand or driver number"
            />
          </RandomTelButton>
          <Link href="/travel/auto" className={quickActionRow}>
            <QuickActionBody
              icon={<Car className="size-4" aria-hidden />}
              title="Get a taxi or auto"
              description="Gate stands, cabs & airport rates"
            />
          </Link>
          <Link href="/tools/mail-to-warden" className={quickActionRow}>
            <QuickActionBody
              icon={<Mail className="size-4" aria-hidden />}
              title="Mail to warden"
              description="Generate leave request emails"
            />
          </Link>
        </div>
      </section>

      <section className="mt-12" aria-label="Browse">
        <h2 className={sectionLabel}>Browse</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Link href="/academics" className={browseTile}>
            <TileBody
              icon={<GraduationCap className="size-5" />}
              title="Academics"
              description="Systems & portals"
            />
          </Link>
          <Link href="/restaurants" className={browseTile}>
            <TileBody
              icon={<Utensils className="size-5" />}
              title="Restaurants"
              description="Menus & delivery"
            />
          </Link>
          <Link href="/hostels" className={browseTile}>
            <TileBody
              icon={<Building className="size-5" />}
              title="Hostels"
              description="Wardens & contacts"
            />
          </Link>
          <Link href={`/travel#${slugify("Cabs & Taxis")}`} className={browseTile}>
            <TileBody
              icon={<Car className="size-5" />}
              title="Travel"
              description="Autos, cabs & taxis"
            />
          </Link>
          <Link href="/services" className={browseTile}>
            <TileBody
              icon={<Wrench className="size-5" />}
              title="Services"
              description="Laundry & xerox"
            />
          </Link>
          <Link href="/tools" className={browseTile}>
            <TileBody
              icon={<Settings className="size-5" />}
              title="Tools"
              description="Maps & resources"
            />
          </Link>
          <Link href="/grievance" className={browseTile}>
            <TileBody
              icon={<MessageSquareWarning className="size-5" />}
              title="Grievance Redressal"
              description="Complaints & contacts"
            />
          </Link>
          <Link href="/favorites" className={browseTile}>
            <TileBody
              icon={<Star className="size-5" />}
              title="Favorites"
              description={<FavoritesTileLabel />}
            />
          </Link>
          <Link
            href="/emergency"
            className="group col-span-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4 outline-none transition-colors duration-150 hover:border-rose-500/40 hover:bg-rose-500/[0.08] focus-visible:ring-2 focus-visible:ring-rose-500/40 md:col-span-1"
          >
            <TileBody
              accent
              icon={<Siren className="size-5" />}
              title="Emergency"
              description="Clinic, ambulance & security"
            />
          </Link>
        </div>
      </section>
    </main>
  );
}
