type PathNode = { tag: "path"; d: string };
type CircleNode = { tag: "circle"; cx: string; cy: string; r: string };
type RectNode = {
  tag: "rect";
  x: string;
  y: string;
  width: string;
  height: string;
  rx?: string;
  ry?: string;
};
type IconNode = PathNode | CircleNode | RectNode;

export type IconName =
  | "search"
  | "sun"
  | "moon"
  | "menu"
  | "x"
  | "utensils"
  | "building2"
  | "bus"
  | "shieldAlert"
  | "wrench"
  | "graduationCap"
  | "settings"
  | "star"
  | "messageSquareWarning"
  | "chevronDown"
  | "users"
  | "siren"
  | "mail"
  | "building"
  | "car"
  | "chevronRight"
  | "shuffle"
  | "phone"
  | "download"
  | "share"
  | "squarePlus"
  | "externalLink"
  | "trash2"
  | "check"
  | "copy"
  | "arrowUpDown"
  | "arrowUp"
  | "arrowDown"
  | "clock";

const ICONS = {
  search: [
    { tag: "path", d: "m21 21-4.34-4.34" },
    { tag: "circle", cx: "11", cy: "11", r: "8" },
  ],
  sun: [
    { tag: "circle", cx: "12", cy: "12", r: "4" },
    { tag: "path", d: "M12 2v2" },
    { tag: "path", d: "M12 20v2" },
    { tag: "path", d: "m4.93 4.93 1.41 1.41" },
    { tag: "path", d: "m17.66 17.66 1.41 1.41" },
    { tag: "path", d: "M2 12h2" },
    { tag: "path", d: "M20 12h2" },
    { tag: "path", d: "m6.34 17.66-1.41 1.41" },
    { tag: "path", d: "m19.07 4.93-1.41 1.41" },
  ],
  moon: [
    {
      tag: "path",
      d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
    },
  ],
  menu: [
    { tag: "path", d: "M4 5h16" },
    { tag: "path", d: "M4 12h16" },
    { tag: "path", d: "M4 19h16" },
  ],
  x: [
    { tag: "path", d: "M18 6 6 18" },
    { tag: "path", d: "m6 6 12 12" },
  ],
  utensils: [
    { tag: "path", d: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" },
    { tag: "path", d: "M7 2v20" },
    { tag: "path", d: "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" },
  ],
  building2: [
    { tag: "path", d: "M10 12h4" },
    { tag: "path", d: "M10 8h4" },
    { tag: "path", d: "M14 21v-3a2 2 0 0 0-4 0v3" },
    { tag: "path", d: "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" },
    { tag: "path", d: "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" },
  ],
  bus: [
    { tag: "path", d: "M8 6v6" },
    { tag: "path", d: "M15 6v6" },
    { tag: "path", d: "M2 12h19.6" },
    {
      tag: "path",
      d: "M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3",
    },
    { tag: "circle", cx: "7", cy: "18", r: "2" },
    { tag: "path", d: "M9 18h5" },
    { tag: "circle", cx: "16", cy: "18", r: "2" },
  ],
  shieldAlert: [
    {
      tag: "path",
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    },
    { tag: "path", d: "M12 8v4" },
    { tag: "path", d: "M12 16h.01" },
  ],
  wrench: [
    {
      tag: "path",
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",
    },
  ],
  graduationCap: [
    {
      tag: "path",
      d: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
    },
    { tag: "path", d: "M22 10v6" },
    { tag: "path", d: "M6 12.5V16a6 3 0 0 0 12 0v-3.5" },
  ],
  settings: [
    {
      tag: "path",
      d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
    },
    { tag: "circle", cx: "12", cy: "12", r: "3" },
  ],
  star: [
    {
      tag: "path",
      d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
    },
  ],
  messageSquareWarning: [
    {
      tag: "path",
      d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
    },
    { tag: "path", d: "M12 15h.01" },
    { tag: "path", d: "M12 7v4" },
  ],
  chevronDown: [{ tag: "path", d: "m6 9 6 6 6-6" }],
  users: [
    { tag: "path", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
    { tag: "path", d: "M16 3.128a4 4 0 0 1 0 7.744" },
    { tag: "path", d: "M22 21v-2a4 4 0 0 0-3-3.87" },
    { tag: "circle", cx: "9", cy: "7", r: "4" },
  ],
  siren: [
    { tag: "path", d: "M7 18v-6a5 5 0 1 1 10 0v6" },
    { tag: "path", d: "M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" },
    { tag: "path", d: "M21 12h1" },
    { tag: "path", d: "M18.5 4.5 18 5" },
    { tag: "path", d: "M2 12h1" },
    { tag: "path", d: "M12 2v1" },
    { tag: "path", d: "m4.929 4.929.707.707" },
    { tag: "path", d: "M12 12v6" },
  ],
  mail: [
    { tag: "path", d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" },
    { tag: "rect", x: "2", y: "4", width: "20", height: "16", rx: "2" },
  ],
  building: [
    { tag: "path", d: "M12 10h.01" },
    { tag: "path", d: "M12 14h.01" },
    { tag: "path", d: "M12 6h.01" },
    { tag: "path", d: "M16 10h.01" },
    { tag: "path", d: "M16 14h.01" },
    { tag: "path", d: "M16 6h.01" },
    { tag: "path", d: "M8 10h.01" },
    { tag: "path", d: "M8 14h.01" },
    { tag: "path", d: "M8 6h.01" },
    { tag: "path", d: "M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" },
    { tag: "rect", x: "4", y: "2", width: "16", height: "20", rx: "2" },
  ],
  car: [
    {
      tag: "path",
      d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
    },
    { tag: "circle", cx: "7", cy: "17", r: "2" },
    { tag: "path", d: "M9 17h6" },
    { tag: "circle", cx: "17", cy: "17", r: "2" },
  ],
  chevronRight: [{ tag: "path", d: "m9 18 6-6-6-6" }],
  shuffle: [
    { tag: "path", d: "m18 14 4 4-4 4" },
    { tag: "path", d: "m18 2 4 4-4 4" },
    { tag: "path", d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" },
    { tag: "path", d: "M2 6h1.972a4 4 0 0 1 3.6 2.2" },
    { tag: "path", d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" },
  ],
  phone: [
    {
      tag: "path",
      d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
    },
  ],
  download: [
    { tag: "path", d: "M12 15V3" },
    { tag: "path", d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" },
    { tag: "path", d: "m7 10 5 5 5-5" },
  ],
  share: [
    { tag: "path", d: "M12 2v13" },
    { tag: "path", d: "m16 6-4-4-4 4" },
    { tag: "path", d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" },
  ],
  squarePlus: [
    { tag: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
    { tag: "path", d: "M8 12h8" },
    { tag: "path", d: "M12 8v8" },
  ],
  externalLink: [
    { tag: "path", d: "M15 3h6v6" },
    { tag: "path", d: "M10 14 21 3" },
    { tag: "path", d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" },
  ],
  trash2: [
    { tag: "path", d: "M10 11v6" },
    { tag: "path", d: "M14 11v6" },
    { tag: "path", d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" },
    { tag: "path", d: "M3 6h18" },
    { tag: "path", d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" },
  ],
  check: [{ tag: "path", d: "M20 6 9 17l-5-5" }],
  copy: [
    { tag: "rect", width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" },
    { tag: "path", d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" },
  ],
  arrowUpDown: [
    { tag: "path", d: "m21 16-4 4-4-4" },
    { tag: "path", d: "M17 20V4" },
    { tag: "path", d: "m3 8 4-4 4 4" },
    { tag: "path", d: "M7 4v16" },
  ],
  arrowUp: [
    { tag: "path", d: "m5 12 7-7 7 7" },
    { tag: "path", d: "M12 19V5" },
  ],
  arrowDown: [
    { tag: "path", d: "M12 5v14" },
    { tag: "path", d: "m19 12-7 7-7-7" },
  ],
  clock: [
    { tag: "circle", cx: "12", cy: "12", r: "10" },
    { tag: "path", d: "M12 6v6l4 2" },
  ],
} satisfies { readonly [name in IconName]: readonly IconNode[] };

function nodeKey(node: IconNode): string {
  if (node.tag === "path") return node.d;
  if (node.tag === "circle") return `${node.cx}-${node.cy}-${node.r}`;
  return `${node.x}-${node.y}-${node.width}-${node.height}`;
}

function IconMark({ node }: { node: IconNode }) {
  if (node.tag === "path") return <path d={node.d} />;
  if (node.tag === "circle") return <circle cx={node.cx} cy={node.cy} r={node.r} />;
  return (
    <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={node.rx} ry={node.ry} />
  );
}

export function Icon({ name, ...props }: { name: IconName } & React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {ICONS[name].map((node) => (
        <IconMark key={nodeKey(node)} node={node} />
      ))}
    </svg>
  );
}
