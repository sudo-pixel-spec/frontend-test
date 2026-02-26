"use client";
import { useEffect, useState } from "react";

export function useCooldown(seconds: number) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [left]);

  return {
    left,
    start: () => setLeft(seconds),
    running: left > 0,
  };
}