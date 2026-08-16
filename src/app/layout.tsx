import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Instrument_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { PwaInstallLoader } from "@/components/pwa-install-loader";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
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
  icons: {
    apple: "/icons/apple-touch-icon.png",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script defer src="https://stat.sys256.com/script.js" strategy="lazyOnload" />
      </head>
      <body
        className={`${instrumentSerif.variable} ${instrumentSans.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteHeader />
          {children}
          <PwaInstallLoader />
          <footer className="py-8 text-center text-muted-foreground text-sm">
            <p>
              Found something wrong or missing? Help improve this directory by contributing at{" "}
              <a
                href="https://github.com/aaditagrawal/campus-dir"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors underline decoration-1 underline-offset-2"
              >
                GitHub
              </a>
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
