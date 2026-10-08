import type { Metadata } from "next";
import * as stylex from "@stylexjs/stylex";
import campusLife from "@/data/campus-life.json";
import { ResourceSections } from "@/components/resource-sections";
import { shared } from "@/styles/shared";

export const metadata: Metadata = {
  title: "Campus Life | MIT Manipal Directory",
  description:
    "Book counselling, find routine medical care, contact peer support, or reach the hostel office and student welfare committees.",
};

export default function CampusLifePage() {
  return (
    <main {...stylex.props(shared.page, shared.pageGrid)}>
      <div>
        <h1 {...stylex.props(shared.heading1)}>Campus Life</h1>
        <p {...stylex.props(shared.mutedText)}>
          Appointments, peer support, and campus service contacts.
        </p>
      </div>
      <ResourceSections sections={campusLife} type="campus-life" />
    </main>
  );
}
