export type Resource = {
  name: string;
  description: string;
  url: string;
  altUrl?: string;
  source?: string;
  checkedOn?: string;
  campus?: string;
  appliesTo?: string;
  steps?: string[];
  keywords?: string[];
};

export type ResourceSection = {
  section: string;
  items: Resource[];
};
