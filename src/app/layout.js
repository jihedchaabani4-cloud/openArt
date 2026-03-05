import "./globals.css";
import { Poppins, Geist_Mono } from "next/font/google";
import { StudioNavbar } from "@/components/studio/StudioNavbar";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Influencer Studio",
  description: "Non-linear node-based character branching studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased bg-[#0F1113] text-white overflow-hidden font-sans flex flex-col h-screen`}
        suppressHydrationWarning
      >
        <StudioNavbar />
        <main className="flex-1 min-h-0 relative">
          {children}
        </main>
      </body>
    </html>
  );
}
