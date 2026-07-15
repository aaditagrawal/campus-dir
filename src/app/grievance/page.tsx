"use client";

import data from "@/data/grievance.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildVCard, downloadVCardFile } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";

type Contact = {
  name?: string;
  role?: string;
  email: string;
  emails?: string[];
  phones?: string[];
  notes?: string;
};

type GrievanceCategory = {
  title: string;
  description: string;
  contacts: Contact[];
};

type GrievanceData = {
  categories: GrievanceCategory[];
  studentCouncil: {
    name: string;
    description: string;
    contacts: Contact[];
  };
};

function telHref(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

function contactEmails(c: Contact): string[] {
  const out = [c.email, ...(c.emails ?? [])];
  return [...new Set(out.filter(Boolean))];
}

function contactLabel(c: Contact): string {
  return c.name || c.role || c.email;
}

function ContactDetails({ contact }: { contact: Contact }) {
  const emails = contactEmails(contact);
  const phones = contact.phones ?? [];

  return (
    <div className="px-3 py-2.5 space-y-1.5">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{contactLabel(contact)}</div>
        {contact.name && contact.role && (
          <div className="text-xs text-muted-foreground truncate">{contact.role}</div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {emails.map((email) => (
          <a
            key={email}
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2 truncate"
          >
            <Mail className="size-3.5 shrink-0" />
            {email}
          </a>
        ))}
        {phones.map((phone) => (
          <a
            key={phone}
            href={`tel:${telHref(phone)}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
          >
            <Phone className="size-3.5 shrink-0" />
            {phone}
          </a>
        ))}
      </div>
      {contact.notes && <p className="text-xs text-muted-foreground">{contact.notes}</p>}
    </div>
  );
}

export default function GrievancePage() {
  const { categories, studentCouncil } = data as GrievanceData;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Grievance Redressal</h1>
        <p className="text-muted-foreground">
          Got a complaint? Reach out to the right authority. CC the Student Council in all your emails.
          <br />
          <span className="text-xs">This information is for MIT Manipal only.</span>
        </p>
      </div>

      <section className="space-y-4 mb-8" id={slugify("Grievance Categories")}>
        <h2 className="text-xl font-semibold">Who to Contact</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <Card key={cat.title} id={slugify(cat.title)} className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{cat.title}</CardTitle>
                  <FavoriteButton
                    item={{
                      id: `grievance-${slugify(cat.title)}`,
                      type: "grievance",
                      name: cat.title,
                      href: `/grievance#${slugify(cat.title)}`,
                      subtitle: cat.contacts.map((c) => c.name || c.role).join(", "),
                    }}
                    size="sm"
                  />
                </div>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1">
                <div className="rounded-md border border-border/60 divide-y divide-border/60 overflow-hidden">
                  {cat.contacts.map((c) => (
                    <ContactDetails key={`${contactLabel(c)}-${c.email}`} contact={c} />
                  ))}
                </div>
                <div className="flex gap-2 mt-auto">
                  <Button
                    size="sm"
                    onClick={() => {
                      for (const c of cat.contacts) {
                        const emails = contactEmails(c);
                        const v = buildVCard({
                          name: contactLabel(c) || cat.title,
                          email: emails[0],
                          phones: c.phones,
                          org: "MIT Manipal",
                          title: c.role,
                        });
                        downloadVCardFile(contactLabel(c) || cat.title, v);
                      }
                    }}
                  >
                    Download contact{cat.contacts.length > 1 ? "s" : ""}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4" id={slugify("Student Council")}>
        <h2 className="text-xl font-semibold">Student Council</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {studentCouncil.contacts.map((c) => (
            <Card key={c.email} id={slugify(c.role || c.email)} className="glass hover:shadow-md transition-shadow duration-200 scroll-mt-24">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{c.role || c.name}</CardTitle>
                  <FavoriteButton
                    item={{
                      id: `grievance-sc-${slugify(c.email)}`,
                      type: "grievance",
                      name: c.role || c.name || "Student Council",
                      href: `/grievance#${slugify(c.role || c.email)}`,
                    }}
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-sm underline min-w-0 truncate">
                  <Mail className="size-3.5 shrink-0" />
                  {c.email}
                </a>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    const v = buildVCard({
                      name: c.role || c.name || "Student Council",
                      email: c.email,
                      org: "MIT Student Council",
                    });
                    downloadVCardFile(c.role || c.name || "Student Council", v);
                  }}
                >
                  Download contact
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
