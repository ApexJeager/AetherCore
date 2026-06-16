import { motion, HTMLMotionProps } from 'motion/react';
import React from 'react';
import { cn } from '../../lib/utils';

export interface BentoCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  focused?: boolean;
  critical?: boolean;
}

export const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ children, className, focused, critical, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30, z: -200, rotateX: 5 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          z: focused ? 100 : 0,
          scale: focused ? 1.05 : 1,
          rotateX: 0
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={cn(
          "glass-panel rounded-2xl p-6 relative overflow-hidden transition-colors duration-500",
          critical && "border-accent-red/50 shadow-[0_0_40px_-5px_rgba(255,51,102,0.4)]",
          focused && !critical && "border-accent-blue/50 shadow-[0_0_40px_-5px_rgba(0,240,255,0.3)]",
          className
        )}
        {...props}
      >
        {critical && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-red/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        )}
        {!critical && focused && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        )}
        {children}
      </motion.div>
    );
  }
);

BentoCard.displayName = "BentoCard";
