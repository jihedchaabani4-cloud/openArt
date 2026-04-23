"use client";

import { useState } from "react";

// ─── Icons ───────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.84-1.6 2.4v2h2.6c1.52-1.4 2.4-3.5 2.4-5.96 0-.57-.05-1.12-.17-1.64z" fill="#4285F4" />
    <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.64.77-2.7.77-2.08 0-3.84-1.4-4.47-3.3H1.83v2.07C3.15 15.19 5.89 17 8.98 17z" fill="#34A853" />
    <path d="M4.51 10.52A5.14 5.14 0 0 1 4.24 9c0-.53.09-1.04.27-1.52V5.41H1.83A8.97 8.97 0 0 0 1 9c0 1.45.35 2.82.96 4.03z" fill="#FBBC05" />
    <path d="M8.98 3.58c1.18 0 2.23.41 3.06 1.2l2.28-2.28C12.95 1.22 11.14.5 8.98.5 5.89.5 3.15 2.31 1.83 4.97l2.68 2.07c.63-1.9 2.39-3.3 4.47-3.3z" fill="#EA4335" />
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.5 269-317.5 70.1 0 128.4 46.4 172.5 46.4 42.1 0 108.2-49 191.6-49 30.8 0 130.4 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <rect x="1" y="1" width="7" height="7" fill="#f25022" />
    <rect x="10" y="1" width="7" height="7" fill="#7fba00" />
    <rect x="1" y="10" width="7" height="7" fill="#00a4ef" />
    <rect x="10" y="10" width="7" height="7" fill="#ffb900" />
  </svg>
);

const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="3.5" width="16" height="11" rx="2" stroke="#888" strokeWidth="1.2" />
    <path d="M1 6l8 5 8-5" stroke="#888" strokeWidth="1.2" />
  </svg>
);

const HiggsLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6 6 C6 6 10 4 12 12 C14 4 18 6 18 6" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M6 18 C6 18 10 16 12 8 C14 16 18 18 18 18" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────
const AuthButton = ({
  icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-[10px] border border-white/10 bg-white/5 px-4 py-[11px] text-sm font-medium text-neutral-200 transition hover:border-white/20 hover:bg-white/10"
  >
    <span className="flex-shrink-0">{icon}</span>
    {label}
  </button>
);

const ModelPanel = () => {
  const tabs = ["Nano Banana Pro", "Kling 3.0", "Higgsfield Soul", "Cinematic App"];
  const [active, setActive] = useState(0);

  return (
    <div className="relative hidden w-[240px] flex-shrink-0 overflow-hidden rounded-r-2xl md:flex">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0c29]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(192,132,252,0.35),transparent_70%)]" />

      {/* Close */}
      <button
        className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-black/50 text-[11px] text-neutral-400 transition hover:bg-white/10"
      >
        ✕
      </button>

      {/* Overlay content */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-12">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-neutral-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b9f751]" />
          4K Resolution
        </span>

        <p className="font-syne text-[1.05rem] font-extrabold uppercase leading-tight tracking-tight text-white">
          Nano Banana<br />Pro 4K
        </p>

        <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
          The best image model, for the best price in the industry, only on Higgsfield
        </p>

        <div className="mt-2 flex border-t border-white/10 pt-2">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setActive(i)}
              className={`flex-1 pb-1 text-[8px] transition ${
                active === i
                  ? "border-b border-white text-white"
                  : "text-neutral-600 hover:text-neutral-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────
export function LoginDialog({ open, onClose }) {
  if (!open) return null;

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleMicrosoftLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/microsoft";
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-[700px] max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
        {/* ── Left: Auth form ── */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 relative">
          
          {/* Close button for mobile/overall */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-neutral-400 transition hover:bg-white/10 md:hidden"
          >
            ✕
          </button>
          
          {/* Logo */}
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#b9f751]">
            <HiggsLogo />
          </div>

          <h1 className="font-syne mb-1 text-center text-xl font-bold text-white">
            Welcome to Higgsfield
          </h1>
          <p className="mb-6 text-center text-[13px] text-neutral-500">
            Sign up and generate for free
          </p>

          {/* Buttons */}
          <div className="flex w-full flex-col gap-2.5">
            <AuthButton icon={<GoogleIcon />} label="Continue with Google" onClick={handleGoogleLogin} />
            <AuthButton icon={<AppleIcon />} label="Continue with Apple" />
            <AuthButton icon={<MicrosoftIcon />} label="Continue with Microsoft" onClick={handleMicrosoftLogin} />

            <div className="relative my-1 text-center text-[11px] text-neutral-600">
              <span className="relative z-10 bg-[#111] px-3">OR</span>
              <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-white/8" />
            </div>

            <AuthButton icon={<EmailIcon />} label="Continue with Email" />
          </div>

          {/* SSO */}
          <p className="mt-3 text-[11px] text-neutral-600">
            ☁ SSO available on{" "}
            <a href="#" className="underline underline-offset-2 hover:text-neutral-400">
              Business and Enterprise
            </a>{" "}
            plans
          </p>

          {/* Legal */}
          <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-700">
            By continuing, I acknowledge the{" "}
            <a href="#" className="underline underline-offset-2 hover:text-neutral-500">
              Privacy Policy
            </a>{" "}
            and agree to the{" "}
            <a href="#" className="underline underline-offset-2 hover:text-neutral-500">
              Terms of Use
            </a>
            . I also confirm that I am at least 18 years old
          </p>
        </div>

        {/* ── Right: Model showcase ── */}
        <ModelPanel />
      </div>
    </div>
  );
}
