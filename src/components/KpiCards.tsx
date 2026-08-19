import React from 'react';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  LayoutGrid,
} from 'lucide-react';
import { useOccurrencesStats } from '../lib/occurrencesStore';

interface KpiCardsProps {
  onCardClick?: (type: string) => void;
}

export function KpiCards({ onCardClick }: KpiCardsProps) {
  const stats = useOccurrencesStats();

  const cards = [
    {
      id: 'ocorrencias',
      title: 'OCORRÊNCIAS HOJE',
      value: String(stats.total24h).padStart(2, '0'),
      change: 'Últimas 24 Horas',
      changeColor: stats.total24h > 0 ? 'text-[#c9a265]' : 'text-[#94a3b8]',
      icon: Briefcase,
      iconBg: 'bg-[#241e15] border-[#c9a265]/40 text-[#c9a265]',
    },
    {
      id: 'resolvido',
      title: 'OCORRÊNCIAS RESOLVIDAS',
      value: String(stats.resolvidos).padStart(2, '0'),
      change: 'Status Resolvido',
      changeColor: 'text-[#34d399]',
      icon: CheckCircle2,
      iconBg: 'bg-[#10241e] border-[#10b981]/40 text-[#34d399]',
    },
    {
      id: 'acompanhar',
      title: 'ACOMPANHAR',
      value: String(stats.acompanhar).padStart(2, '0'),
      change: 'Em Monitoramento',
      changeColor: 'text-[#60a5fa]',
      icon: AlertTriangle,
      iconBg: 'bg-[#101f30] border-[#3b82f6]/40 text-[#60a5fa]',
    },
    {
      id: 'para_conhecimento',
      title: 'PARA CONHECIMENTO',
      value: String(stats.paraConhecimento).padStart(2, '0'),
      change: 'Informativos',
      changeColor: 'text-[#94a3b8]',
      icon: Info,
      iconBg: 'bg-[#1a202c] border-[#64748b]/40 text-[#94a3b8]',
    },
    {
      id: 'atencao',
      title: 'ATENÇÃO',
      value: String(stats.atencao).padStart(2, '0'),
      change: 'Ponto Crítico',
      changeColor: 'text-[#fbbf24]',
      icon: AlertCircle,
      iconBg: 'bg-[#291e10] border-[#f59e0b]/40 text-[#fbbf24]',
    },
    {
      id: 'registro_grid',
      title: 'REGISTRADO NO GRID',
      value: String(stats.registroGrid).padStart(2, '0'),
      change: 'Sistema Grid',
      changeColor: 'text-[#c084fc]',
      icon: LayoutGrid,
      iconBg: 'bg-[#22182d] border-[#a855f7]/40 text-[#c084fc]',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 2xl:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            className="bg-[#151b26] border border-[#1f2737] hover:border-[#c9a265]/60 p-3.5 2xl:p-4 rounded-2xl shadow-xl transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer flex flex-col justify-between min-h-[105px] 2xl:min-h-[115px]"
          >
            {/* Header: Title on Left, Icon on Right */}
            <div className="flex items-start justify-between space-x-2">
              <span className="text-[10px] 2xl:text-[11px] font-bold text-[#94a3b8] tracking-wider uppercase leading-snug block">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 2xl:w-9 2xl:h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${card.iconBg} shadow-sm group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
              </div>
            </div>

            {/* Bottom Row: Large Value + Subtitle */}
            <div className="mt-3 flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-xl 2xl:text-2xl font-black text-white font-mono tracking-tight leading-none">
                {card.value}
              </span>
              <span className={`text-[9.5px] 2xl:text-[10.5px] font-semibold whitespace-nowrap ${card.changeColor}`}>
                {card.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
