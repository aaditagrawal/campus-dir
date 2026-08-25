"use client";

import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { Button } from "@/components/ui/button";
import { downloadVCardFile } from "@/lib/vcard";

type DownloadVCardButtonProps = React.ComponentProps<typeof Button> & {
  vcard: string;
  filename: string;
};

export function DownloadVCardButton({
  vcard,
  filename,
  children,
  ...props
}: DownloadVCardButtonProps) {
  return (
    <Button {...props} onClick={() => downloadVCardFile(filename, vcard)}>
      {children}
    </Button>
  );
}

type RandomTelButtonProps = Omit<React.ComponentProps<"button">, "className" | "style"> & {
  // One phone list per listing: a random listing is picked, then a random phone.
  options: string[][];
  xstyle?: StyleXStyles;
};

export function RandomTelButton({ options, children, xstyle, ...props }: RandomTelButtonProps) {
  const handleClick = () => {
    const pools = options.filter((phones) => phones.length > 0);
    if (pools.length === 0) return;
    const phones = pools[Math.floor(Math.random() * pools.length)];
    const phone = phones[Math.floor(Math.random() * phones.length)];
    window.location.href = `tel:${phone.replace(/\s+/g, "")}`;
  };
  return (
    <button type="button" onClick={handleClick} {...stylex.props(xstyle)} {...props}>
      {children}
    </button>
  );
}
