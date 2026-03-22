import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-bold rounded-md border px-2.5 py-0.5 text-[10px] font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        studio:
          "font-grotesk bg-[#d1fe17] text-black text-[10px] inline-block uppercase px-1 rounded-sm font-bold -skew-x-12 h-4 max-h-4 leading-4 flex items-center justify-center",
        new:
          "font-grotesk bg-[#d1fe17] text-black text-[10px] inline-block uppercase px-1 rounded-sm font-bold -skew-x-12 h-4 max-h-4 leading-4 flex items-center justify-center",
        exclusive:
          "font-grotesk bg-[#d1fe17] text-black text-[10px] inline-block uppercase px-1 rounded-sm font-bold -skew-x-12 h-4 max-h-4 leading-4 flex items-center justify-center",
        premium:
          "font-grotesk bg-[#d1fe17] text-black text-[10px] inline-block uppercase px-1 rounded-sm font-bold -skew-x-12 h-4 max-h-4 leading-4 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// ── Quality badge e.g. <QualityBadge value="1080p" />Hnew
function QualityBadge({ value, className }) {
  return (
    <div className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-white/5 text-[#898a8b] text-[10px] font-medium", className)}>
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M6.56218 3.52331C6.89119 3.18855 7.34089 3 7.81027 3H16.186C16.6554 3 17.1051 3.18855 17.4341 3.52331L22.5881 8.76722C23.2614 9.45231 23.2567 10.5521 22.5774 11.2313L13.2356 20.5732C12.5521 21.2566 11.4441 21.2566 10.7607 20.5732L1.41881 11.2313C0.73957 10.5521 0.734815 9.45231 1.40816 8.76722L6.56218 3.52331ZM9.02845 7.21967C9.32135 7.51256 9.32135 7.98744 9.02845 8.28033L7.30878 10L9.02845 11.7197C9.32135 12.0126 9.32135 12.4874 9.02845 12.7803C8.73556 13.0732 8.26069 13.0732 7.96779 12.7803L5.71779 10.5303C5.4249 10.2374 5.4249 9.76256 5.71779 9.46967L7.96779 7.21967C8.26069 6.92678 8.73556 6.92678 9.02845 7.21967Z" fill="currentColor"/>
      </svg>
      <span>{value}</span>
    </div>
  )
}

// ── Time/duration badge e.g. <TimeBadge value="3s–15s" />
function TimeBadge({ value, className }) {
  return (
    <div className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded-sm  text-[#898a8b] text-[10px] font-medium", className)}>
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12.75 7.75C12.75 7.33579 12.4142 7 12 7C11.5858 7 11.25 7.33579 11.25 7.75V12C11.25 12.1989 11.329 12.3897 11.4697 12.5303L14.2197 15.2803C14.5126 15.5732 14.9874 15.5732 15.2803 15.2803C15.5732 14.9874 15.5732 14.5126 15.2803 14.2197L12.75 11.6893V7.75Z" fill="currentColor"/>
      </svg>
      <span>{value}</span>
    </div>
  )
}

export { Badge, badgeVariants, QualityBadge, TimeBadge }
