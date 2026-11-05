"use client";
import React, { useState } from "react";
import { Button } from "@/shared/ui/button";

const levelSlides = [
  {
    url: "https://s.krea.ai/krea-1/skinTexture.webp",
    caption: "Photorealistic skin textures and color science"
  },
  {
    url: "https://s.krea.ai/krea-1/carCloseup.webp",
    caption: "Discover new perspectives with extreme camera angles"
  },
  {
    url: "https://s.krea.ai/krea-1/swordBloom.webp",
    caption: "Perfect imperfection. Grain, bloom, blur"
  },
  {
    url: "https://s.krea.ai/krea-1/catSf.webp",
    caption: "Engineered for high visual complexity"
  },
  {
    url: "https://s.krea.ai/krea-1/guitarPlayer.webp",
    caption: "Dreamy, vivid, weird. Artistic and expressive rendering"
  },
  {
    url: "https://s.krea.ai/krea-1/catSleeping.webp",
    caption: "Dali paintings or cat memes. Ultra realistic surrealism"
  },
  {
    url: "https://s.krea.ai/krea-1/carIllu.webp",
    caption: "Simple prompts, strong visuals"
  }
];

export function ModelSlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <section className="relative z-30 w-full bg-black py-16 md:py-24 px-6 md:px-12 lg:px-24 flex flex-col items-center">
      <div className="max-w-6xl w-full flex flex-col gap-10 md:gap-12 mx-auto">
        {/* Top Header */}
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <span className="text-white/40 uppercase tracking-widest text-xs md:text-sm font-semibold block">
              Powerful proprietary models
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Level 1 - Our ultra-realistic image model
            </h2>
          </div>
          <p className="text-white/50 text-sm md:text-base max-w-lg lg:text-right leading-relaxed font-medium">
            Level 1 is our proprietary image model. Unlike traditional models, it offers accurate skin textures, dynamic camera angles, and expressive styles. Discover an exceptionally artistic latent space.
          </p>
        </div>

        {/* Carousel / Slider Card */}
        <div className="relative h-[20rem] w-full overflow-hidden rounded-lg bg-zinc-950 group shadow-none">
          {/* Images */}
          {levelSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                idx === activeSlide
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-[1.03] pointer-events-none"
              }`}
            >
              <img
                src={slide.url}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                alt=""
                loading="lazy"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
              
              {/* Caption */}
              <div
                className={`absolute bottom-0 left-0 z-10 p-8 md:p-12 max-w-2xl transition-all duration-500 delay-200 ${
                  idx === activeSlide ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <h3 className="text-lg md:text-2xl font-bold tracking-tight text-white leading-tight">
                  {slide.caption}
                </h3>
              </div>
            </div>
          ))}

          {/* Left Progress Bar Indicator */}
          <div className="absolute top-0 left-0 z-20 flex h-full items-center p-8 md:p-12 pointer-events-none">
            <div className="flex flex-col items-center">
              <div className="relative h-28 w-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 w-full bg-white rounded-full transition-transform duration-500 origin-top"
                  style={{
                    height: "100%",
                    transform: `scaleY(${(activeSlide + 1) / levelSlides.length})`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute bottom-8 right-8 z-20 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setActiveSlide((prev) => (prev - 1 + levelSlides.length) % levelSlides.length)}
              className="w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 active:scale-95 shadow-none p-0"
              aria-label="Previous slide"
            >
              <svg viewBox="0 0 10 17" fill="none" className="w-2.5 h-4 -translate-x-0.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 1.5L1.5 8.5L8.5 15.5" />
              </svg>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setActiveSlide((prev) => (prev + 1) % levelSlides.length)}
              className="w-12 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 active:scale-95 shadow-none p-0"
              aria-label="Next slide"
            >
              <svg viewBox="0 0 10 17" fill="none" className="w-2.5 h-4 translate-x-0.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 1.5L8.5 8.5L1.5 15.5" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
