import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diffrun Affiliate Portal",
  description: "Real-time analytics and redemption tracking for Diffrun influencers. Monitor your coupon code performance, track sales, and optimize your campaigns.",
  keywords: [
    "influencer portal",
    "coupon tracking",
    "redemption analytics",
    "campaign performance",
    "Diffrun",
    "influencer marketing",
    "sales tracking"
  ].join(", "),
  authors: [{ name: "Diffrun" }],
  creator: "Diffrun",
  publisher: "Diffrun",
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://diffrun.com',
    title: 'Influencer Portal | Diffrun - Track Your Campaign Performance',
    description: 'Real-time analytics and redemption tracking for Diffrun influencers.',
    siteName: 'Diffrun Influencer Portal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Influencer Portal | Diffrun',
    description: 'Real-time analytics and redemption tracking for Diffrun influencers.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}