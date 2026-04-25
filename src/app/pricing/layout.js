"use client";

import { ProjectsNavbar } from "@/widgets/ProjectsNavbar/ProjectsNavbar";

export default function PricingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <ProjectsNavbar />
      <main className="pt-[75px] flex-1 flex flex-col">{children}</main>
    </div>
  );
}
