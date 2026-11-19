import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/utils/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "An independent, community-run support forum for Mac, iPhone, iPad, Apple Watch and more. Not affiliated with Apple Inc.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "iDiscussion — Independent Apple device community",
    template: "%s | iDiscussion",
  },
  description: siteDescription,
  applicationName: "iDiscussion",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "iDiscussion — Independent Apple device community",
    description: "Community-driven answers for Apple products. Unofficial and not affiliated with Apple Inc.",
    url: "/",
    siteName: "iDiscussion",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "iDiscussion — Independent Apple device community",
    description: siteDescription,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
