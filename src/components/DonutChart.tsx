import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useOccurrencesStats } from '../lib/occurrencesStore';

interface DonutChartProps {
  onOpenReports?: () => void;
}

export function DonutChart({ onOpenReports }: DonutChartProps) {
  const stats = useOccurrencesStats();

  const chartData = useMemo(() => {
    const items = [
      { name: 'Resolvidos', value: stats.resolvidos, itemStyle: { color: '#10b981' } },
      { name: 'Acompanhar', value: stats.acompanhar, itemStyle: { color: '#3b82f6' } },
      { name: 'Para Conhecimento', value: stats.paraConhecimento, itemStyle: { color: '#64748b' } },
      { name: 'Atenção', value: stats.atencao, itemStyle: { color: '#f59e0b' } },
      { name: 'Registrado no Grid', value: stats.registroGrid, itemStyle: { color: '#a855f7' } },
    ].filter((item) => item.value > 0);

    if (items.length === 0) {
      return [{ name: 'Nenhuma Ocorrência', value: 1, itemStyle: { color: '#1f2737' } }];
    }

    return items;
  }, [stats]);

  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#151b26',
        borderColor: '#c9a265',
        borderWidth: 1,
        padding: [6, 10],
        textStyle: {
          color: '#f1f5f9',
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
        },
        formatter: (params: any) => {
          if (params.name === 'Nenhuma Ocorrência') return 'Sem ocorrências registradas';
          return `<div>
            <span style="color:#c9a265;font-weight:bold;">${params.name}</span>: ${params.percent}% (${params.value})
          </div>`;
        },
      },
      series: [
        {
          name: 'Ocorrências',
          type: 'pie',
          radius: ['68%', '90%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 3,
            borderColor: '#151b26',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            scale: false,
          },
          data: chartData,
        },
      ],
    };
  }, [chartData]);

  const legendData = useMemo(() => {
    const total = stats.totalAllTime || 1;
    const calcPct = (val: number) =>
      stats.totalAllTime > 0 ? `${Math.round((val / total) * 100)}%` : '0%';

    return [
      { label: 'Resolvidos', val: stats.resolvidos, pct: calcPct(stats.resolvidos), color: '#10b981' },
      { label: 'Acompanhar', val: stats.acompanhar, pct: calcPct(stats.acompanhar), color: '#3b82f6' },
      { label: 'Para Conhecimento', val: stats.paraConhecimento, pct: calcPct(stats.paraConhecimento), color: '#64748b' },
      { label: 'Atenção', val: stats.atencao, pct: calcPct(stats.atencao), color: '#f59e0b' },
      { label: 'Registrado no Grid', val: stats.registroGrid, pct: calcPct(stats.registroGrid), color: '#a855f7' },
    ];
  }, [stats]);

  return (
    <div className="bg-[#151b26] border border-[#1f2737] hover:border-[#c9a265]/50 rounded-2xl p-5 flex flex-col justify-between h-full min-h-[350px] shadow-xl transition-all relative">
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#c9a265] animate-pulse"></span>
          <h3 className="text-xs font-bold text-[#f1f5f9] uppercase tracking-wider">
            ANÁLISE DE OCORRÊNCIAS
          </h3>
        </div>

        {/* Donut Chart with Center Total */}
        <div className="flex flex-col items-center justify-center my-1">
          <div className="w-36 h-36 relative flex-shrink-0">
            <ReactECharts
              option={option}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'svg' }}
            />
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl 2xl:text-3xl font-extrabold text-white font-sans leading-none">
                {String(stats.totalAllTime).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-[#94a3b8] tracking-widest uppercase font-semibold mt-0.5">
                TOTAL
              </span>
            </div>
          </div>
        </div>

        {/* Legend List */}
        <div className="mt-3 space-y-1.5 px-1">
          {legendData.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#cbd5e1] text-[11px] font-medium">{item.label}</span>
              </div>
              <span className="text-white text-[11px] font-bold">
                {item.val} ({item.pct})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
