import React from 'react';

interface PlacaMercosulProps {
  placa: string;
  className?: string;
}

export function PlacaMercosul({ placa, className = '' }: PlacaMercosulProps) {
  if (!placa || placa === '-') return <span className="text-slate-500">-</span>;

  // Format the plate string nicely (uppercase, no spaces/hyphens for standard display)
  const cleanPlaca = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // If the plate does not look like a standard alphanumeric code, just render as raw text
  if (cleanPlaca.length < 5) {
    return <span className="font-mono font-bold text-white text-xs">{placa}</span>;
  }

  return (
    <div
      className={`inline-flex flex-col rounded-[5px] border-[1.5px] border-slate-300 bg-white text-black overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.6)] font-sans select-none ${className}`}
      style={{
        width: '105px',
        height: '34px',
        minWidth: '105px',
      }}
      title={placa}
    >
      {/* Blue Top Bar */}
      <div className="bg-[#002B6D] text-white flex items-center justify-between px-1 h-[9px] w-full border-b-[0.5px] border-blue-900">
        {/* Mercosul Emblem (Simplified representation as beautiful dots/stars) */}
        <div className="flex items-center space-x-0.5 scale-75 opacity-90">
          <span className="w-1 h-1 rounded-full bg-white block animate-pulse"></span>
          <span className="w-0.5 h-0.5 rounded-full bg-white block"></span>
          <span className="w-0.5 h-0.5 rounded-full bg-white block"></span>
        </div>

        {/* BRASIL Text */}
        <span 
          className="text-white font-extrabold uppercase tracking-widest text-[5px] select-none text-center"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          BRASIL
        </span>

        {/* Brazil Flag Badge */}
        <div className="flex items-center h-[5px] w-[7px] border-[0.5px] border-yellow-400 overflow-hidden rounded-[1px] scale-90">
          <div className="bg-emerald-600 h-full w-full relative flex items-center justify-center">
            {/* Diamond */}
            <div className="absolute w-2 h-2 bg-yellow-400 rotate-45 scale-[0.6]"></div>
            {/* Circle */}
            <div className="absolute w-1 h-1 bg-blue-800 rounded-full scale-[0.5]"></div>
          </div>
        </div>
      </div>

      {/* Plate Code Section */}
      <div className="flex-1 bg-gradient-to-b from-slate-50 to-white flex items-center justify-center relative px-1">
        {/* Subtle holographic watermark effect or glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30 pointer-events-none" />
        
        {/* Plate Text (styled precisely to look like the FE-Schrift or official Brazilian font) */}
        <span
          className="font-black text-center text-[15px] leading-none tracking-tight text-slate-900 drop-shadow-[0.5px_0.5px_0px_rgba(255,255,255,0.8)]"
          style={{
            fontFamily: '"Courier New", Courier, monospace, sans-serif',
            letterSpacing: '0.5px',
            textShadow: '0.3px 0.3px 0px rgba(0,0,0,0.15)',
          }}
        >
          {cleanPlaca}
        </span>
      </div>
    </div>
  );
}
