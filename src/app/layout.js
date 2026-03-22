import "./globals.css";
import { Geist_Mono, Poppins } from "next/font/google";
import { StudioNavbar } from "@/widgets/StudioNavbar";
import { ReactQueryProvider } from "@/shared/lib/ReactQueryProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
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
        className={`${poppins.variable} ${geistMono.variable} antialiased bg-black text-white overflow-hidden font-sans flex flex-col h-screen`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          <StudioNavbar />
          <main className="flex-1 min-h-0 relative pt-[60px]">
            {children}
          </main>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
