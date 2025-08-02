import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { PriceaiProvider } from "@/context/PriceaiContext";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Price AI",
  description: "Platform for patients to search and compare insurance plan prices for specific hospitals, with AI-powered fast search and suggestions.",
  keywords: ["insurance", "hospital", "AI", "price comparison", "healthcare", "geological", "location-based", "regional", "area-specific"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://apis.google.com/js/platform.js" async defer></script>
      </head>
      <body
        className={`${poppins.variable} ${inter.variable} antialiased relative min-h-screen`}
      >
        <ToastProvider>
          <TooltipProvider>
            <LocationProvider>
              <PriceaiProvider>
                  <AuthProvider>
                    {children}
                  </AuthProvider>
              </PriceaiProvider>
            </LocationProvider>
          </TooltipProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
