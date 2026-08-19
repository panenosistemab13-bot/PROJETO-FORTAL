import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Truck, X, ChevronDown, Check, Building2 } from 'lucide-react';
import { INITIAL_VEHICLES_RAW } from '../data/veiculosData';
import { PlacaMercosul } from './PlacaMercosul';

interface VehiclePlateSelectProps {
  value: string;
  onChange: (plate: string, carrier?: string, fleet?: string) => void;
  placeholder?: string;
  className?: string;
}

export function VehiclePlateSelect({
  value,
  onChange,
  placeholder = 'EX: ABC-1D23 OU SELECION',
  className = '',
}: VehiclePlateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter list of vehicles from veiculosData
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return INITIAL_VEHICLES_RAW.slice(0, 50);
    return INITIAL_VEHICLES_RAW.filter(
      (v) =>
        v.plate.toLowerCase().includes(term) ||
        v.carrier.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleSelect = (plate: string, carrier: string, fleet: string) => {
    onChange(plate, carrier, fleet);
    setSearchTerm('');
    setIsOpen(false);
  };

  const selectedVehicleObj = useMemo(() => {
    if (!value) return null;
    return INITIAL_VEHICLES_RAW.find(v => v.plate.toUpperCase() === value.toUpperCase());
  }, [value]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Box */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#090d14] hover:bg-[#0d131d] border border-[#232f45] hover:border-[#c9a265]/70 focus-within:border-[#c9a265] rounded-xl cursor-pointer transition-all shadow-inner group"
      >
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <div className="p-1 rounded-lg bg-[#182030] text-[#c9a265] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Truck className="w-4 h-4 text-[#c9a265]" />
          </div>

          {value ? (
            <div className="flex items-center space-x-2.5 min-w-0">
              <PlacaMercosul placa={value} className="scale-90 origin-left flex-shrink-0" />
              {selectedVehicleObj && (
                <span className="text-xs text-[#dfbe85] font-bold truncate">
                  {selectedVehicleObj.carrier}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-mono font-bold text-slate-400 tracking-wider truncate uppercase">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchTerm('');
              }}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
              title="Limpar placa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-[#c9a265] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#c9a265]' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 sm:min-w-[340px] mt-1.5 bg-[#090d14] border border-[#2d3b55] rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-80 ring-1 ring-[#c9a265]/30">
          
          {/* Top Search bar inside dropdown */}
          <div className="p-2.5 border-b border-[#1f2a3e] bg-[#0d121c] flex items-center space-x-2.5">
            <Search className="w-4 h-4 text-[#c9a265] flex-shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por placa ou transportador..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none font-medium"
            />
            <span className="text-[10px] text-slate-300 font-mono font-bold px-2 py-0.5 bg-[#172132] border border-[#2b3a52] rounded-md flex-shrink-0">
              {filteredVehicles.length}
            </span>
          </div>

          {/* List items: APENAS PLACA E TRANSPORTADORA */}
          <div className="overflow-y-auto custom-scroll flex-1 divide-y divide-[#161f30] p-1.5">
            {filteredVehicles.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-xs text-slate-400 mb-2">Nenhum veículo encontrado para "{searchTerm}".</p>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(searchTerm.toUpperCase());
                      setIsOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#c9a265]/20 border border-[#c9a265]/40 text-[#dfbe85] text-xs font-bold hover:bg-[#c9a265]/30 transition-all cursor-pointer"
                  >
                    Usar placa digitada: "{searchTerm.toUpperCase()}"
                  </button>
                )}
              </div>
            ) : (
              filteredVehicles.map((v, idx) => {
                const isSelected = value.toUpperCase() === v.plate.toUpperCase();

                return (
                  <button
                    key={`${v.plate}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(v.plate, v.carrier, v.fleet)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between hover:bg-[#131c2c] transition-all cursor-pointer group ${
                      isSelected ? 'bg-[#1a2538] border border-[#c9a265]/60' : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      {/* 1. Placa Mercosul */}
                      <PlacaMercosul placa={v.plate} className="flex-shrink-0 shadow-md" />

                      {/* 2. Transportadora Apenas */}
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <Building2 className="w-3.5 h-3.5 text-[#c9a265] flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                          {v.carrier}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#c9a265] flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick custom plate input footer */}
          <div className="p-2.5 border-t border-[#1c2638] bg-[#0b1018] flex items-center justify-between text-[11px] text-slate-400 px-3">
            <span>Não encontrou na lista?</span>
            <button
              type="button"
              onClick={() => {
                const customPlate = prompt('Digite a placa avulsa do veículo:');
                if (customPlate && customPlate.trim()) {
                  onChange(customPlate.trim().toUpperCase());
                  setIsOpen(false);
                }
              }}
              className="text-[#dfbe85] font-bold hover:underline cursor-pointer"
            >
              + Inserir Placa Manual
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
