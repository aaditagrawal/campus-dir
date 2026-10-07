import academics from "@/data/academics.json";
import * as stylex from "@stylexjs/stylex";
import { ResourceSections } from "@/components/resource-sections";
import { shared } from "@/styles/shared";

export default function AcademicsPage() {
  return (
    <main {...stylex.props(shared.page, shared.pageGrid)}>
      <div>
        <h1 {...stylex.props(shared.heading1)}>Academics</h1>
        <p {...stylex.props(shared.mutedText)}>
          Academic systems, library access, scholarships, and study abroad.
        </p>
      </div>
      <ResourceSections sections={academics} type="academic" />
    </main>
  );
}
