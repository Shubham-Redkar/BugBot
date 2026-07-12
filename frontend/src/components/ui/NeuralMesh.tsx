import { type FC, useEffect, useRef } from "react";

const NeuralMesh: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const GRID = 60;
    const cols = Math.ceil(width / GRID) + 1;
    const rows = Math.ceil(height / GRID) + 1;

    // Sparks
    const sparks: { x: number; y: number; life: number; maxLife: number }[] =
      [];
    let sparkTimer = 0;

    let breathPhase = 0;
    let animId: number;

    const addSpark = () => {
      const col = Math.floor(Math.random() * cols);
      const row = Math.floor(Math.random() * rows);
      sparks.push({
        x: col * GRID,
        y: row * GRID,
        life: 0,
        maxLife: 40,
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      breathPhase += 0.008; // 4s loop ≈ 0.008 rad/frame at 60fps
      const breath = 0.3 + 0.2 * Math.sin(breathPhase); // 0.1–0.5 opacity

      // Grid lines
      ctx.strokeStyle = `rgba(68, 68, 68, ${breath * 0.6})`;
      ctx.lineWidth = 0.5;

      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * GRID, 0);
        ctx.lineTo(c * GRID, height);
        ctx.stroke();
      }
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * GRID);
        ctx.lineTo(width, r * GRID);
        ctx.stroke();
      }

      // Intersection dots
      ctx.fillStyle = `rgba(68, 68, 68, ${breath * 0.8})`;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          ctx.beginPath();
          ctx.arc(c * GRID, r * GRID, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Sparks
      sparkTimer++;
      if (sparkTimer % 45 === 0) addSpark(); // new spark every ~0.75s

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        const t = s.life / s.maxLife;
        const alpha = t < 0.5 ? t * 2 : (1 - t) * 2;
        const size = 1.5 + t * 2;

        ctx.save();
        ctx.shadowColor = "#00F5FF";
        ctx.shadowBlur = 8 * alpha;
        ctx.fillStyle = `rgba(0, 245, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (s.life >= s.maxLife) sparks.splice(i, 1);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="mesh-breathe pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.9 }}
    />
  );
};

export default NeuralMesh;
