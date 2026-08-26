import * as stylex from "@stylexjs/stylex";
import data from "@/data/tools.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorite-button";
import { colors } from "@/styles/constants.stylex";
import { shared } from "@/styles/shared";

type Tool = { name: string; url: string; description: string };
type ToolsData = { web_resources: Tool[]; internal_tools?: Tool[] };

const styles = stylex.create({
  card: { position: "relative" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
  overlay: { position: "absolute", inset: 0, zIndex: 1 },
  content: {
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  favorite: { position: "relative", zIndex: 2 },
  url: {
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
    overflowWrap: "anywhere",
  },
});

function ToolCard({ tool, internal = false }: { tool: Tool; internal?: boolean }) {
  return (
    <Card xstyle={[shared.glass, shared.cardHover, styles.card]}>
      <CardHeader>
        <div {...stylex.props(styles.row)}>
          <CardTitle>{tool.name}</CardTitle>
          <FavoriteButton
            item={{
              id: `tool-${internal ? "internal" : "web"}-${slugify(tool.name)}`,
              type: "tool",
              name: tool.name,
              href: tool.url,
              subtitle: tool.description,
            }}
            size="sm"
            xstyle={styles.favorite}
          />
        </div>
      </CardHeader>
      <a
        href={tool.url}
        target={internal ? undefined : "_blank"}
        rel={internal ? undefined : "noreferrer"}
        {...stylex.props(styles.overlay)}
        aria-label={`Open ${tool.name}`}
      />
      <CardContent xstyle={styles.content}>
        {tool.description}
        {!internal && (
          <>
            <br />
            <span {...stylex.props(styles.url)}>{tool.url}</span>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ToolsPage() {
  const tools: ToolsData = data;
  return (
    <main {...stylex.props(shared.page, shared.pageGrid)}>
      <div>
        <h1 {...stylex.props(shared.heading1)}>Tools</h1>
        <p {...stylex.props(shared.mutedText)}>
          Useful web resources and tools for MIT Manipal students.
        </p>
      </div>

      <div {...stylex.props(shared.sectionCompact)} id={slugify("Web Resources")}>
        <h2 {...stylex.props(shared.heading2)}>Web Resources</h2>
        <div {...stylex.props(shared.grid2)}>
          {tools.web_resources.map((tool) => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      </div>

      {tools.internal_tools && tools.internal_tools.length > 0 && (
        <div {...stylex.props(shared.sectionCompact)} id={slugify("Internal Tools")}>
          <h2 {...stylex.props(shared.heading2)}>Internal Tools</h2>
          <div {...stylex.props(shared.grid2)}>
            {tools.internal_tools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} internal />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
