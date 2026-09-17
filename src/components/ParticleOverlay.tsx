import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { GRID_SIZE } from '../constants';

export interface ParticleOverlayRef {
  burst: (indices: number[]) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const COLORS = ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ffffff'];

export const ParticleOverlay = forwardRef<ParticleOverlayRef>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  const burst = useCallback((indices: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;
    const cellW = width / GRID_SIZE;
    const cellH = height / GRID_SIZE;

    const newParticles: Particle[] = [];

    indices.forEach(idx => {
      const r = Math.floor(idx / GRID_SIZE);
      const c = idx % GRID_SIZE;
      
      const centerX = (c + 0.5) * cellW;
      const centerY = (r + 0.5) * cellH;

      // Spawn 15-20 particles per crushed candy
      const count = 15 + Math.random() * 5;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2; // pixel speed
        
        newParticles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 30 + Math.random() * 20, // frames
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 4 + 2,
        });
      }
    });

    particlesRef.current.push(...newParticles);
    
    if (!animationRef.current) {
      animate();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    burst
  }));

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles: Particle[] = [];

    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.life++;

      if (p.life < p.maxLife) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // fade out
        const alpha = 1 - (p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        
        activeParticles.push(p);
      }
    });
    
    ctx.globalAlpha = 1.0;
    particlesRef.current = activeParticles;

    if (activeParticles.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = null;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      // Use offsetWidth/offsetHeight from parent
      const parent = canvas.parentElement;
      if (parent) {
        // Handle high DPI displays for crisp particles
        const dpr = window.devicePixelRatio || 1;
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
        
        // Also update css dimensions to match
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-50 pointer-events-none"
    />
  );
});
