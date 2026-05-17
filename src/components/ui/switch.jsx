import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full p-[2px]",
      "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",

      // LIQUID GLASS TRACK
      "bg-white/20 backdrop-blur-xl border border-white/30",
      "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-emerald-400/70 data-[state=checked]:to-green-500/70",

      "shadow-[inset_0_2px_8px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15)]",

      className
    )}
    {...props}
    ref={ref}
  >
    {/* Liquid overlay */}
    <div className="absolute inset-0 rounded-full bg-white/10 pointer-events-none" />

    <SwitchPrimitives.Thumb
      className={cn(
        "relative z-10 h-6 w-6 rounded-full",

        // GLASS KNOB
        "bg-white/80 backdrop-blur-md",

        // DEPTH
        "shadow-[0_6px_15px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.6)]",

        // MOVEMENT
        "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",

        // PRESS EFFECT
        "active:scale-110"
      )}
    >
      {/* reflection */}
      <div className="absolute inset-[3px] rounded-full bg-white/40 blur-[1px]" />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))

export { Switch }