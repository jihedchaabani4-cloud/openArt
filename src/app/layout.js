import "./globals.css";
import { Geist_Mono, Inter, Noto_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";

import { ReactQueryProvider } from "@/shared/lib/ReactQueryProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import Script from "next/script";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

const googleSans = localFont({
  src: [
    {
      path: "../../public/fonts/GoogleSans-VariableFont_GRAD,opsz,wght.ttf",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "../../public/fonts/GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf",
      style: "italic",
      weight: "100 900",
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Symbols:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <Script
          id="suppress-extension-errors"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // Suppress browser extension unhandled rejections
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e && (e.reason || e.detail);
                  var str = (reason && (reason.stack || reason.message || '' + reason)) || '';
                  if (str.indexOf('chrome-extension://') !== -1 || str.indexOf('M_ID') !== -1) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                }, true);

                // Filter out hydration mismatch warnings caused by browser extensions injecting bis_skin_checked
                var filterBisLog = function(origFn) {
                  return function() {
                    for (var i = 0; i < arguments.length; i++) {
                      var arg = arguments[i];
                      var str = (arg && (arg.stack || arg.message || '' + arg)) || '';
                      if (str.indexOf('bis_skin_checked') !== -1) {
                        return;
                      }
                    }
                    origFn.apply(console, arguments);
                  };
                };
                if (console.error) console.error = filterBisLog(console.error);
                if (console.warn) console.warn = filterBisLog(console.warn);

                if (typeof MutationObserver !== 'undefined') {
                  var obs = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                        m.target.removeAttribute('bis_skin_checked');
                      }
                    }
                  });
                  obs.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['bis_skin_checked'] });
                }
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${arabic.variable} ${googleSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
          <SpeedInsights />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
