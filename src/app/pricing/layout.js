"use client";

import { ProjectsNavbar } from "@/components/layout/ProjectsNavbar";

export default function PricingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <ProjectsNavbar />
      <main className="pt-[75px] flex-1 flex flex-col">{children}</main>
    </div>
  );
}
