import React from 'react';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';
import { useRecentOccurrences } from '../lib/occurrencesStore';
import { STATUS_CONFIG, PlantaoStatus } from '../data/plantaoData';

interface RecentActivitiesProps {
  onSelectActivity?: (activity: any) => void;
}

export function RecentActivities({ onSelectActivity }: RecentActivitiesProps) {
  const occurrences = useRecentOccurrences(5);

  const getStatusIcon = (status: PlantaoStatus) => {
    switch (status) {
      case 'resolvido':
        return CheckCircle2;
      case 'acompanhar':
        return AlertTriangle;
      case 'para conhecimento':
        return Info;
      case 'atenção':
        return AlertCircle;
      case 'registro grid':
        return LayoutGrid;
      default:
        return Info;
    }
  };

  return (
    <div className="bg-[#151b26] border border-[#1f2737] hover:border-[#c9a265]/50 rounded-2xl p-5 flex flex-col justify-between h-full min-h-[300px] shadow-xl transition-all">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#c9a265] animate-pulse"></span>
            <h3 className="text-xs font-bold text-[#f1f5f9] uppercase tracking-wider">
              ATIVIDADES RECENTES (OCORRÊNCIAS)
            </h3>
          </div>
          <span className="text-[9px] text-[#34d399] font-bold bg-[#10241e] px-2 py-0.5 rounded-md border border-[#10b981]/40 shadow-xs">
            TEMPO REAL
          </span>
        </div>

        {/* Activity Items List */}
        {occurrences.length > 0 ? (
          <div className="space-y-2">
            {occurrences.map((item) => {
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['para conhecimento'];
              const Icon = getStatusIcon(item.status);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectActivity?.(item)}
                  className="p-3 rounded-xl bg-[#0c1017] border border-[#1f2737] hover:border-[#c9a265]/60 transition-all flex items-center justify-between cursor-pointer group shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${statusCfg.badgeBg} ${statusCfg.badgeBorder} ${statusCfg.badgeText}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#c9a265] transition-colors leading-tight">
                          {item.eventualidade || 'Ocorrência Registrada'}
                        </p>
                      </div>
                      <p className="text-[10px] text-[#94a3b8] truncate mt-0.5 font-medium flex items-center gap-1.5">
                        <span>{item.dataRegistro} {item.horaRegistro ? `às ${item.horaRegistro}` : ''}</span>
                        <span>•</span>
                        <span>Placa: <strong className="text-slate-200">{item.placa || '-'}</strong></span>
                        <span>•</span>
                        <span>Op: {item.operador || 'Operador'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="ml-2 flex-shrink-0 flex items-center space-x-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                    >
                      {statusCfg.label || item.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#c9a265] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-[210px] flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[#0c1017] border border-[#1f2737]/60">
            <div className="w-10 h-10 rounded-xl bg-[#151b26] border border-[#1f2737] flex items-center justify-center mb-2.5 text-[#c9a265]/60 shadow-xs">
              <Clock className="w-5 h-5 text-[#c9a265]" />
            </div>
            <p className="text-xs font-bold text-slate-200">Nenhuma ocorrência registrada</p>
            <p className="text-[10px] text-[#94a3b8] max-w-[220px] mt-1">
              Novas ocorrências adicionadas aparecerão aqui em tempo real.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[9.5px] font-bold text-[#34d399] bg-[#10241e] px-2 py-0.5 rounded-md border border-[#10b981]/30">
              <ShieldCheck className="w-3 h-3" />
              <span>SISTEMA ATIVO & MONITORANDO</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
