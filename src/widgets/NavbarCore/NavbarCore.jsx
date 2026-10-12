"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { UserDropdown } from "@/widgets/StudioNavbar/ui/UserDropdown";
import { cn } from "@/shared/lib/utils";
import { NavbarBackButton } from "./ui/NavbarBackButton";
import { NavbarTitle } from "./ui/NavbarTitle";
import { NavbarInput } from "./ui/NavbarInput";
import { NavbarAction } from "./ui/NavbarAction";
import { NavbarDivider } from "./ui/NavbarDivider";
import { NavbarLeft, NavbarCenter, NavbarRight } from "./ui/NavbarSlots";

/**
 * NavbarCore
 * Base structural frame and slots for all top navigation bars in Cinema Studio.
 * Enforces uniform height (h-16), backdrop blur, borders, and slot alignments.
 *
 * Can be used in two clean ways:
 * 1. Prop-based slots:
 *    <NavbarCore
 *       onBack={goBack}
 *       left={<NavbarTitle>My Page</NavbarTitle>}
 *       right={<NavbarAction variant="primary" label="Save" onClick={save} />}
 *    />
 *
 * 2. Compound component slots:
 *    <NavbarCore>
 *       <NavbarCore.Left>
 *         <NavbarCore.BackButton onClick={goBack} />
 *         <NavbarCore.Title>My Page</NavbarCore.Title>
 *       </NavbarCore.Left>
 *       <NavbarCore.Right>
 *         <NavbarCore.Action variant="primary" label="Save" onClick={save} />
 *       </NavbarCore.Right>
 *    </NavbarCore>
 */
export function NavbarCore({
  onBack,
  backHref,
  backLabel = "Back",
  left,
  center,
  right,
  showUserDropdown = true,
  position = "fixed",
  isHidden = false,
  className,
  children,
}) {
  const hasBack = Boolean(onBack || backHref);

  return (
    <motion.nav
      initial={false}
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-100%", opacity: 0 },
      }}
      animate={isHidden ? "hidden" : "visible"}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "top-0 left-0 w-full z-50 flex items-center h-16 pl-3 pr-4 sm:pr-6 bg-transparent border-none",
        position,
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          {/* Left Slot: Back button + Left content */}
          <NavbarLeft>
            {hasBack && (
              <NavbarBackButton
                onClick={onBack}
                href={backHref}
                label={backLabel}
                className="transition-all shrink-0 border-0 border-transparent shadow-none"
              />
            )}
            {left}
          </NavbarLeft>

          {/* Center Slot (optional) */}
          {center && (
            <NavbarCenter>
              {center}
            </NavbarCenter>
          )}

          {/* Right Slot: Actions + optional UserDropdown */}
          <NavbarRight>
            {right}
            {showUserDropdown && <UserDropdown />}
          </NavbarRight>
        </>
      )}
    </motion.nav>
  );
}

// Compound component attachments
NavbarCore.Left = NavbarLeft;
NavbarCore.Center = NavbarCenter;
NavbarCore.Right = NavbarRight;
NavbarCore.BackButton = NavbarBackButton;
NavbarCore.Title = NavbarTitle;
NavbarCore.Input = NavbarInput;
NavbarCore.Action = NavbarAction;
NavbarCore.Divider = NavbarDivider;
NavbarCore.UserDropdown = UserDropdown;

export default NavbarCore;
