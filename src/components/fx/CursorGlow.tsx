"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveMouse = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", moveMouse);
    return () => window.removeEventListener("mousemove", moveMouse);
  }, [mouseX, mouseY]);

  return (
    <>
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="fixed top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full z-50 pointer-events-none mix-blend-screen opacity-60 blur-[1px]"
      />

      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full z-40 pointer-events-none mix-blend-soft-light opacity-30 bg-[radial-gradient(circle,rgba(34,211,238,0.15)_0%,transparent_70%)]"
      >
         <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_60%)]" />
      </motion.div>
    </>
  );
}