
import React, { useState, useEffect, useCallback } from 'react';
import { Controls } from './components/Controls';
import { CityVisualizer } from './components/CityVisualizer';
import { CityEngine } from './engine/CityEngine';
import { CityConfig, Road, UrbanBlock } from './types';
import { interpretIntent } from './services/geminiService';

const DEFAULT_CONFIG: CityConfig = {
  populationDensity: 0.7,
  greenRatio: 0.15,
  commercialRatio: 0.25,
  residentialRatio: 0.6,
  roadComplexity: 0.5,
  skylineVariation: 0.4,
  semanticIntent: '',
  seed: 12345
};

export default function App() {
  const [config, setConfig] = useState<CityConfig>(DEFAULT_CONFIG);
  const [data, setData] = useState<{ roads: Road[], blocks: UrbanBlock[] }>({ roads: [], blocks: [] });
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(() => {
    setIsGenerating(true);
    // Use timeout to allow UI to show loading state
    setTimeout(() => {
      const engine = new CityEngine({ ...config, seed: Math.floor(Math.random() * 999999) });
      const result = engine.generate();
      setData(result);
      setIsGenerating(false);
    }, 100);
  }, [config]);

  const handleInterpret = async (intent: string) => {
    setIsGenerating(true);
    const mapped = await interpretIntent(intent);
    if (mapped) {
      const newConfig = {
        ...config,
        semanticIntent: intent,
        greenRatio: mapped.greenRatio,
        commercialRatio: mapped.commercialRatio,
        roadComplexity: mapped.roadComplexity,
        skylineVariation: mapped.maxBuildingHeight / 2, // Map height factor to variation
      };
      setConfig(newConfig);
      // Immediately regenerate with new mapped settings
      setTimeout(() => {
        const engine = new CityEngine({ ...newConfig, seed: Math.floor(Math.random() * 999999) });
        setData(engine.generate());
        setIsGenerating(false);
      }, 50);
    } else {
      setIsGenerating(false);
      alert("Failed to map intent. Please try another phrase.");
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadPNG = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `aura-urban-city-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ config, data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `city-layout-${Date.now()}.json`;
    link.href = url;
    link.click();
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden text-slate-100 bg-slate-950">
      <Controls 
        config={config} 
        onChange={setConfig} 
        onGenerate={generate} 
        onInterpret={handleInterpret}
        isGenerating={isGenerating}
      />
      
      <main className="flex-1 relative">
        <CityVisualizer roads={data.roads} blocks={data.blocks} />
        
        <div className="absolute top-6 right-6 flex gap-2">
          <button 
            onClick={downloadPNG}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 transition-colors rounded-lg border border-slate-700 text-xs font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export PNG (4K)
          </button>
          <button 
            onClick={downloadJSON}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 transition-colors rounded-lg border border-slate-700 text-xs font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            JSON Layout
          </button>
        </div>

        {isGenerating && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="text-xl font-bold tracking-tighter text-blue-400 animate-pulse uppercase">Recalculating Urban Grid...</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
