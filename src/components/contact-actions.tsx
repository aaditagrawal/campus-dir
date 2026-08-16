"use client";

import { Button } from "@/components/ui/button";
import { downloadVCardFile } from "@/lib/vcard";

type DownloadVCardButtonProps = React.ComponentProps<typeof Button> & {
  vcard: string;
  filename: string;
};

export function DownloadVCardButton({ vcard, filename, children, ...props }: DownloadVCardButtonProps) {
  return (
    <Button {...props} onClick={() => downloadVCardFile(filename, vcard)}>
      {children}
    </Button>
  );
}

type RandomTelButtonProps = React.ComponentProps<"button"> & {
  // One phone list per listing: a random listing is picked, then a random phone.
  options: string[][];
};

export function RandomTelButton({ options, children, ...props }: RandomTelButtonProps) {
  const handleClick = () => {
    const pools = options.filter((phones) => phones.length > 0);
    if (pools.length === 0) return;
    const phones = pools[Math.floor(Math.random() * pools.length)];
    const phone = phones[Math.floor(Math.random() * phones.length)];
    window.location.href = `tel:${phone.replace(/\s+/g, "")}`;
  };
  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
