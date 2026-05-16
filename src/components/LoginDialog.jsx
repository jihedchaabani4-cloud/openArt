import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" className="size-5">
      <path
        d="M15.747 9.151a6.478 6.478 0 0 1-.49 2.695 6.589 6.589 0 0 1-1.563 2.268l-2.235-1.699c.358-.23.666-.528.903-.877.238-.349.401-.741.48-1.154H9.136V7.771h6.486c.084.455.126.917.125 1.38Z"
        fill="#4285F4"
      />
      <path
        d="M13.694 14.114a6.654 6.654 0 0 1-4.558 1.633 6.992 6.992 0 0 1-3.611-1.005 6.802 6.802 0 0 1-2.536-2.713l1.765-1.368.5-.374c.2.588.533 1.124.976 1.566.443.443.984.78 1.58.985a4.22 4.22 0 0 0 3.624-.422l2.26 1.698Z"
        fill="#34A853"
      />
      <path
        d="M5.06 9c.003.435.077.868.22 1.281l-.501.374-1.79 1.369a6.572 6.572 0 0 1 0-6.05l2.29 1.743a3.97 3.97 0 0 0-.218 1.282Z"
        fill="#FBBC05"
      />
      <path
        d="m13.743 4.011-1.971 1.92a3.8 3.8 0 0 0-2.636-.993 4.169 4.169 0 0 0-2.383.783A4.036 4.036 0 0 0 5.28 7.717L2.989 5.975a6.801 6.801 0 0 1 2.535-2.716A6.99 6.99 0 0 1 9.136 2.25a6.68 6.68 0 0 1 4.607 1.761Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <path d="M2 2h7.6v7.6H2V2Z" fill="#F25022" />
      <path d="M10.4 2H18v7.6h-7.6V2Z" fill="#7FBA00" />
      <path d="M2 10.4h7.6V18H2v-7.6Z" fill="#00A4EF" />
      <path d="M10.4 10.4H18V18h-7.6v-7.6Z" fill="#FFB900" />
    </svg>
  );
}

function AuthButton({ icon, children, onClick, inverted = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors",
        inverted
          ? "bg-white text-black hover:bg-zinc-100"
          : "bg-zinc-800 text-white hover:bg-zinc-700",
      ].join(" ")}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function LeftPanel() {
  const modelAvatars = [
    "https://cdn-chatly.vyro.ai/chatly-web/images/auth-modal/grok.png",
    "https://cdn-chatly.vyro.ai/chatly-web/images/auth-modal/gemini.png",
    "https://cdn-chatly.vyro.ai/chatly-web/images/auth-modal/claude.png",
    "https://cdn-chatly.vyro.ai/chatly-web/images/auth-modal/kimik2.png",
    "https://cdn-chatly.vyro.ai/chatly-web/images/auth-modal/deepseek.png",
    "https://cdn-chatly.vyro.ai/chatly-web/images/auth-modal/klip.png",
    "https://cdn-chatly.vyro.ai/chatly-web/images/auth-modal/qwen.png",
  ];

  return (
    <div className="relative hidden min-h-[620px] flex-1 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_22%_15%,rgba(255,255,255,0.18),transparent_22%),linear-gradient(180deg,#09111d_0%,#05080f_52%,#090d14_100%)] px-10 pb-10 pt-12 lg:flex">

      <div className="relative z-10 flex h-full flex-col justify-end">


        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-start">
            {modelAvatars.map((avatar) => (
              <div
                key={avatar}
                className="-mr-2 size-8 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white xl:size-9"
              >
                <img
                  alt=""
                  loading="lazy"
                  width="36"
                  height="36"
                  src={avatar}
                  className="size-full object-contain p-1.5"
                />
              </div>
            ))}
            <div className="-mr-2 flex h-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white px-3 xl:h-9">
              <p className="text-center text-[13px] font-medium text-black">
                +39 plus de modeles d'IA
              </p>
            </div>
          </div>
          <p className="max-w-[360px] text-[13px] leading-6 text-white/52">
            Sign in to generate images, edit visuals, and access stronger creative tools with your account.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoginDialog({ open, onClose }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleGoogleLogin = () => {
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${apiUrl}/auth/microsoft`;
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()}>
      <DialogContent className="p-0 bg-(--background-base-pri)" >
        <span className="sr-only">
          <DialogTitle>Authentication</DialogTitle>
        </span>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/8 hover:text-white"
          aria-label="Close login dialog"
        >
          <X className="size-5" />
        </button>

        <div className="flex w-full justify-center ">
          <LeftPanel />

          <div className="flex w-full flex-col justify-center md:items-center lg:w-[416px] xl:w-[432px]">
            <div className="flex w-full flex-col gap-8 px-2 py-10 md:max-w-[432px] md:px-6 md:py-6">
              <div className="space-y-2 text-center">
                <p className="text-[28px] font-semibold tracking-[-0.02em] text-white">
                  Sign in or create your account
                </p>
                <p className="text-[14px] leading-6 text-white/58">
                  Get smarter results, save your work, and unlock premium image and video tools.
                </p>
              </div>

              <div className="space-y-3">
                <AuthButton icon={<GoogleIcon />} onClick={handleGoogleLogin} inverted>
                  Continue with Google
                </AuthButton>
                <AuthButton icon={<MicrosoftIcon />} onClick={handleMicrosoftLogin}>
                  Continue with Microsoft
                </AuthButton>
              </div>

              <div className="space-y-3 text-center">
                <div className="inline-flex items-center gap-2 text-[12px] text-white/55">
                  <span className="size-3 rounded-sm border border-white/25" />
                  Your account data stays secure and private.
                </div>
                <p className="text-[11px] leading-5 text-white/38">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;
