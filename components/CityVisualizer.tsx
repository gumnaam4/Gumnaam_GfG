
import React, { useRef, useEffect } from 'react';
import { Road, UrbanBlock, ZoneType, RoadLevel } from '../types';

interface VisualizerProps {
  roads: Road[];
  blocks: UrbanBlock[];
}

export const CityVisualizer: React.FC<VisualizerProps> = ({ roads, blocks }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dynamic scale to fit
    const padding = 50;
    const scale = Math.min((canvas.width - padding*2) / 2000, (canvas.height - padding*2) / 2000);
    ctx.translate(canvas.width / 2 - (1000 * scale), canvas.height / 2 - (1000 * scale));
    ctx.scale(scale, scale);

    // 1. Draw Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 2000, 2000);

    // 2. Draw Zones (Blocks)
    blocks.forEach(block => {
      ctx.beginPath();
      ctx.moveTo(block.points[0].x, block.points[0].y);
      block.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      switch(block.zone) {
        case ZoneType.GREEN: ctx.fillStyle = '#065f46'; break;
        case ZoneType.COMMERCIAL: ctx.fillStyle = '#1e3a8a'; break;
        case ZoneType.RESIDENTIAL: ctx.fillStyle = '#334155'; break;
        default: ctx.fillStyle = '#1f2937';
      }
      ctx.fill();
    });

    // 3. Draw Roads
    roads.sort((a,b) => b.level - a.level).forEach(road => {
      ctx.beginPath();
      ctx.moveTo(road.start.x, road.start.y);
      ctx.lineTo(road.end.x, road.end.y);
      
      let color = '#475569';
      if (road.level === RoadLevel.HIGHWAY) color = '#94a3b8';
      else if (road.level === RoadLevel.ARTERIAL) color = '#64748b';
      
      ctx.strokeStyle = color;
      ctx.lineWidth = road.width;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Road markings for highway
      if (road.level === RoadLevel.HIGHWAY) {
        ctx.setLineDash([10, 15]);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 4. Draw Buildings with pseudo-3D shading
    blocks.forEach(block => {
      block.buildings.forEach(b => {
        // Base
        ctx.fillStyle = b.zone === ZoneType.COMMERCIAL ? '#3b82f6' : '#64748b';
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Height shadow/shading (Simulate height levels)
        for (let i = 1; i <= b.levels; i++) {
          const offset = i * 1.2;
          ctx.fillStyle = b.zone === ZoneType.COMMERCIAL ? 
            `rgba(59, 130, 246, ${0.1 + (i/b.levels)*0.5})` : 
            `rgba(148, 163, 184, ${0.1 + (i/b.levels)*0.4})`;
          
          ctx.fillRect(b.x - offset, b.y - offset, b.width, b.height);
          
          // Roof edge
          if (i === Math.floor(b.levels)) {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(b.x - offset, b.y - offset, b.width, b.height);
          }
        }
      });
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        draw();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [roads, blocks]);

  return (
    <div className="w-full h-full overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="cursor-move" />
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1">
        <div className="bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-700 text-[10px] space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>COMMERCIAL HUB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-600 rounded"></div>
            <span>RESIDENTIAL BLOCK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-800 rounded"></div>
            <span>GREEN PRESERVE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-slate-400"></div>
            <span>HIGHWAY SYSTEM</span>
          </div>
        </div>
        <span className="text-slate-500 text-[10px] font-mono">Render engine: Canvas2D / L-System Grammar v2.0</span>
      </div>
    </div>
  );
};
