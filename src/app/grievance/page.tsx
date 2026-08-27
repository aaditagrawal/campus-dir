import * as stylex from "@stylexjs/stylex";
import data from "@/data/grievance.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildVCard } from "@/lib/vcard";
import { slugify } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { DownloadVCardButton } from "@/components/contact-actions";
import { colors, radii } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

type Contact = {
  name?: string;
  role?: string;
  email: string;
  emails?: string[];
  phones?: string[];
  notes?: string;
};
type GrievanceCategory = { title: string; description: string; contacts: Contact[] };
type GrievanceData = {
  categories: GrievanceCategory[];
  studentCouncil: { name: string; description: string; contacts: Contact[] };
};

function telHref(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}
function contactEmails(contact: Contact): string[] {
  return [...new Set([contact.email, ...(contact.emails ?? [])].filter(Boolean))];
}
function contactLabel(contact: Contact): string {
  return contact.name || contact.role || contact.email;
}

const styles = stylex.create({
  details: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    paddingInline: "0.75rem",
    paddingBlock: "0.625rem",
  },
  divided: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `color-mix(in oklab, ${colors.border} 60%, transparent)`,
  },
  min: { minWidth: 0 },
  contactName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 500,
  },
  contactRole: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  links: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  contactLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    fontSize: "0.75rem",
    lineHeight: "1rem",
    textUnderlineOffset: "2px",
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
  truncate: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  icon14: { width: "0.875rem", height: "0.875rem", flexShrink: 0 },
  notes: { color: colors.mutedForeground, fontSize: "0.75rem", lineHeight: "1rem" },
  only: { fontSize: "0.75rem", lineHeight: "1rem" },
  card: { height: "100%", gap: "1rem" },
  header: { paddingBottom: 0 },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  cardTitle: { fontSize: "1.125rem", lineHeight: 1.375 },
  description: { color: colors.mutedForeground, fontSize: "0.875rem", lineHeight: "1.25rem" },
  content: { display: "flex", flex: 1, flexDirection: "column", gap: "0.75rem" },
  contactList: {
    overflow: "hidden",
    borderRadius: radii.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `color-mix(in oklab, ${colors.border} 60%, transparent)`,
  },
  actions: { display: "flex", gap: "0.5rem", marginTop: "auto" },
  councilLink: {
    display: "inline-flex",
    minWidth: 0,
    alignItems: "center",
    gap: "0.375rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    textDecorationLine: "underline",
  },
  shrink: { flexShrink: 0 },
});

function ContactDetails({ contact, divided }: { contact: Contact; divided: boolean }) {
  const emails = contactEmails(contact);
  const phones = contact.phones ?? [];
  return (
    <div {...stylex.props(styles.details, divided && styles.divided)}>
      <div {...stylex.props(styles.min)}>
        <div {...stylex.props(styles.contactName)}>{contactLabel(contact)}</div>
        {contact.name && contact.role && (
          <div {...stylex.props(styles.contactRole)}>{contact.role}</div>
        )}
      </div>
      <div {...stylex.props(styles.links)}>
        {emails.map((email) => (
          <a
            key={email}
            href={`mailto:${email}`}
            {...stylex.props(styles.contactLink, styles.truncate)}
          >
            <Mail {...stylex.props(styles.icon14)} />
            {email}
          </a>
        ))}
        {phones.map((phone) => (
          <a key={phone} href={`tel:${telHref(phone)}`} {...stylex.props(styles.contactLink)}>
            <Phone {...stylex.props(styles.icon14)} />
            {phone}
          </a>
        ))}
      </div>
      {contact.notes && <p {...stylex.props(styles.notes)}>{contact.notes}</p>}
    </div>
  );
}

export default function GrievancePage() {
  const { categories, studentCouncil }: GrievanceData = data;
  return (
    <main {...stylex.props(shared.page)}>
      <div {...stylex.props(shared.pageHeader)}>
        <h1 {...stylex.props(shared.heading1, shared.heading1Strong)}>Grievance Redressal</h1>
        <p {...stylex.props(shared.mutedText)}>
          Got a complaint? Reach out to the right authority. CC the Student Council in all your
          emails.
          <br />
          <span {...stylex.props(styles.only)}>This information is for MIT Manipal only.</span>
        </p>
      </div>

      <section
        {...stylex.props(shared.section, shared.sectionBottom)}
        id={slugify("Grievance Categories")}
      >
        <h2 {...stylex.props(shared.heading2, shared.heading2Strong)}>Who to Contact</h2>
        <div {...stylex.props(shared.grid2, shared.stretch)}>
          {categories.map((category) => (
            <Card
              key={category.title}
              id={slugify(category.title)}
              xstyle={[shared.glass, shared.cardHover, shared.scrollTarget, styles.card]}
            >
              <CardHeader xstyle={styles.header}>
                <div {...stylex.props(styles.row)}>
                  <CardTitle xstyle={styles.cardTitle}>{category.title}</CardTitle>
                  <FavoriteButton
                    item={{
                      id: `grievance-${slugify(category.title)}`,
                      type: "grievance",
                      name: category.title,
                      href: `/grievance#${slugify(category.title)}`,
                      subtitle: category.contacts
                        .map((contact) => contact.name || contact.role)
                        .join(", "),
                    }}
                    size="sm"
                  />
                </div>
                <p {...stylex.props(styles.description)}>{category.description}</p>
              </CardHeader>
              <CardContent xstyle={styles.content}>
                <div {...stylex.props(styles.contactList)}>
                  {category.contacts.map((contact, index) => (
                    <ContactDetails
                      key={`${contactLabel(contact)}-${contact.email}`}
                      contact={contact}
                      divided={index > 0}
                    />
                  ))}
                </div>
                <div {...stylex.props(styles.actions)}>
                  <DownloadVCardButton
                    size="sm"
                    filename={category.title}
                    vcard={category.contacts
                      .map((contact) =>
                        buildVCard({
                          name: contactLabel(contact) || category.title,
                          emails: contactEmails(contact),
                          phones: contact.phones,
                          org: "MIT Manipal",
                          title: contact.role,
                        }),
                      )
                      .join("\n")}
                  >
                    Download contact{category.contacts.length > 1 ? "s" : ""}
                  </DownloadVCardButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section {...stylex.props(shared.section)} id={slugify("Student Council")}>
        <h2 {...stylex.props(shared.heading2, shared.heading2Strong)}>Student Council</h2>
        <div {...stylex.props(shared.grid2, shared.stretch)}>
          {studentCouncil.contacts.map((contact) => (
            <Card
              key={contact.email}
              id={slugify(contact.role || contact.email)}
              xstyle={[shared.glass, shared.cardHover, shared.scrollTarget, styles.card]}
            >
              <CardHeader xstyle={styles.header}>
                <div {...stylex.props(styles.row)}>
                  <CardTitle xstyle={styles.cardTitle}>{contact.role || contact.name}</CardTitle>
                  <FavoriteButton
                    item={{
                      id: `grievance-sc-${slugify(contact.email)}`,
                      type: "grievance",
                      name: contact.role || contact.name || "Student Council",
                      href: `/grievance#${slugify(contact.role || contact.email)}`,
                    }}
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent xstyle={styles.content}>
                <a href={`mailto:${contact.email}`} {...stylex.props(styles.councilLink)}>
                  <Mail {...stylex.props(styles.icon14)} />
                  {contact.email}
                </a>
                <div {...stylex.props(styles.actions)}>
                  <DownloadVCardButton
                    size="sm"
                    xstyle={styles.shrink}
                    filename={contact.role || contact.name || "Student Council"}
                    vcard={buildVCard({
                      name: contact.role || contact.name || "Student Council",
                      email: contact.email,
                      org: "MIT Student Council",
                    })}
                  >
                    Download contact
                  </DownloadVCardButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
