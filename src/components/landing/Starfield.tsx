import { useEffect, useRef } from 'react';

interface StarfieldProps {
  starColor?: string;
  speed?: number;
  quantity?: number;
  easing?: number;
}

export function Starfield({
  starColor = 'rgba(255,255,255,0.8)',
  speed = 0.5,
  quantity = 400,
  easing = 1,
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const mouse = useRef({ x: 0, y: 0 });
  const cursor = useRef({ x: 0, y: 0 });

  const sd = useRef({
    w: 0,
    h: 0,
    ctx: null as CanvasRenderingContext2D | null,
    cw: 0,
    ch: 0,
    x: 0,
    y: 0,
    z: 0,
    star: { colorRatio: 0, arr: [] as number[][] },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = quantity / 2;

    const measureViewport = () => {
      const el = canvas.parentElement;
      if (!el) return;
      sd.current.w = el.clientWidth;
      sd.current.h = el.clientHeight;
      sd.current.x = Math.round(sd.current.w / 2);
      sd.current.y = Math.round(sd.current.h / 2);
      sd.current.z = (sd.current.w + sd.current.h) / 2;
      sd.current.star.colorRatio = 1 / sd.current.z;

      if (cursor.current.x === 0 || cursor.current.y === 0) {
        cursor.current.x = sd.current.x;
        cursor.current.y = sd.current.y;
      }
      if (mouse.current.x === 0 || mouse.current.y === 0) {
        mouse.current.x = cursor.current.x - sd.current.x;
        mouse.current.y = cursor.current.y - sd.current.y;
      }
    };

    const setupCanvas = () => {
      measureViewport();
      sd.current.ctx = canvas.getContext('2d');
      canvas.width = sd.current.w;
      canvas.height = sd.current.h;
      if (sd.current.ctx) {
        sd.current.ctx.strokeStyle = starColor;
      }
    };

    const bigBang = () => {
      if (sd.current.star.arr.length !== quantity) {
        sd.current.star.arr = Array.from({ length: quantity }, () => [
          Math.random() * sd.current.w * 2 - sd.current.x * 2,
          Math.random() * sd.current.h * 2 - sd.current.y * 2,
          Math.round(Math.random() * sd.current.z),
          0, 0, 0, 0,
          1, // visible flag
        ]);
      }
    };

    const resize = () => {
      const el = canvas.parentElement;
      if (!el) return;

      const newW = el.clientWidth;
      const newH = el.clientHeight;

      if (newW === sd.current.w && newH === sd.current.h) return;

      // Update viewport dimensions
      sd.current.w = newW;
      sd.current.h = newH;
      sd.current.x = Math.round(newW / 2);
      sd.current.y = Math.round(newH / 2);
      sd.current.z = (newW + newH) / 2;
      sd.current.star.colorRatio = 1 / sd.current.z;

      // Resize canvas
      if (sd.current.ctx) {
        sd.current.ctx.canvas.width = newW;
        sd.current.ctx.canvas.height = newH;
        sd.current.ctx.strokeStyle = starColor;
      }

      // Re-center cursor to prevent directional drift
      cursor.current.x = sd.current.x;
      cursor.current.y = sd.current.y;

      // Clamp star depths to new range so no stars become invisible
      for (const star of sd.current.star.arr) {
        if (star[2] > sd.current.z) {
          star[2] = Math.random() * sd.current.z;
        }
      }
    };

    const update = () => {
      mouse.current.x = (cursor.current.x - sd.current.x) / easing;
      mouse.current.y = (cursor.current.y - sd.current.y) / easing;

      sd.current.star.arr = sd.current.star.arr.map((star) => {
        const ns = [...star];
        ns[7] = 1;
        ns[5] = ns[3];
        ns[6] = ns[4];
        ns[0] += mouse.current.x >> 4;

        if (ns[0] > sd.current.x << 1) { ns[0] -= sd.current.w << 1; ns[7] = 0; }
        if (ns[0] < -sd.current.x << 1) { ns[0] += sd.current.w << 1; ns[7] = 0; }

        ns[1] += mouse.current.y >> 4;
        if (ns[1] > sd.current.y << 1) { ns[1] -= sd.current.h << 1; ns[7] = 0; }
        if (ns[1] < -sd.current.y << 1) { ns[1] += sd.current.h << 1; ns[7] = 0; }

        ns[2] -= speed;
        if (ns[2] > sd.current.z) { ns[2] -= sd.current.z; ns[7] = 0; }
        if (ns[2] < 0) { ns[2] += sd.current.z; ns[7] = 0; }

        ns[3] = sd.current.x + (ns[0] / ns[2]) * ratio;
        ns[4] = sd.current.y + (ns[1] / ns[2]) * ratio;
        return ns;
      });
    };

    const draw = () => {
      const ctx = sd.current.ctx;
      if (!ctx) return;

      ctx.clearRect(0, 0, sd.current.w, sd.current.h);
      ctx.strokeStyle = starColor;

      for (const star of sd.current.star.arr) {
        if (
          star[5] > 0 &&
          star[5] < sd.current.w &&
          star[6] > 0 &&
          star[6] < sd.current.h &&
          star[7]
        ) {
          ctx.lineWidth = (1 - sd.current.star.colorRatio * star[2]) * 2;
          ctx.beginPath();
          ctx.moveTo(star[5], star[6]);
          ctx.lineTo(star[3], star[4]);
          ctx.stroke();
          ctx.closePath();
        }
      }
    };

    const animate = () => {
      resize();
      update();
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    setupCanvas();
    bigBang();
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [starColor, speed, quantity, easing]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
