import "./globals.css";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import { ReactQueryProvider } from "@/shared/lib/ReactQueryProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleSans = localFont({
  src: [
    {
      path: "../../public/fonts/GoogleSans-VariableFont_GRAD,opsz,wght.ttf",
      style: "normal",
    },
    {
      path: "../../public/fonts/GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-google-sans",
});

export const metadata = {
  title: "AI Influencer Studio",
  description: "Non-linear node-based character branching studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${googleSans.variable} ${geistMono.variable} antialiased bg-background text-white font-sans`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          {children}
          <SpeedInsights />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
