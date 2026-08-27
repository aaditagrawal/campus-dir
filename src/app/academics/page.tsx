import { ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorite-button";
import { colors, fonts } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

const styles = stylex.create({
  card: { position: "relative", scrollMarginTop: "6rem" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  cardLink: { position: "absolute", inset: 0, zIndex: 0 },
  content: {
    position: "relative",
    zIndex: 10,
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  url: {
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
    overflowWrap: "anywhere",
  },
  credential: { fontSize: "0.75rem", lineHeight: "1rem" },
  mono: { fontFamily: fonts.mono },
  alternate: { position: "relative", zIndex: 20, fontSize: "0.75rem", lineHeight: "1rem" },
  alternateLink: {
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    textDecorationLine: "underline",
  },
});

function AcademicCard({
  title,
  url,
  children,
}: {
  title: string;
  url: string;
  children: ReactNode;
}) {
  return (
    <Card
      xstyle={[shared.glass, shared.cardHover, shared.breakInsideAvoid, styles.card]}
      id={slugify(title)}
    >
      <CardHeader>
        <div {...stylex.props(styles.row)}>
          <CardTitle>{title}</CardTitle>
          <FavoriteButton
            item={{
              id: `academic-${slugify(title)}`,
              type: "academic",
              name: title,
              href: url,
              subtitle: "Academic Resource",
            }}
            size="sm"
          />
        </div>
      </CardHeader>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        {...stylex.props(styles.cardLink)}
        aria-label={`Open ${title}`}
      />
      <CardContent xstyle={styles.content}>
        {children}
        <br />
        <span {...stylex.props(styles.url)}>{url}</span>
      </CardContent>
    </Card>
  );
}

export default function AcademicsPage() {
  return (
    <main {...stylex.props(shared.page, shared.pageGrid)}>
      <div>
        <h1 {...stylex.props(shared.heading1)}>Academics</h1>
        <p {...stylex.props(shared.mutedText)}>Quick links to academic systems and resources.</p>
      </div>

      <div {...stylex.props(shared.sectionCompact)} id={slugify("Student Lifecycle Management")}>
        <h2 {...stylex.props(shared.heading2)}>Student Lifecycle Management</h2>
        <div {...stylex.props(shared.columns2)}>
          <AcademicCard title="SLCM 2.0" url="https://maheslcmtech.manipal.edu">
            New SLCM portal
          </AcademicCard>
          <AcademicCard title="SLCM (Classic)" url="https://slcm.manipal.edu">
            Legacy SLCM portal
          </AcademicCard>
        </div>
      </div>

      <div {...stylex.props(shared.sectionCompact)} id={slugify("Library")}>
        <h2 {...stylex.props(shared.heading2)}>Library</h2>
        <div {...stylex.props(shared.columns2)}>
          <AcademicCard
            title="Previous Years' Questions Archive"
            url="https://library-orpin-two.vercel.app"
          >
            Browse past question papers
          </AcademicCard>
          <AcademicCard
            title="Manipal OSF"
            url="https://learnermanipal.sharepoint.com/sites/ManipalOSF"
          >
            Student led initiative to compile and share past question papers
          </AcademicCard>
          <AcademicCard title="EBSCO search" url="https://research.ebsco.com/c/fqdtcf/search">
            <span {...stylex.props(styles.credential)}>
              User ID: <span {...stylex.props(styles.mono)}>ebscopreviewmity</span>
            </span>
            <br />
            <span {...stylex.props(styles.credential)}>
              Password: <span {...stylex.props(styles.mono)}>UIPreview2021!</span>
            </span>
            <br />
            Search academic databases
          </AcademicCard>
          <AcademicCard title="Library Portal" url="https://libportal.manipal.edu/MIT/MIT.aspx">
            MIT Library portal
          </AcademicCard>
        </div>
      </div>

      <div {...stylex.props(shared.sectionCompact)} id={slugify("Academic Resources")}>
        <h2 {...stylex.props(shared.heading2)}>Academic Resources</h2>
        <div {...stylex.props(shared.columns2)}>
          <AcademicCard title="Lighthouse" url="https://lighthouse.manipal.edu">
            Semester-wise resources and quiz platform
          </AcademicCard>
          <AcademicCard
            title="Pulse (Android)"
            url="https://play.google.com/store/apps/details?id=com.d2l.brightspace.student.android"
          >
            Brightspace Pulse app for Lighthouse
          </AcademicCard>
          <AcademicCard
            title="Pulse (iOS)"
            url="https://apps.apple.com/us/app/brightspace-pulse/id1001688546"
          >
            Brightspace Pulse app for Lighthouse
          </AcademicCard>
          <AcademicCard title="Impartus" url="https://impartus.manipal.edu">
            Class recordings platform
            <br />
            <span {...stylex.props(styles.alternate)}>
              Alt:{" "}
              <a
                href="https://a.impartus.com"
                target="_blank"
                rel="noreferrer"
                {...stylex.props(styles.alternateLink)}
              >
                a.impartus.com
              </a>
            </span>
          </AcademicCard>
        </div>
      </div>

      <div {...stylex.props(shared.sectionCompact)} id={slugify("Research")}>
        <h2 {...stylex.props(shared.heading2)}>Research</h2>
        <div {...stylex.props(shared.columns2)}>
          <AcademicCard title="Manipal PURE" url="https://researcher.manipal.edu">
            Researchers directory
          </AcademicCard>
        </div>
      </div>

      <div {...stylex.props(shared.sectionCompact)} id={slugify("Microsoft 365")}>
        <h2 {...stylex.props(shared.heading2)}>Microsoft 365</h2>
        <div {...stylex.props(shared.columns2)}>
          <AcademicCard title="Outlook" url="https://outlook.office365.com/mail/">
            Web mail
          </AcademicCard>
          <AcademicCard title="Office 365" url="https://m365.cloud.microsoft/apps/">
            Microsoft 365 apps
          </AcademicCard>
        </div>
      </div>
    </main>
  );
}
