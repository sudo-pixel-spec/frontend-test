"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AuroraLayer() {
  return (
    <div className="fixed inset-0 -z-15 overflow-hidden pointer-events-none select-none">
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 1.15, 0.85, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-[15%] -right-[5%] w-[55%] h-[55%] rounded-full bg-purple-600/10 blur-[140px]"
      />

      <motion.div
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -50, 40, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] -right-[10%] w-[45%] h-[45%] rounded-full bg-pink-500/5 blur-[100px]"
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.03)_0%,transparent_70%)]" />
    </div>
  );
}
