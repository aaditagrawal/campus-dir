import academics from "@/data/academics.json";
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
      {academics.map((section) => (
        <div
          key={section.section}
          {...stylex.props(shared.sectionCompact)}
          id={slugify(section.section)}
        >
          <h2 {...stylex.props(shared.heading2)}>{section.section}</h2>
          <div {...stylex.props(shared.columns2)}>
            {section.items.map((item) => (
              <AcademicCard key={item.name} title={item.name} url={item.url}>
                {"credentials" in item && item.credentials && (
                  <>
                    <span {...stylex.props(styles.credential)}>
                      User ID: <span {...stylex.props(styles.mono)}>{item.credentials.userId}</span>
                    </span>
                    <br />
                    <span {...stylex.props(styles.credential)}>
                      Password:{" "}
                      <span {...stylex.props(styles.mono)}>{item.credentials.password}</span>
                    </span>
                    <br />
                  </>
                )}
                {item.description}
                {"altUrl" in item && item.altUrl && (
                  <>
                    <br />
                    <span {...stylex.props(styles.alternate)}>
                      Alt:{" "}
                      <a
                        href={item.altUrl}
                        target="_blank"
                        rel="noreferrer"
                        {...stylex.props(styles.alternateLink)}
                      >
                        {item.altUrl}
                      </a>
                    </span>
                  </>
                )}
              </AcademicCard>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
