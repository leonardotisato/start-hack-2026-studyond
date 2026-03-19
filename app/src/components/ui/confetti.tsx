"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

const COLORS = [
  "#f43f5e", "#8b5cf6", "#3b82f6", "#22c55e", "#eab308",
  "#f97316", "#ec4899", "#06b6d4", "#a855f7", "#14b8a6",
];

function createParticles(x: number, y: number, count: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = (Math.random() - 0.5) * Math.PI * 0.8;
    const speed = 4 + Math.random() * 8;
    const dirX = x < window.innerWidth / 2 ? 1 : -1;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed * dirX,
      vy: Math.sin(angle) * speed - 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      life: 1,
    };
  });
}

let globalFire: (() => void) | null = null;

export function fireConfetti() {
  globalFire?.();
}

export function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      p.life -= 0.012;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    if (particles.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const fire = useCallback(() => {
    const h = window.innerHeight;
    const yCenter = h * 0.4 + Math.random() * h * 0.2;
    const left = createParticles(0, yCenter, 40);
    const right = createParticles(window.innerWidth, yCenter, 40);
    particlesRef.current.push(...left, ...right);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    globalFire = fire;
    return () => {
      globalFire = null;
      cancelAnimationFrame(rafRef.current);
    };
  }, [fire]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
