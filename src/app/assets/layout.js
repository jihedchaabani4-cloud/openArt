"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "framer-motion";

import {
  AssetsFiltersProvider,
} from "./AssetsFiltersContext";
import { AssetsNavbar } from "./components/AssetsNavbar";
import { AssetsSidebar } from "./components/AssetsSidebar";

export default function AssetsLayout({ children }) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();
  const isAssetDetailPage = /^\/assets\/[^/]+$/.test(pathname || "");

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <AssetsFiltersProvider>
      <div className="min-h-screen bg-[#050505]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1720px] flex-col">
          {!isAssetDetailPage ? <AssetsNavbar hidden={hidden} /> : null}
          <div className="flex flex-1 space-x-4">
            {!isAssetDetailPage ? <AssetsSidebar hidden={hidden} /> : null}
            <main className="min-w-0 flex-1 flex flex-col">{children}</main>
          </div>
        </div>
      </div>
    </AssetsFiltersProvider>
  );
}
