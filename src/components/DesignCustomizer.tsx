/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QRDesignConfig, QRPatternStyle, QREyeStyle, QRErrorCorrectionLevel } from '../types';
import { PRESET_TEMPLATES } from '../utils/defaultTemplates';
import { BRAND_ICONS } from '../utils/brandIcons';
import { 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  Layers, 
  HelpCircle, 
  Plus, 
  X, 
  Maximize2,
  Minimize2,
  Type,
  FolderOpen
} from 'lucide-react';

interface DesignCustomizerProps {
  config: QRDesignConfig;
  onChange: (newConfig: QRDesignConfig) => void;
}

export default function DesignCustomizer({ config, onChange }: DesignCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'shapes' | 'logo' | 'label' | 'advanced'>('presets');

  const updateConfig = (fields: Partial<QRDesignConfig>) => {
    onChange({ ...config, ...fields });
  };

  const updateForeground = (fields: Partial<QRDesignConfig['foreground']>) => {
    onChange({
      ...config,
      foreground: { ...config.foreground, ...fields },
    });
  };

  const updateLogo = (fields: Partial<QRDesignConfig['logo']>) => {
    onChange({
      ...config,
      logo: { ...config.logo, ...fields },
    });
  };

  const updateLabel = (fields: Partial<NonNullable<QRDesignConfig['label']>>) => {
    onChange({
      ...config,
      label: {
        text: config.label?.text || '',
        fontSize: config.label?.fontSize || 20,
        color: config.label?.color || '#000000',
        fontFamily: config.label?.fontFamily || 'sans-serif',
        ...fields,
      },
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        updateLogo({ src: event.target.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden" id="design-customizer">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-650 text-indigo-600" />
          <h2 className="text-md font-semibold text-slate-800">QR Styling Studio</h2>
        </div>
        <div className="text-xs bg-slate-100 text-slate-655 text-slate-600 px-2 py-1 rounded font-mono">
          Interactive Design
        </div>
      </div>

      {/* Vertical tabs & panels split */}
      <div className="flex flex-1 overflow-hidden min-h-[480px]">
        {/* Tabs sidebar */}
        <div className="w-20 sm:w-28 bg-slate-50/50 border-r border-slate-200 flex flex-col py-2 select-none">
          {[
            { id: 'presets', label: 'Presets', icon: Sparkles },
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'shapes', label: 'Shapes', icon: Layers },
            { id: 'logo', label: 'Logo', icon: ImageIcon },
            { id: 'label', label: 'Label', icon: Type },
            { id: 'advanced', label: 'Format', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 flex flex-col items-center gap-1.5 border-l-2 text-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/40 border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-100/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] sm:text-xs tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel Content (Scrollable) */}
        <div className="flex-1 p-5 overflow-y-auto max-h-[600px] text-slate-600 space-y-5">
          {/* Presets Panel */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-850 text-slate-800 mb-1">Click a Preset to Apply</h3>
                <p className="text-xs text-slate-500">Instantly restyle foreground gradients, custom node structures, and eye patterns.</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 bg-transparent">
                {PRESET_TEMPLATES.map((tpl) => {
                  const isCurrent = config.id === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => onChange({ ...tpl, id: tpl.id })}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50/45 border-indigo-500 text-slate-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2 text-slate-800">
                          {tpl.name}
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-indigo-550 bg-indigo-600 animate-pulse"></span>}
                        </div>
                        <div className="text-[11px] text-slate-550 text-slate-500 mt-0.5 capitalize font-sans">
                          {tpl.patternStyle} nodes • {tpl.eyeStyleOuter} corners
                        </div>
                      </div>
                      
                      {/* Mini Swatch representation */}
                      <div className="flex items-center gap-1 border border-slate-200 p-1.5 rounded-lg bg-slate-50/80">
                        <div 
                          className="w-4 h-4 rounded-full shadow-xs" 
                          style={{
                            background: tpl.foreground.type === 'solid' 
                              ? tpl.foreground.solidColor 
                              : `linear-gradient(45deg, ${tpl.foreground.gradientColor1}, ${tpl.foreground.gradientColor2})`
                          }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-200" 
                          style={{ backgroundColor: tpl.background === 'transparent' ? '#cbd5e1' : tpl.background }}
                          title={tpl.background === 'transparent' ? 'Transparent background' : tpl.background}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colors Panel */}
          {activeTab === 'colors' && (
            <div className="space-y-5">
              {/* Foreground Color Config */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-600">Foreground Theme</label>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner-sm">
                  <button
                    onClick={() => updateForeground({ type: 'solid' })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      config.foreground.type === 'solid'
                        ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Solid Color
                  </button>
                  <button
                    onClick={() => updateForeground({ type: 'gradient' })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      config.foreground.type === 'gradient'
                        ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Vibrant Gradient
                  </button>
                </div>

                {config.foreground.type === 'solid' ? (
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="color"
                      value={config.foreground.solidColor}
                      onChange={(e) => updateForeground({ solidColor: e.target.value })}
                      className="w-10 h-10 rounded border border-slate-200 cursor-pointer bg-transparent"
                    />
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Solid Hex Color</div>
                      <input
                        type="text"
                        value={config.foreground.solidColor}
                        onChange={(e) => updateForeground({ solidColor: e.target.value })}
                        className="bg-transparent border-0 text-sm focus:outline-none text-slate-700 uppercase font-mono w-full mt-0.5"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 border border-slate-200 p-2 rounded bg-white">
                        <input
                          type="color"
                          value={config.foreground.gradientColor1}
                          onChange={(e) => updateForeground({ gradientColor1: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer bg-transparent"
                        />
                        <div className="min-w-0">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start</span>
                          <span className="text-xs uppercase font-mono text-slate-700">{config.foreground.gradientColor1}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border border-slate-200 p-2 rounded bg-white">
                        <input
                          type="color"
                          value={config.foreground.gradientColor2}
                          onChange={(e) => updateForeground({ gradientColor2: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer bg-transparent"
                        />
                        <div className="min-w-0">
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">End</span>
                          <span className="text-xs uppercase font-mono text-slate-700">{config.foreground.gradientColor2}</span>
                        </div>
                      </div>
                    </div>

                    {/* Gradient Type */}
                    <div className="space-y-1.5">
                      <span className="text-xs text-slate-500 font-semibold">Gradient Flow Style</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateForeground({ gradientType: 'linear' })}
                          className={`flex-1 py-1 px-2 text-xs border rounded transition-all cursor-pointer ${
                            config.foreground.gradientType === 'linear'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Linear
                        </button>
                        <button
                          onClick={() => updateForeground({ gradientType: 'radial' })}
                          className={`flex-1 py-1 px-2 text-xs border rounded transition-all cursor-pointer ${
                            config.foreground.gradientType === 'radial'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Radial
                        </button>
                      </div>
                    </div>

                    {/* Gradient Rotation */}
                    {config.foreground.gradientType === 'linear' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Angle Rotation</span>
                          <span>{config.foreground.gradientRotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={config.foreground.gradientRotation}
                          onChange={(e) => updateForeground({ gradientRotation: Number(e.target.value) })}
                          className="w-full accent-indigo-600 bg-slate-200 h-1 rounded-lg cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Background Color Config */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-600">QR Background</label>
                <div className="flex items-center justify-between gap-3 p-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bg-transparent"
                      checked={config.background === 'transparent'}
                      onChange={(e) => {
                        updateConfig({ background: e.target.checked ? 'transparent' : '#FFFFFF' });
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-white cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="bg-transparent" className="text-xs text-slate-500 font-medium cursor-pointer select-none">
                      Transparent (Great for overlaying on mockups)
                    </label>
                  </div>
                </div>

                {config.background !== 'transparent' && (
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="color"
                      value={config.background}
                      onChange={(e) => updateConfig({ background: e.target.value })}
                      className="w-10 h-10 rounded border border-slate-200 cursor-pointer bg-transparent"
                    />
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Background Hex Color</div>
                      <input
                        type="text"
                        value={config.background}
                        onChange={(e) => updateConfig({ background: e.target.value })}
                        className="bg-transparent border-0 text-sm focus:outline-none text-slate-700 uppercase font-mono w-full mt-0.5"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shapes Panel */}
          {activeTab === 'shapes' && (
            <div className="space-y-5">
              {/* Pattern Style */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-600">Datatiles (Dots / Nodes)</label>
                <p className="text-xs text-slate-500 -mt-1">Controls the geometry of individual dark modules.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'squares', label: 'Classic Square', desc: 'Sharp edges representation' },
                    { id: 'dots', label: 'Vibrant Circle', desc: 'Isolated perfect spheres' },
                    { id: 'smooth', label: 'Organic Smooth', desc: 'Subtle boundary rounding' },
                    { id: 'extra-rounded', label: 'Heavy Pill', desc: 'Fluid continuous nodes' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateConfig({ patternStyle: style.id as QRPatternStyle })}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                        config.patternStyle === style.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-semibold text-slate-800">{style.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Eye Corners */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-600">Outer Finder Eyes</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'square', label: 'Square Frame' },
                    { id: 'rounded', label: 'Rounded Square' },
                    { id: 'circle', label: 'Circle Ring' },
                    { id: 'leaf', label: 'Leaf Core Shape' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateConfig({ eyeStyleOuter: style.id as QREyeStyle })}
                      className={`p-2 text-center rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        config.eyeStyleOuter === style.id
                          ? 'border-indigo-500 bg-indigo-550 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eye Inner */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-600">Inner Eyeball Core</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'square', label: 'Square' },
                    { id: 'rounded', label: 'Soft Rect' },
                    { id: 'circle', label: 'Circular Dot' },
                    { id: 'leaf', label: 'Leaf Point' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateConfig({ eyeStyleInner: style.id as QREyeStyle })}
                      className={`p-2 text-center rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        config.eyeStyleInner === style.id
                          ? 'border-indigo-500 bg-indigo-550 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Logo Panel */}
          {activeTab === 'logo' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Center Emblem / Brand Logo</h3>
                <p className="text-xs text-slate-500 mt-0.5 animate-fadeIn">Places a beautiful vector element in the middle. Data clusters are automatically masked to safeguard scanning capability.</p>
              </div>

              {/* Selected Logo Actions */}
              {config.logo.src ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center border border-slate-200 shadow-xs">
                      <img src={config.logo.src} alt="Active Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="text-xs text-indigo-600 font-bold block">Custom Logo Active</span>
                      <span className="block text-[10px] text-slate-500">Mask applied smoothly</span>
                    </div>
                  </div>
                  <button
                    onClick={() => updateLogo({ src: '' })}
                    className="p-1 px-2.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100/50 border border-rose-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50">
                  <FolderOpen className="w-6 h-6 text-slate-400 mb-1.5" />
                  <span className="text-xs text-slate-500 font-medium">No Custom Logo Loaded</span>
                  <label className="mt-2 text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-1 px-3 rounded-lg cursor-pointer transition-all font-semibold">
                    Upload PNG / SVG
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Default icons palette */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Quick-emblems</span>
                <div className="grid grid-cols-4 gap-2">
                  {BRAND_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      onClick={() => updateLogo({ src: icon.src })}
                      title={icon.name}
                      className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <img src={icon.src} className="w-6 h-6 object-contain" alt={icon.name} referrerPolicy="no-referrer" />
                      <span className="text-[9px] text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap w-full text-center">
                        {icon.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customizing active logo layout */}
              {config.logo.src && (
                <div className="space-y-3.5 pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-xl">
                  {/* Shape */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-semibold">Emblem Shield Silhouette</span>
                    <div className="flex gap-1.5">
                      {['circle', 'rounded', 'square'].map((shape) => (
                        <button
                          key={shape}
                          onClick={() => updateLogo({ shape: shape as any })}
                          className={`flex-1 py-1 text-xs border rounded capitalize transition-all cursor-pointer ${
                            config.logo.shape === shape
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sizing scale */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Proportional Scale (10% - 30%)</span>
                      <span>{Math.round(config.logo.scale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.28"
                      step="0.02"
                      value={config.logo.scale}
                      onChange={(e) => updateLogo({ scale: Number(e.target.value) })}
                      className="w-full accent-indigo-650 accent-indigo-600 bg-slate-250 bg-slate-200 h-1 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-yellow-500/85 block">
                      Note: High Scale (&gt;20%) is readable only with High (H) Error Correct.
                    </span>
                  </div>

                  {/* Shield Color */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                    <span className="text-slate-500 font-semibold">Shield Fill Color</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.logo.backgroundColor === 'transparent' ? '#FFFFFF' : config.logo.backgroundColor}
                        onChange={(e) => updateLogo({ backgroundColor: e.target.value })}
                        disabled={config.logo.backgroundColor === 'transparent'}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="checkbox"
                        id="transparent-logo-bg"
                        checked={config.logo.backgroundColor === 'transparent'}
                        onChange={(e) => updateLogo({ backgroundColor: e.target.checked ? 'transparent' : '#FFFFFF' })}
                        className="rounded border-slate-300 text-indigo-650 cursor-pointer w-4 h-4 focus:ring-0"
                      />
                      <label htmlFor="transparent-logo-bg" className="text-[11px] text-slate-500 cursor-pointer select-none">
                        Transparent
                      </label>
                    </div>
                  </div>

                  {/* Shield padding */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Logo Margin (Blocks)</span>
                      <span>{config.logo.padding}x</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="0.5"
                      value={config.logo.padding}
                      onChange={(e) => updateLogo({ padding: Number(e.target.value) })}
                      className="w-full accent-indigo-600 bg-slate-200 h-1 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Label Panel */}
          {activeTab === 'label' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Footer Text Label</h3>
                <p className="text-xs text-slate-500 mt-0.5">Places a sleek text header (e.g. "SCAN ME", "WI-FI CONNECT") centered beautifully in the bottom margin.</p>
              </div>

              <div className="space-y-3.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Label Text</span>
                  <input
                    type="text"
                    placeholder="e.g. SCAN ME"
                    value={config.label?.text || ''}
                    onChange={(e) => updateLabel({ text: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-705 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>

                {config.label?.text && (
                  <>
                    {/* Size */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Font Size</span>
                        <span>{config.label.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="36"
                        step="1"
                        value={config.label.fontSize}
                        onChange={(e) => updateLabel({ fontSize: Number(e.target.value) })}
                        className="w-full accent-indigo-600 bg-slate-200 h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Color */}
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                      <span className="text-slate-500 font-semibold">Color Selector</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.label.color}
                          onChange={(e) => updateLabel({ color: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-[11px] font-mono text-slate-500 uppercase">{config.label.color}</span>
                      </div>
                    </div>

                    {/* Family */}
                    <div className="space-y-1 pt-1.5 border-t border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block">Typography Font</span>
                      <select
                        value={config.label.fontFamily}
                        onChange={(e) => updateLabel({ fontFamily: e.target.value })}
                        className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="sans-serif">Modern Sans-Serif (Inter)</option>
                        <option value="serif">Elegant Serif (Playfair)</option>
                        <option value="monospace">Developer Monospace (Fira)</option>
                        <option value="fantasy">Experimental Outline</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Advanced / Format Config */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Grid Constants & Calibration</h3>
                <p className="text-xs text-slate-500 mt-0.5 animate-fadeIn">Adjust quiet buffers, grid sizing density and structural error redundancy flags.</p>
              </div>

              <div className="space-y-4 bg-slate-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                {/* Quiet Zone Margins */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Quiet Zone Margin (Modules)</span>
                    <span>{config.margin} blocks</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={config.margin}
                    onChange={(e) => updateConfig({ margin: Number(e.target.value) })}
                    className="w-full accent-indigo-650 accent-indigo-600 bg-slate-200 h-1 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    Standard recommended quiet zone distance is 3 to 4 blocks to guarantee reliable target camera identification in high contrasts.
                  </span>
                </div>

                {/* Secure Redundancy */}
                <div className="space-y-1.5 pt-3 border-t border-slate-200">
                  <label className="text-xs font-semibold text-indigo-600 block">Secure Error Correction Recovery</label>
                  <select
                    value={config.errorCorrection}
                    onChange={(e) => updateConfig({ errorCorrection: e.target.value as QRErrorCorrectionLevel })}
                    className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="L">Level L (Low ~7% restore capacity) - High speed grids</option>
                    <option value="M">Level M (Medium ~15%) - Commercial baseline standard</option>
                    <option value="Q">Level Q (High ~25%) - Better resilience</option>
                    <option value="H">Level H (Ultra ~30%) - Required if embedding brand logos</option>
                  </select>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    High error correction adds redundancy bits, increasing recovery stability if the print gets dusty, crumpled, or partially hidden.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
