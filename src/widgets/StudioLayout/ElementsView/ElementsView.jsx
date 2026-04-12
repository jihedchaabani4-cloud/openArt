"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Info } from "lucide-react"

import { CreateElementDialog } from "./ui/CreateElementDialog"

/**
 * ElementsView
 */
export function ElementsView({
  elements = DEMO_ELEMENTS,
  projectName = "Untitled Project",
  onNewElement,
  onHowTo,
}) {
  const [hoveredId, setHoveredId] = useState(null)
  const [isSectionHovered, setIsSectionHovered] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleCreateElement = (data) => {
    console.log("Creating new element:", data)
    // Here you would typically call an API or update the parent state
    onNewElement?.(data)
    setIsCreateDialogOpen(false)
  }

  // Always 4 slots
  const slots = [...elements.slice(0, 4)]
  while (slots.length < 4) slots.push(null)

  const [centerItem, topLeft, bottomLeft, right] = slots

  // Animation constants for "gathering at the center"
  const CENTER_POS = { top: "50%", left: "50%", x: "-50%", y: "-50%" }
  const UNIFORM_SIZE = { width: "200px", height: "240px" }

  const cards = [
    {
      slot: centerItem,
      id: "center",
      baseStyle: { top: "25px", left: "70px", right: "70px", bottom: "0px", zIndex: 2 },
      animate: { top: "25px", left: "70px", width: "calc(100% - 140px)", height: "calc(100% - 25px)", x: 0, y: 0, rotate: 0 },
      isBig: true
    },
    {
      slot: topLeft,
      id: "tl",
      baseStyle: { top: "10px", left: "0px", width: "150px", height: "168px", zIndex: 4 },
      animate: { top: "10px", left: "0px", width: "150px", height: "168px", x: 0, y: 0, rotate: -3 },
    },
    {
      slot: bottomLeft,
      id: "bl",
      baseStyle: { bottom: "8px", left: "36px", width: "148px", height: "152px", zIndex: 5 },
      animate: { bottom: "8px", left: "36px", width: "148px", height: "152px", top: "auto", x: 0, y: 0, rotate: 2 },
    },
    {
      slot: right,
      id: "r",
      baseStyle: { top: "55px", right: "0px", width: "152px", height: "198px", zIndex: 3 },
      animate: { top: "55px", right: "0px", left: "auto", width: "152px", height: "198px", x: 0, y: 0, rotate: 4 },
    },
  ]

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft ambient glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: "44%",
          left: "60%",
          width: "680px",
          height: "440px",
          background: "radial-gradient(ellipse, rgba(50,90,130,0.11) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "80px",
          maxWidth: "980px",
          width: "100%",
          padding: "0 48px",
        }}
      >
        {/* LEFT — Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ flex: "0 0 auto", maxWidth: "295px" }}
        >
          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "13px", fontWeight: 500, letterSpacing: "0.03em", margin: "0 0 6px" }}>
            Elements collection
          </p>

          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.025em", margin: "0 0 14px" }}>
            {projectName}
          </h1>

          <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "13.5px", lineHeight: 1.65, margin: "0 0 30px" }}>
            Save characters, props, products, or places you want to reuse, and enhance their consistency throughout this project.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              style={btnStyle("#2563eb")}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <Plus size={15} strokeWidth={2.5} />
              New Element
            </button>
            <button onClick={onHowTo} style={ghostBtnStyle}>
              <Info size={15} />
              How to
            </button>
          </div>
        </motion.div>

        {/* RIGHT — Animated Image Stack */}
        <motion.div
          onMouseEnter={() => setIsSectionHovered(true)}
          onMouseLeave={() => setIsSectionHovered(false)}
          style={{
            flex: 1,
            position: "relative",
            height: "390px",
            minWidth: "420px",
          }}
        >
          {cards.map((card, i) => {
            const isHovered = hoveredId === card.id
            const isGathered = isSectionHovered // When the whole right section is hovered, they gather

            return (
              <motion.div
                key={card.id}
                onMouseEnter={() => setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId(null)}
                initial={{ ...CENTER_POS, ...UNIFORM_SIZE, opacity: 0 }}
                animate={isGathered 
                  ? { ...CENTER_POS, ...UNIFORM_SIZE, opacity: 1, zIndex: 10 + i, rotate: (i - 1.5) * 5 } 
                  : { ...card.animate, opacity: 1, zIndex: card.baseStyle.zIndex }
                }
                whileHover={!isGathered ? { scale: 1.05, zIndex: 20, y: -5 } : { scale: 1.1, zIndex: 30 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 25, 
                  delay: isGathered ? 0 : i * 0.1 
                }}
                style={{
                  position: "absolute",
                  borderRadius: card.isBig ? "16px" : "12px",
                  overflow: "hidden",
                  background: card.isBig ? "#181818" : "#202020",
                  boxShadow: isHovered 
                    ? "0 22px 55px rgba(0,0,0,0.8)" 
                    : "0 12px 35px rgba(0,0,0,0.5)",
                  cursor: "pointer"
                }}
              >
                {card.slot ? (
                  <img
                    src={card.slot.imageUrl}
                    alt={card.slot.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Placeholder label={card.isBig ? "Main" : "Empty"} />
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <CreateElementDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateElement}
      />
    </div>
  )
}

/* ── helpers ── */

function Placeholder({ label = "Empty" }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.15)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {label}
    </div>
  )
}

const btnStyle = (bg) => ({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  background: bg,
  color: "#fff",
  border: "none",
  borderRadius: "999px",
  padding: "9px 18px",
  fontSize: "13.5px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "box-shadow 0.15s",
})

const ghostBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  background: "transparent",
  color: "rgba(255,255,255,0.68)",
  border: "none",
  borderRadius: "999px",
  padding: "9px 14px",
  fontSize: "13.5px",
  fontWeight: 500,
  cursor: "pointer",
}

/* ── Demo data ── */
const DEMO_ELEMENTS = [
  { id: "1", name: "Main Character", imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&q=80" },
  { id: "2", name: "Cap Product",    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80" },
  { id: "3", name: "Skate Ramp",     imageUrl: "https://images.unsplash.com/photo-1520095972714-909e91b038e5?w=400&q=80" },
  { id: "4", name: "Portrait",       imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80" },
]

export default ElementsView