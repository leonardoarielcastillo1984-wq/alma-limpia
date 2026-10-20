import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { SwRegister } from "@/components/pwa/SwRegister";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Jost({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ALMA LIMPIA — Un espacio para conectar con tu esencia",
  description:
    "Plataforma de espiritualidad: tarot, astrología, numerología, rituales y guía conversacional. Tu universo interior, en tu bolsillo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alma Limpia",
  },
};

export const viewport: Viewport = {
  themeColor: "#080914",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
