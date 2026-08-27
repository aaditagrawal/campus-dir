"use client";

import { useMemo, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import data from "@/data/hostels.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { breakpoints, colors, fonts } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

type Hostel = {
  block: string;
  campus?: string;
  address?: string;
  receptionPhone?: string;
  email?: string;
  wardens: {
    name: string;
    designation?: string;
    officePhone?: string | null;
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

function blockPhones(hostel: Hostel): string[] {
  const out: string[] = [];
  if (hostel.receptionPhone) out.push(hostel.receptionPhone);
  for (const warden of hostel.wardens) {
    if (warden.mobiles) out.push(...warden.mobiles);
    if (warden.officePhone) out.push(warden.officePhone);
  }
  return [...new Set(out)];
}

function wardenPrimaryPhone(warden: Hostel["wardens"][number]): string | null {
  if (warden.mobiles?.length) return warden.mobiles[0];
  if (warden.officePhone) return warden.officePhone;
  return null;
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
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [breakpoints.md]: "repeat(2, minmax(0, 1fr))",
    },
    gap: "1rem",
  },
  header: { paddingBottom: "0.75rem" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  min: { minWidth: 0 },
  grow: { minWidth: 0, flex: 1 },
  cardTitle: { fontFamily: fonts.serif, fontSize: "1.25rem" },
  campus: {
    marginTop: "0.125rem",
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  content: { display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: 0 },
  reception: { paddingBlock: "0.5rem" },
  contact: {
    paddingBlock: "0.5rem",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `color-mix(in oklab, ${colors.border} 50%, transparent)`,
  },
  firstContact: { paddingTop: 0, borderTopWidth: 0 },
  name: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: 500 },
  designation: { color: colors.mutedForeground, fontSize: "0.75rem", lineHeight: "1rem" },
  controls: { display: "flex", alignItems: "center", gap: "0.25rem" },
  miniButton: { height: "1.75rem", flexShrink: 0, paddingInline: "0.5rem", fontSize: "0.75rem" },
  contactPrimary: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "0.75rem",
    rowGap: "0.125rem",
    marginTop: "0.25rem",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 500,
  },
  primaryLink: {
    color: colors.foreground,
    textDecorationLine: "underline",
    textDecorationColor: { default: colors.mutedForeground, ":hover": colors.foreground },
    textUnderlineOffset: "2px",
  },
  email: {
    maxWidth: "13.75rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    fontSize: "0.75rem",
    lineHeight: "1rem",
    fontWeight: 400,
    textUnderlineOffset: "2px",
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
  details: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "0.75rem",
    rowGap: "0.125rem",
    marginTop: "0.25rem",
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  detailLink: {
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    textUnderlineOffset: "2px",
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
  detailEmail: {
    maxWidth: "12.5rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

export default function HostelsPage() {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const hostels: Hostel[] = data;
  const sortedHostels = useMemo(() => {
    if (!sortOrder) return hostels;
    return [...hostels].sort((a, b) => {
      const getBlockNumber = (block: string) => {
        const match = block.match(/Block (\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      const numA = getBlockNumber(a.block);
      const numB = getBlockNumber(b.block);
      if (numA !== numB) return sortOrder === "asc" ? numA - numB : numB - numA;
      return sortOrder === "asc" ? a.block.localeCompare(b.block) : b.block.localeCompare(a.block);
    });
  }, [hostels, sortOrder]);

  const toggleSort = () => {
    setSortOrder((current) => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  };

  return (
    <main {...stylex.props(shared.page, styles.page)}>
      <div {...stylex.props(styles.pageHeader)}>
        <div>
          <h1 {...stylex.props(styles.title)}>Hostels</h1>
          <p {...stylex.props(styles.subtitle)}>Wardens and block contacts</p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleSort} xstyle={styles.sortButton}>
          {sortOrder === "asc" && <ArrowUp {...stylex.props(styles.icon14)} />}
          {sortOrder === "desc" && <ArrowDown {...stylex.props(styles.icon14)} />}
          {sortOrder === null && <ArrowUpDown {...stylex.props(styles.icon14)} />}
          {sortOrder === "asc" ? "1→9" : sortOrder === "desc" ? "9→1" : "Sort"}
        </Button>
      </div>
      <div {...stylex.props(styles.grid)}>
        {sortedHostels.map((hostel) => {
          const receptionPhone = hostel.receptionPhone;
          return (
            <Card
              key={hostel.block}
              id={slugify(hostel.block)}
              xstyle={[shared.glass, shared.scrollTarget]}
            >
              <CardHeader xstyle={styles.header}>
                <div {...stylex.props(styles.row)}>
                  <div {...stylex.props(styles.min)}>
                    <CardTitle xstyle={styles.cardTitle}>{hostel.block}</CardTitle>
                    {hostel.campus && <p {...stylex.props(styles.campus)}>{hostel.campus}</p>}
                  </div>
                  <FavoriteButton
                    item={{
                      id: `hostel-block-${slugify(hostel.block)}`,
                      type: "hostel",
                      name: hostel.block,
                      href: `/hostels#${slugify(hostel.block)}`,
                      phones: blockPhones(hostel),
                      subtitle: hostel.campus,
                    }}
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent xstyle={styles.content}>
                {receptionPhone && (
                  <div
                    id={`${slugify(hostel.block)}-reception`}
                    {...stylex.props(styles.reception)}
                  >
                    <div {...stylex.props(styles.row)}>
                      <div {...stylex.props(styles.grow)}>
                        <div {...stylex.props(styles.name)}>Reception</div>
                      </div>
                      <div {...stylex.props(styles.controls)}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialer(receptionPhone)}
                          xstyle={styles.miniButton}
                          aria-label={`Call reception at ${receptionPhone}`}
                          title="Call reception"
                        >
                          <Phone {...stylex.props(styles.icon14)} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const vcard = buildVCard({
                              name: "Reception",
                              title: "Hostel reception",
                              phones: [receptionPhone],
                              email: hostel.email,
                              org: hostel.block,
                              address:
                                [hostel.campus, hostel.address].filter(Boolean).join(", ") ||
                                undefined,
                            });
                            downloadVCardFile(`${hostel.block}-reception`, vcard);
                          }}
                          xstyle={styles.miniButton}
                          aria-label="Save reception contact"
                        >
                          <Download {...stylex.props(styles.icon14)} />
                        </Button>
                      </div>
                    </div>
                    <div {...stylex.props(styles.contactPrimary)}>
                      <a
                        href={`tel:${telHref(receptionPhone)}`}
                        {...stylex.props(styles.primaryLink)}
                      >
                        {receptionPhone}
                      </a>
                      {hostel.email && (
                        <a href={`mailto:${hostel.email}`} {...stylex.props(styles.email)}>
                          {hostel.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {hostel.wardens.map((warden, index) => {
                  const quickCall = wardenPrimaryPhone(warden);
                  return (
                    <div
                      key={index}
                      id={slugify(`${hostel.block}-${warden.name}`)}
                      {...stylex.props(
                        styles.contact,
                        !receptionPhone && index === 0 && styles.firstContact,
                      )}
                    >
                      <div {...stylex.props(styles.row)}>
                        <div {...stylex.props(styles.grow)}>
                          <div {...stylex.props(styles.name)}>{warden.name}</div>
                          {warden.designation && (
                            <div {...stylex.props(styles.designation)}>{warden.designation}</div>
                          )}
                        </div>
                        <div {...stylex.props(styles.controls)}>
                          {quickCall && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialer(quickCall)}
                              xstyle={styles.miniButton}
                              aria-label={`Call ${warden.name}`}
                              title="Quick call"
                            >
                              <Phone {...stylex.props(styles.icon14)} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const vcard = buildVCard({
                                name: warden.name,
                                title: warden.designation,
                                phones: [
                                  ...(warden.mobiles ?? []),
                                  ...(warden.officePhone ? [warden.officePhone] : []),
                                ],
                                email: warden.email,
                                org: hostel.block,
                                address:
                                  [hostel.campus, hostel.address].filter(Boolean).join(", ") ||
                                  undefined,
                              });
                              downloadVCardFile(`${hostel.block}-${warden.name}`, vcard);
                            }}
                            xstyle={styles.miniButton}
                            aria-label="Save contact"
                          >
                            <Download {...stylex.props(styles.icon14)} />
                          </Button>
                        </div>
                      </div>
                      <div {...stylex.props(styles.details)}>
                        {warden.mobiles?.map((mobile) => (
                          <a
                            key={mobile}
                            href={`tel:${telHref(mobile)}`}
                            {...stylex.props(styles.detailLink)}
                          >
                            {mobile}
                          </a>
                        ))}
                        {warden.officePhone && (
                          <a
                            href={`tel:${telHref(warden.officePhone)}`}
                            {...stylex.props(styles.detailLink)}
                          >
                            Office: {warden.officePhone}
                          </a>
                        )}
                        {warden.email && (
                          <a
                            href={`mailto:${warden.email}`}
                            {...stylex.props(styles.detailLink, styles.detailEmail)}
                          >
                            {warden.email}
                          </a>
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
