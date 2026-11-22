import type { Metadata } from "next";
import { SearchScreen } from "./search-screen";

export const metadata: Metadata = {
  title: "Search | MIT Manipal Campus Directory",
  description: "Search restaurants, hostels, wardens, travel, and emergency contacts.",
};

export default function SearchPage() {
  return <SearchScreen />;
}
