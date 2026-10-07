import * as stylex from "@stylexjs/stylex";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import type { ResourceSection } from "@/lib/resources";
import { slugify } from "@/lib/utils";
import { colors } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  title: { fontSize: "1.125rem", lineHeight: "1.5rem", fontWeight: 600 },
  link: {
    color: { default: colors.foreground, ":hover": colors.primary },
    textDecorationLine: "underline",
    textUnderlineOffset: "0.2em",
    overflowWrap: "anywhere",
  },
  content: {
    display: "grid",
    gap: "0.75rem",
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.5rem",
  },
  steps: { listStyleType: "decimal", paddingInlineStart: "1.25rem", margin: 0 },
  url: { fontSize: "0.75rem", lineHeight: "1rem", overflowWrap: "anywhere" },
  metadata: {
    display: "grid",
    gap: "0.25rem",
    fontSize: "0.75rem",
    lineHeight: "1.25rem",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    paddingTop: "0.75rem",
  },
});

export function ResourceSections({
  sections,
  type,
}: {
  sections: readonly ResourceSection[];
  type: "academic" | "campus-life";
}) {
  const route = type === "academic" ? "/academics" : "/campus-life";
  return sections.map((section) => (
    <section
      key={section.section}
      id={slugify(section.section)}
      {...stylex.props(shared.sectionCompact)}
    >
      <h2 {...stylex.props(shared.heading2)}>{section.section}</h2>
      <div {...stylex.props(shared.columns2)}>
        {section.items.map((item) => (
          <Card
            key={item.name}
            id={slugify(item.name)}
            xstyle={[shared.glass, shared.cardHover, shared.breakInsideAvoid, shared.scrollTarget]}
          >
            <CardHeader>
              <div {...stylex.props(styles.row)}>
                <h3 {...stylex.props(styles.title)}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    {...stylex.props(styles.link)}
                  >
                    {item.name}
                  </a>
                </h3>
                <FavoriteButton
                  item={{
                    id: `${type}-${slugify(item.name)}`,
                    type,
                    name: item.name,
                    href: `${route}#${slugify(item.name)}`,
                    subtitle: section.section,
                  }}
                  size="sm"
                />
              </div>
            </CardHeader>
            <CardContent xstyle={styles.content}>
              <p>{item.description}</p>
              {item.steps && (
                <ol {...stylex.props(styles.steps)}>
                  {item.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
              {item.appliesTo && <p>{item.appliesTo}</p>}
              {item.altUrl && (
                <a
                  href={item.altUrl}
                  target="_blank"
                  rel="noreferrer"
                  {...stylex.props(styles.link, styles.url)}
                >
                  Alternate: {item.altUrl}
                </a>
              )}
              <span {...stylex.props(styles.url)}>{item.url}</span>
              {item.source && (
                <div {...stylex.props(styles.metadata)}>
                  <a
                    href={item.source}
                    target="_blank"
                    rel="noreferrer"
                    {...stylex.props(styles.link)}
                  >
                    Official source for {item.name}
                  </a>
                  {item.campus && <span>{item.campus}</span>}
                  {item.checkedOn && (
                    <span>
                      Source checked <time dateTime={item.checkedOn}>{item.checkedOn}</time>
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  ));
}
