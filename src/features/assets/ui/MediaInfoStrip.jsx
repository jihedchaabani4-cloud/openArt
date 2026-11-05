"use client";

import { GoogleIcon } from "@/shared/ui/GoogleIcon";

function InfoPill({ icon: Icon, label, value, strong = false }) {
  if (!value) return null;

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#31544d] text-[#d7fff3]">
        <GoogleIcon iconName={Icon} className="text-base" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
          {label}
        </div>
        <div
          className={[
            "truncate text-sm text-white/78",
            strong ? "font-semibold text-white" : "",
          ].join(" ")}
          title={value}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function MediaInfoStrip({
  prompt,
  model,
  referencesCount = 0,
  size,
  createdAt,
}) {
  const referencesLabel = referencesCount > 0 ? `${referencesCount} reference${referencesCount === 1 ? "" : "s"}` : null;

  return (
    <div className="mt-4 w-full max-w-[980px] overflow-x-auto rounded-lg border border-[#27433d] bg-[#10201d]/95 p-3 shadow-none">
      <div className="flex min-w-max items-stretch gap-3">
        <InfoPill icon="chat" label="Prompt" value={prompt} strong />
        <InfoPill icon="auto_awesome" label="Model" value={model} />
        <InfoPill icon="layers" label="References" value={referencesLabel} />
        <InfoPill icon="straighten" label="Size" value={size} />
        <InfoPill icon="schedule" label="Created" value={createdAt} />
      </div>
    </div>
  );
}
