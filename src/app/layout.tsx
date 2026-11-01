import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Instrument_Sans } from "next/font/google";
import * as stylex from "@stylexjs/stylex";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { PwaBanner } from "@/components/pwa-banner";
import { DOCUMENT_BOOT_SCRIPT } from "@/lib/document-boot";
import { colors, fonts, motion } from "@/styles/constants.stylex";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  applicationName: "Campus Directory",
  title: "MIT Manipal Campus Directory",
  description:
    "A glassy, organized directory for restaurants, hostels, travel, and emergency services at MIT Manipal.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Campus Directory",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const styles = stylex.create({
  body: {
    minHeight: "100vh",
    backgroundColor: colors.background,
    backgroundImage: `radial-gradient(64rem 32rem at 50% -8rem, color-mix(in oklab, ${colors.primary} 5%, transparent), transparent)`,
    backgroundRepeat: "no-repeat",
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: "1rem",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
  footer: {
    paddingBlock: "2rem",
    color: colors.mutedForeground,
    textAlign: "center",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  footerLink: {
    color: { default: colors.foreground, ":hover": colors.primary },
    textDecorationLine: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "2px",
    transitionProperty: "color",
    transitionDuration: motion.fast,
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${instrumentSans.variable}`}
    >
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: DOCUMENT_BOOT_SCRIPT }} />
      </head>
      <body {...stylex.props(styles.body)}>
        <SiteHeader />
        {children}
        <PwaBanner />
        <footer {...stylex.props(styles.footer)}>
          <p>
            Found something wrong or missing? Help improve this directory by contributing at{" "}
            <a
              href="https://github.com/aaditagrawal/campus-dir"
              target="_blank"
              rel="noopener noreferrer"
              {...stylex.props(styles.footerLink)}
            >
              GitHub
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
