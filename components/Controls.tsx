
import React, { useState } from 'react';
import { CityConfig } from '../types';

interface ControlsProps {
  config: CityConfig;
  onChange: (config: CityConfig) => void;
  onGenerate: () => void;
  onInterpret: (intent: string) => void;
  isGenerating: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ config, onChange, onGenerate, onInterpret, isGenerating }) => {
  const [intent, setIntent] = useState(config.semanticIntent);

  const handleChange = (key: keyof CityConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="fixed top-0 left-0 w-80 h-full bg-slate-900/90 backdrop-blur-md border-r border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto z-10">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
        <h1 className="text-xl font-bold tracking-tight text-white">AuraUrban <span className="text-blue-400">Pro</span></h1>
      </div>

      <section className="space-y-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Semantic Planning</label>
        <div className="space-y-2">
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
            placeholder="e.g. Eco-friendly business hub with lots of parks..."
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
          />
          <button
            onClick={() => onInterpret(intent)}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 transition-colors py-2 rounded-lg text-sm font-medium"
          >
            Apply Urban Intent
          </button>
        </div>
      </section>

      <section className="space-y-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Physical Constraints</label>
        
        <ControlItem label="Pop. Density" value={config.populationDensity} min={0.1} max={1} step={0.05} 
          onChange={(v) => handleChange('populationDensity', v)} />
        
        <ControlItem label="Green Space" value={config.greenRatio} min={0} max={0.8} step={0.05} 
          onChange={(v) => handleChange('greenRatio', v)} />
        
        <ControlItem label="Comm. Zone" value={config.commercialRatio} min={0} max={0.8} step={0.05} 
          onChange={(v) => handleChange('commercialRatio', v)} />
        
        <ControlItem label="Road Complexity" value={config.roadComplexity} min={0.1} max={1} step={0.1} 
          onChange={(v) => handleChange('roadComplexity', v)} />

        <ControlItem label="Skyline Variation" value={config.skylineVariation} min={0} max={1} step={0.1} 
          onChange={(v) => handleChange('skylineVariation', v)} />
      </section>

      <div className="mt-auto pt-6 flex flex-col gap-3">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 transition-all py-3 rounded-lg font-bold flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2 animate-pulse">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Building City...
            </span>
          ) : 'GENERATE URBAN MAP'}
        </button>
        <p className="text-[10px] text-center text-slate-500 italic">Deterministic seed: {config.seed}</p>
      </div>
    </div>
  );
};

const ControlItem = ({ label, value, min, max, step, onChange }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs">
      <span className="text-slate-300">{label}</span>
      <span className="text-blue-400 font-mono">{(value * 100).toFixed(0)}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
  </div>
);
