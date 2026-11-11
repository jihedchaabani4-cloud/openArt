import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";

import { ReactQueryProvider } from "@/shared/lib/ReactQueryProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Cinema Studio",
  description: "Non-linear node-based creative AI studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script
          id="suppress-extension-errors"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e && (e.reason || e.detail);
                  var str = (reason && (reason.stack || reason.message || '' + reason)) || '';
                  if (str.indexOf('chrome-extension://') !== -1 || str.indexOf('M_ID') !== -1) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                }, true);

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
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            closeButton
            toastOptions={{
              style: {
                background: "var(--bg-surface)",
                borderColor: "var(--border-brand-btn)",
                color: "var(--text-primary)",
                borderRadius: "var(--r-sm)",
                boxShadow: "var(--sh-toast)",
              },
            }}
          />
          <SpeedInsights />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
