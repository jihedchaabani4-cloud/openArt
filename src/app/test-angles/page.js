"use client";

import AnglesPanel from "@/components/builder/Angles";
import { useState } from "react";

export default function TestAnglesPage() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F1113]">
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-[#D4FF00] text-black rounded-lg font-bold"
        >
          Open Angles Panel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[#0F1113] p-4">
      <div className="w-full max-w-md h-[800px]">
        <AnglesPanel
          onClose={() => setIsOpen(false)}
          onGenerate={(data) => console.log("Generate:", data)}
          previewImageUrl="https://picsum.photos/200/300"
        />
      </div>
    </div>
  );
}
