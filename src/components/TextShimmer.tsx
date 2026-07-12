"use client";

import { motion } from "framer-motion";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  layoutId?: string;
}

export function TextShimmer({ children, className = "", style = {}, layoutId }: TextShimmerProps) {
  return (
    <motion.div
      layoutId={layoutId}
      className={className}
      style={{
        display: "inline-block",
        background: "linear-gradient(90deg, var(--shimmer-1) 0%, var(--shimmer-2) 50%, var(--shimmer-1) 100%)",
        backgroundSize: "200% auto",
        color: "transparent",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        ...style
      }}
      animate={{ backgroundPosition: ["200% center", "-200% center"] }}
      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
    >
      {children}
    </motion.div>
  );
}
