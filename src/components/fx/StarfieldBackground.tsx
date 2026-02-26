"use client";

import React, { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number; r: number; vx: number; vy: number; tw: number };
type ShootingStar = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number };

export default function StarfieldBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const stars: Star[] = [];
    const shooters: ShootingStar[] = [];

    const STAR_COUNT = 240;

    let mx = 0;
    let my = 0;

    const dustCanvas = document.createElement("canvas");
    const dustCtx = dustCanvas.getContext("2d");

    const makeDust = () => {
      if (!dustCtx) return;
      const dw = Math.max(360, Math.floor(w / 2));
      const dh = Math.max(360, Math.floor(h / 2));
      dustCanvas.width = dw;
      dustCanvas.height = dh;

      const img = dustCtx.createImageData(dw, dh);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random();
        const alpha = v > 0.985 ? Math.floor(30 + Math.random() * 50) : 0;
        img.data[i + 0] = 255;
        img.data[i + 1] = 255;
        img.data[i + 2] = 255;
        img.data[i + 3] = alpha;
      }
      dustCtx.putImageData(img, 0, 0);
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      makeDust();
    };

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const resetStar = (s: Star) => {
      s.x = rand(0, w);
      s.y = rand(0, h);
      s.z = rand(0.18, 1);
      s.r = rand(0.55, 1.9) * s.z;
      s.vx = rand(-0.08, 0.08) * s.z;
      s.vy = rand(0.03, 0.20) * s.z;
      s.tw = rand(0, Math.PI * 2);
    };

    for (let i = 0; i < STAR_COUNT; i++) {
      const s: Star = { x: 0, y: 0, z: 1, r: 1, vx: 0, vy: 0, tw: 0 };
      resetStar(s);
      stars.push(s);
    }

    const onMove = (e: PointerEvent) => {
      if (w === 0 || h === 0) return;
      mx = (e.clientX / w - 0.5) * 2;
      my = (e.clientY / h - 0.5) * 2;
    };

    const spawnShootingStar = () => {
      const fromLeft = Math.random() < 0.5;
      const x = fromLeft ? rand(-w * 0.2, w * 0.2) : rand(w * 0.8, w * 1.2);
      const y = rand(-h * 0.1, h * 0.4);

      const speed = rand(14, 22);
      const angle = fromLeft ? rand(Math.PI * 0.15, Math.PI * 0.35) : rand(Math.PI * 0.65, Math.PI * 0.85);
      const vx = Math.cos(angle) * speed * (fromLeft ? 1 : -1);
      const vy = Math.sin(angle) * speed;

      const maxLife = rand(18, 28);

      shooters.push({ x, y, vx, vy, life: 0, maxLife });
    };

    const drawBackground = () => {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.38, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
      g.addColorStop(0, "rgba(14, 20, 46, 0.60)");
      g.addColorStop(1, "rgba(3, 6, 18, 1)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, w, h);

      if (dustCtx) {
        ctx.save();
        ctx.globalAlpha = 0.20;
        const dx = mx * 10;
        const dy = my * 8;
        ctx.drawImage(dustCanvas, dx, dy, dustCanvas.width, dustCanvas.height);
        ctx.drawImage(dustCanvas, dx - dustCanvas.width, dy, dustCanvas.width, dustCanvas.height);
        ctx.drawImage(dustCanvas, dx, dy - dustCanvas.height, dustCanvas.width, dustCanvas.height);
        ctx.restore();
      }
    };

    const drawStars = () => {
      for (const s of stars) {
        s.tw += 0.02 * s.z;
        const twinkle = 0.55 + Math.sin(s.tw) * 0.35;

        s.x += s.vx + mx * 0.12 * s.z;
        s.y += s.vy + my * 0.06 * s.z;

        if (s.y > h + 10 || s.x < -10 || s.x > w + 10) resetStar(s);

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.55 * twinkle})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawShootingStars = () => {
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.life += 1;
        sh.x += sh.vx;
        sh.y += sh.vy;

        const t = sh.life / sh.maxLife;
        const alpha = (1 - t) * 0.9;

        const tail = 160;
        const tx = sh.x - (sh.vx / 22) * tail;
        const ty = sh.y - (sh.vy / 22) * tail;

        const grad = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(0.35, `rgba(255,255,255,${alpha * 0.35})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");

        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (sh.life >= sh.maxLife || sh.x < -400 || sh.x > w + 400 || sh.y > h + 400) {
          shooters.splice(i, 1);
        }
      }
    };

    const draw = () => {
      drawBackground();
      drawStars();

      if (Math.random() < 0.007 && shooters.length < 2) spawnShootingStar();

      drawShootingStars();
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 -z-10" />;
}