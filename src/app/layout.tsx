import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "sonner";
import StoreProvider from "@/components/StoreProvider";


export const metadata: Metadata = {
  title: "DJ FLOWERZ | Premium Mixtapes & Music",
  description: "Premium mixtapes, exclusive music pool, and official merchandise from DJ FLOWERZ. Join the movement.",
  keywords: ["DJ FLOWERZ", "mixtapes", "DJ", "music pool", "Afrobeats", "Amapiano", "Kenya DJ", "DJ edits", "remixes"],
  authors: [{ name: "DJ FLOWERZ" }],
  creator: "DJ FLOWERZ",
  publisher: "DJ FLOWERZ",
  manifest: "/manifest.json",
  themeColor: "#d946ef",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DJ FLOWERZ"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://djflowerz.com",
    siteName: "DJ FLOWERZ",
    title: "DJ FLOWERZ | Premium Mixtapes & Music",
    description: "Premium mixtapes, exclusive music pool, and official merchandise from DJ FLOWERZ. Join the movement.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1571266028243-d220c6a8b0e5?w=1200",
        width: 1200,
        height: 630,
        alt: "DJ FLOWERZ"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "DJ FLOWERZ | Premium Mixtapes & Music",
    description: "Premium mixtapes, exclusive music pool, and official merchandise from DJ FLOWERZ.",
    images: ["https://images.unsplash.com/photo-1571266028243-d220c6a8b0e5?w=1200"],
    creator: "@djflowerz"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              `,
          }}
        />
        <ErrorReporter />
        <StoreProvider>
          <Providers>
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
            <Footer />
            <Toaster position="bottom-right" theme="dark" />
          </Providers>
        </StoreProvider>
      </body>
    </html>
  );
}