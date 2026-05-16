import { useEffect, useRef, useState } from "react";
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

function LeftPanel({ open }) {
  const showcaseVideos = [
    "https://res.cloudinary.com/dsak0vfdj/video/upload/v1778928777/hf_20260331_191024_b78d9842-046f-4725-8187-4e14b287beed_tsydgs.mp4",
    "https://res.cloudinary.com/dsak0vfdj/video/upload/v1778928774/hf_20260331_191029_757b3a01-f81e-4c78-9bd7-b00d22ff154d_rhhq_tmonkc.mp4",
    "https://res.cloudinary.com/dsak0vfdj/video/upload/v1778928775/hf_20260331_191130_a9d02a6e-1e68-4109-99aa-e0cda5a44dfb_rhhq_mtfii8.mp4",
    "https://res.cloudinary.com/dsak0vfdj/video/upload/v1778936591/76b88693-695f-45fe-99a8-1f460ff04fb3_oom74v.mp4",
    "https://res.cloudinary.com/dsak0vfdj/video/upload/v1778936722/hf_20260331_203041_504d6417-0215-4e01-98b6-434293f3d596_rhhq_1_t1nhob.mp4",
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousVideo, setPreviousVideo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const videoRef = useRef(null);
  const frameRef = useRef(null);
  const slideStartTimeoutRef = useRef(null);
  const slideCleanupTimeoutRef = useRef(null);
  const activeVideo = showcaseVideos[activeIndex];

  const pickNextVideo = () => {
    setProgress(0);
    setPreviousVideo(showcaseVideos[activeIndex]);
    setIsSliding(false);

    if (slideStartTimeoutRef.current) {
      window.clearTimeout(slideStartTimeoutRef.current);
    }
    if (slideCleanupTimeoutRef.current) {
      window.clearTimeout(slideCleanupTimeoutRef.current);
    }

    const nextIndex = showcaseVideos.length <= 1 ? 0 : (activeIndex + 1) % showcaseVideos.length;
    setActiveIndex(nextIndex);

    slideStartTimeoutRef.current = window.setTimeout(() => {
      setIsSliding(true);
    }, 20);

    slideCleanupTimeoutRef.current = window.setTimeout(() => {
      setPreviousVideo(null);
    }, 720);
  };

  useEffect(() => {
    if (!open) return;
    setPreviousVideo(null);
    setIsSliding(false);
    setProgress(0);
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    const syncProgress = () => {
      const video = videoRef.current;

      if (video && video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
      }

      frameRef.current = window.requestAnimationFrame(syncProgress);
    };

    frameRef.current = window.requestAnimationFrame(syncProgress);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [activeVideo]);

  useEffect(() => {
    return () => {
      if (slideStartTimeoutRef.current) {
        window.clearTimeout(slideStartTimeoutRef.current);
      }
      if (slideCleanupTimeoutRef.current) {
        window.clearTimeout(slideCleanupTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative hidden h-full min-h-0 flex-1 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_22%_15%,rgba(255,255,255,0.18),transparent_22%),linear-gradient(180deg,#09111d_0%,#05080f_52%,#090d14_100%)] lg:flex">
      <div className="relative size-full overflow-hidden">
        <div className="absolute inset-0">
          {previousVideo ? (
            <video
              key={`previous-${previousVideo}`}
              autoPlay
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
              className={[
                "absolute inset-0 size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                isSliding ? "translate-x-full" : "translate-x-0",
              ].join(" ")}
            >
              <source src={previousVideo} type="video/mp4" />
            </video>
          ) : null}

          <video
            key={activeVideo}
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={() => {
              setProgress(0);
            }}
            onEnded={pickNextVideo}
            className={[
              "absolute inset-0 size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              previousVideo ? (isSliding ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
            ].join(" ")}
          >
            <source src={activeVideo} type="video/mp4" />
          </video>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#02050c]/92 via-[#02050c]/28 to-white/10" />
        <div className="pointer-events-none absolute bottom-7 left-7 right-7 z-10 h-[2px] overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-end p-10">
          <div className="space-y-3">
            <p className="max-w-[320px] text-[28px] font-semibold tracking-[-0.03em] text-white">
              Bring your ideas to life faster.
            </p>
            <p className="max-w-[360px] text-[13px] leading-6 text-white/68">
              Sign in to generate images, edit visuals, and access stronger creative tools with your account.
            </p>
          </div>
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
      <DialogContent className="h-[min(740px,84vh)] w-[min(1240px,94vw)] max-w-[1240px] overflow-hidden rounded-[32px] p-0 bg-(--background-base-pri)" >
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

        <div className="flex h-full w-full items-stretch justify-center p-3">
          <LeftPanel open={open} />

          <div className="flex h-full w-full flex-col justify-center md:items-center lg:w-[460px] xl:w-[480px]">
            <div className="flex w-full flex-col gap-8 px-2 py-10 md:max-w-[440px] md:px-6 md:py-6">
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
