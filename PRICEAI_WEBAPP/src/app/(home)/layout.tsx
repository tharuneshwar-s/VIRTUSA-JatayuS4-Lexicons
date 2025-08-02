import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";

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
        <>
            <div className="bg-gradient-to-tr from-priceai-blue rounded-br-[3%] rounded-bl-[3%] to-priceai-lightgreen -top-0 w-full h-[67vh] absolute z-[-1] left-0"></div>

            <Header />
            <main
                className={`${poppins.variable} ${inter.variable} antialiased min-h-screen`}
            >
                {children}
            </main>
        </>
    );
}
