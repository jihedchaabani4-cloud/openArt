"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { useAuthSession } from "@/shared/api/auth";
import { Loader2 } from "lucide-react";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Level Labs";

const showcaseVideos = [
 
  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1778928775/hf_20260331_191130_a9d02a6e-1e68-4109-99aa-e0cda5a44dfb_rhhq_mtfii8.mp4",

  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1778936591/76b88693-695f-45fe-99a8-1f460ff04fb3_oom74v.mp4",

  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040861/b4543834-64ab-412b-95a7-5af00e39d591_qasyj0.mp4",

  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040876/original-80071a533bd3c78d18f93bf70c273d1a_zmzwwy.mp4",

  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040853/hf_20260331_191037_04f72a6e-7458-4618-95c0-faf27fc34172_mzuihp.mp4",

  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040843/0ad7a436-9a7d-4391-bf3a-ba1a400d6218_fuzcla.mp4",

  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040859/hf_20260331_185422_f1d47845-13f3-4f21-b3a5-f06a5b70e09a_sepayv.mp4"
];
// Duplicate to fill the masonry grid
const MEDIA_ITEMS = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  isVideo: true,
  url: showcaseVideos[i % showcaseVideos.length]
}));

export default function HomePage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const router = useRouter();
  const { data: user, isLoading: authLoading } = useAuthSession();

  // Redirect to cinema studio if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/cinema-studio");
    }
  }, [user, router]);

  const handleCTA = () => {
    if (user) {
      router.push("/cinema-studio");
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden font-sans">
      
      {/* ─── Background Masonry Gallery ─── */}
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="columns-3 sm:columns-3 md:columns-3 xl:columns-4 gap-4 lg:gap-5 p-4 lg:p-6 opacity-50">
          {MEDIA_ITEMS.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="break-inside-avoid mb-3 lg:mb-4 rounded-[20px] overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
            >
              {item.isVideo ? (
                <video 
                  src={item.url} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-auto block object-cover"
                />
              ) : (
                <img 
                  src={item.url} 
                  alt="" 
                  className="w-full h-auto block object-cover"
                />
              )}
              {/* Optional inner shadow/overlay for grid items */}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-[20px]" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── Foreground Overlay ─── */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
        
        {/* Dark Vignette to make text readable (no blur) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,5,5,1)_0%,rgba(5,5,5,0.15)_30%,rgba(5,5,5,0.15)_70%,rgba(5,5,5,1)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.65)_100%)]" />

        {/* Central Content */}
        <div className="relative z-20 flex flex-col items-center text-center mt-[-10vh]">
          
          {/* FLOW Text Container */}
          <div className="relative flex justify-center items-center">
            {/* The lighter glowing blur behind the text */}
            <div className="absolute w-[110%] h-[70%] bg-white/20 blur-[50px] rounded-full pointer-events-none" />
            <div className="absolute w-[80%] h-[50%] bg-white/30 blur-[30px] rounded-full pointer-events-none" />
            
            <h1 className="text-[100px] md:text-[140px] lg:text-[200px] font-medium text-white tracking-tighter leading-none m-0 drop-shadow-lg relative z-10">
              {appName}
            </h1>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-2 text-xl md:text-[28px] font-medium text-white/90 max-w-2xl px-6 leading-tight"
          >
            Where the next wave of storytelling happens
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="pointer-events-auto"
          >
            <Button
              onClick={!authLoading ? handleCTA : undefined}
              disabled={authLoading}
              className="mt-8 px-8 py-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl text-white text-[17px] font-semibold transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-60 disabled:cursor-default disabled:scale-100 flex items-center gap-2"
            >
              {authLoading ? (
                <><Loader2 className="size-5 animate-spin" /> Connexion...</>
              ) : user ? (
                "Cinema Studio"
              ) : (
                "Se connecter"
              )}
            </Button>
          </motion.div>
        </div>


      </div>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
