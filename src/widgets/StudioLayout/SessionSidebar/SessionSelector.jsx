"use client";

import React from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";

/**
 * SessionSelector
 * Google Flow styled session selector component placed at the top of the right Session Bar.
 */
export function SessionSelector({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onCreateSession,
  isExpanded = true,
  className,
}) {
  const [open, setOpen] = React.useState(false);

  const activeSession = React.useMemo(() => {
    return sessions.find(
      (s) => s.name === activeSessionId || s.id === activeSessionId || s.session_id === activeSessionId
    ) || sessions[0];
  }, [sessions, activeSessionId]);

  const activeDisplayName = activeSession?.metadata?.displayName || activeSession?.session_name || "Session 1";

  return (
    <div className={cn("w-full flex items-center justify-between gap-1.5", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          {isExpanded ? (
            <button
              type="button"
              className={cn(
                "flex-1 h-9 px-3 rounded-[12px] flex items-center justify-between gap-2 transition-all outline-none select-none cursor-pointer text-left",
                "bg-[rgba(218,220,224,0.06)] hover:bg-[rgba(218,220,224,0.12)] active:bg-[rgba(218,220,224,0.16)]",
                "border border-transparent hover:border-white/10",
                open && "bg-[rgba(218,220,224,0.15)] border-white/15"
              )}
              title={`Session active : ${activeDisplayName}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <GoogleIcon
                  iconName="layers"
                  className="text-[17px] text-[rgba(218,220,224,0.75)] shrink-0"
                />
                <span className="text-[13px] font-medium text-white truncate max-w-[130px]">
                  {activeDisplayName}
                </span>
              </div>
              <GoogleIcon
                iconName="keyboard_arrow_down"
                className={cn(
                  "text-[16px] text-white/50 shrink-0 transition-transform duration-200",
                  open && "rotate-180 text-white"
                )}
              />
            </button>
          ) : (
            <button
              type="button"
              className={cn(
                "size-10 rounded-xl flex items-center justify-center transition-all outline-none select-none cursor-pointer",
                "bg-[rgba(218,220,224,0.06)] hover:bg-[rgba(218,220,224,0.12)] active:bg-[rgba(218,220,224,0.16)] text-white/80 hover:text-white",
                open && "bg-white/15 text-white"
              )}
              title={`Session active : ${activeDisplayName}`}
            >
              <GoogleIcon iconName="layers" className="text-[20px]" />
            </button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-64 p-1.5 flex flex-col gap-0.5 font-['Google_Sans_Text',sans-serif]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-[rgba(218,220,224,0.6)] uppercase tracking-wider">
            <span>Sessions ({sessions.length})</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCreateSession?.();
                setOpen(false);
              }}
              className="size-6 rounded-md hover:bg-white/10 text-white/80 hover:text-white"
              title="Nouvelle session"
            >
              <GoogleIcon iconName="add" className="text-[14px]" />
            </Button>
          </div>

          <DropdownMenuSeparator className="my-1 bg-white/10" />

          {/* Session List */}
          <div className="max-h-[260px] overflow-y-auto flex flex-col gap-0.5 pr-0.5">
            {sessions.map((session) => {
              const sid = session.name || session.id || session.session_id;
              const name = session.metadata?.displayName || session.session_name || "Untitled";
              const isSelected = sid === activeSessionId;

              return (
                <DropdownMenuItem
                  key={sid}
                  onClick={() => {
                    onSelectSession?.(sid);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 min-h-[38px] rounded-[10px] cursor-pointer text-[13px] font-medium transition-colors",
                    isSelected
                      ? "bg-white/15 text-white"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <GoogleIcon
                      iconName="folder"
                      className={cn(
                        "text-[16px] shrink-0",
                        isSelected ? "text-white" : "text-white/50"
                      )}
                    />
                    <span className="truncate">{name}</span>
                  </div>
                  {isSelected && (
                    <GoogleIcon
                      iconName="check"
                      className="text-[16px] text-white shrink-0 ml-1"
                    />
                  )}
                </DropdownMenuItem>
              );
            })}

            {sessions.length === 0 && (
              <div className="px-3 py-3 text-center text-[12px] text-white/40 italic">
                Aucune session trouvée
              </div>
            )}
          </div>

          <DropdownMenuSeparator className="my-1 bg-white/10" />

          {/* New Session Action */}
          <DropdownMenuItem
            onClick={() => {
              onCreateSession?.();
              setOpen(false);
            }}
            className="flex items-center gap-2 px-2.5 py-2 rounded-[10px] text-[13px] font-medium text-white hover:bg-white/10 cursor-pointer"
          >
            <GoogleIcon iconName="add" className="text-[16px] text-white/80" />
            <span>Nouvelle session</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick New Session Button (when expanded) */}
      {isExpanded && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCreateSession}
          className="size-9 rounded-[12px] bg-[rgba(218,220,224,0.06)] hover:bg-[rgba(218,220,224,0.12)] active:bg-[rgba(218,220,224,0.16)] text-white/80 hover:text-white shrink-0 border border-transparent hover:border-white/10"
          title="Créer une nouvelle session"
        >
          <GoogleIcon iconName="add" className="text-[16px]" />
        </Button>
      )}
    </div>
  );
}
