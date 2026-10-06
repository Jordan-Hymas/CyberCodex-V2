import type { Metadata } from "next";
import { Atkinson_Hyperlegible, JetBrains_Mono, Pixelify_Sans, Silkscreen } from "next/font/google";
import localFont from "next/font/local";
import { NavigationWrapper } from "@/components/layout/NavigationWrapper";
import { Footer } from "@/components/layout";
import { SmoothScrollProvider, SessionProvider } from "@/components/providers";
import "@/styles/globals.css";

// Body copy: highly legible, with more character than the usual Inter default
const bodyFont = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});

// UI labels, buttons, small headings: pixel-flavoured but readable
const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-pixelify",
  display: "swap",
});

// Tiny all-caps labels and badges: built for small sizes
const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-silkscreen",
  display: "swap",
});

const codeFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

const pressStart2P = localFont({
  src: "../../public/fonts/Press_Start_2P/PressStart2P-Regular.ttf",
  variable: "--font-press-start",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CyberCodex.io - Master Cybersecurity & Ethical Hacking",
  description: "A comprehensive cybersecurity learning platform with tutorials, interactive labs, and educational resources for ethical hacking and penetration testing.",
  keywords: ["cybersecurity", "ethical hacking", "penetration testing", "security", "tutorials", "labs"],
  authors: [{ name: "CyberCodex" }],
  openGraph: {
    title: "CyberCodex.io - Master Cybersecurity & Ethical Hacking",
    description: "Learn cybersecurity through interactive tutorials and hands-on labs",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberCodex.io",
    description: "Master Cybersecurity & Ethical Hacking",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1f2246",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${pixelify.variable} ${codeFont.variable} ${silkscreen.variable} ${pressStart2P.variable}`}>
      <body className="antialiased">
        <SessionProvider>
          <SmoothScrollProvider>
            <NavigationWrapper />
            {children}
            <Footer />
          </SmoothScrollProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
