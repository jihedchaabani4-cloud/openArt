import { useState, useRef } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { useCinemaStore } from "@/store/useCinemaStudioStore"; // Multi-modal store
import { Music, Mic, Volume2, Sparkles } from "lucide-react";

const MOODS = ["Dramatic", "Epic", "Happy", "Sad", "Suspenseful", "Energetic", "Calm"];
const DURATIONS = ["15s", "30s", "60s"];

const SparkleIcon = () => (
  <Sparkles className="size-4" />
);

export default function AudioPromptBar({ hideBackground = false }) {
  const { activeWorkspaceId } = useStudioStore();
  const { fetchAssets, fetchGenerations } = useCinemaStore();
  
  const textareaRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [mood, setMood] = useState(MOODS[0]);
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [generating, setGenerating] = useState(false);
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [showDurMenu, setShowDurMenu] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || generating || !activeWorkspaceId) return;
    
    setGenerating(true);
    try {
      console.log(`🎵 Triggering audio generation for: ${prompt}`);
      const { api } = await import("@/lib/api");
      const res = await api.post(`/audio/generate`, {
        prompt,
        mood,
        duration,
        workspace_id: activeWorkspaceId
      });

      if (res.ok) {
        setPrompt("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        // Refresh store
        fetchAssets(activeWorkspaceId);
        fetchGenerations(activeWorkspaceId);
      } else {
        throw new Error(res.message || "Audio generation failed");
      }
    } catch (error) {
      console.error("❌ Audio generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  const Pill = ({ children, onClick, active }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "0 12px",
        height: "36px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.85)",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background 0.15s",
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      {children}
    </button>
  );

  const Dropdown = ({ value, options, onChange, show, setShow, icon: Icon }) => (
    <div style={{ position: "relative" }}>
      <Pill onClick={() => setShow(!show)} active={show}>
        {Icon && <Icon className="size-3.5 opacity-60" />}
        {value}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: show ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Pill>
      {show && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "12px",
          padding: "6px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          zIndex: 100,
          minWidth: "120px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setShow(false); }}
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                border: "none",
                background: opt === value ? "rgba(255,255,255,0.1)" : "transparent",
                color: opt === value ? "white" : "rgba(255,255,255,0.65)",
                fontSize: "13px",
                fontWeight: opt === value ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "background 0.1s",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <div style={{ width: "100%", position: "relative" }}>
        <div
          style={{
            borderRadius: "20px",
            padding: "2px",
            background: "linear-gradient(135deg, rgba(212,255,0,0.15) 0%, rgba(212,255,0,0.05) 50%, rgba(212,255,0,0.1) 100%)",
          }}
        >
          <form
            onSubmit={handleGenerate}
            style={{
              background: "rgba(15,15,18,0.97)",
              borderRadius: "18px",
              padding: "16px 18px",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(212,255,0,0.1)",
              transition: "all 0.2s ease-in-out",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px" }}>
              <div style={{ position: "relative", flexShrink: 0, marginTop: "2px" }}>
                <button
                  type="button"
                  style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Volume2 className="size-4" />
                </button>
              </div>

              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the sound or music you want to generate..."
                  rows={1}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    color: "white",
                    fontSize: "14.5px",
                    lineHeight: "1.6",
                    fontFamily: "inherit",
                    padding: "6px 0",
                    maxHeight: "120px",
                    overflowY: "auto",
                  }}
                  onInput={e => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />
                {!prompt && (
                  <div style={{
                    position: "absolute", top: "6px", left: 0,
                    color: "rgba(255,255,255,0.25)",
                    fontSize: "14.5px",
                    pointerEvents: "none",
                  }}>
                    Describe the sound or music you want to generate...
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <Dropdown
                value={mood}
                options={MOODS}
                onChange={setMood}
                show={showMoodMenu}
                setShow={setShowMoodMenu}
                icon={SparkleIcon}
              />

              <Dropdown
                value={duration}
                options={DURATIONS}
                onChange={setDuration}
                show={showDurMenu}
                setShow={setShowDurMenu}
                icon={Volume2}
              />

              <div style={{ flex: 1 }} />

              <button
                type="submit"
                disabled={!prompt.trim() || generating}
                style={{
                  height: "36px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  border: "1px solid rgba(212,255,0,0.3)",
                  background: generating
                    ? "rgba(212,255,0,0.05)"
                    : !prompt.trim()
                      ? "rgba(212,255,0,0.05)"
                      : "rgba(212,255,0,0.9)",
                  color: generating || !prompt.trim() ? "rgba(212,255,0,0.3)" : "#000",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: !prompt.trim() || generating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {generating ? "Generating..." : "Generate Audio"}
                {!generating && <Music className="size-3.5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
