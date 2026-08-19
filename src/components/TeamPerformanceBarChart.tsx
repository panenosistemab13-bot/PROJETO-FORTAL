import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Cake, Gift, Calendar, Sparkles, ChevronDown } from 'lucide-react';

interface CollaboratorBirth {
  id: string;
  name: string;
  shortName: string;
  birthDate: string;
  role: string;
  day: number;
  month: number;
  year?: number;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const RAW_COLLABORATORS = [
  { id: '1', name: 'AIRTON CARVALHO LEITE', birthDate: '03/02/2001', role: 'Vigilante' },
  { id: '2', name: 'AMANDA SHERYDA LEITE FREITAS', birthDate: '12/09/1998', role: 'Operadora CFTV' },
  { id: '3', name: 'ANA KAYLANNE PEREIRA FREIRE', birthDate: '07/07/2003', role: 'Assistente Operacional' },
  { id: '4', name: 'ANA PAULA SANTOS DA SILVA', birthDate: '24/11/1993', role: 'Supervisora' },
  { id: '5', name: 'ANTONIO JAIRO VIEIRA DOS SANTOS', birthDate: '26/08/1981', role: 'Inspetor de Segurança' },
  { id: '6', name: 'CAMILA VALESKA DA SILVA CARLOS', birthDate: '24/05/1994', role: 'Monitora Eletrônica' },
  { id: '7', name: 'CRISTIANE DE OLIVEIRA FIALHO', birthDate: '07/12/1983', role: 'OP MONIT ELETRONICO' },
  { id: '8', name: 'DIEGO OLIVEIRA SOUZA', birthDate: '29/06/1989', role: 'OP MONIT ELETRONICO' },
  { id: '9', name: 'FLAVIA MARIA LIMA ASEVEDO', birthDate: '06/08/1988', role: 'Analista de Risco' },
  { id: '10', name: 'FRANCISCO PINHEIRO NETO', birthDate: '17/06/1964', role: 'OP MONIT ELETRONICO' },
  { id: '11', name: 'GABRIEL VITOR BARROS LIMA', birthDate: '22/05/2001', role: 'Operador de Ronda' },
  { id: '12', name: 'GABRIELE FREIRE DE ALBUQUERQUE', birthDate: '31/03/1988', role: 'Assistente Administrativa' },
  { id: '13', name: 'HARLEY NOGUEIRA DE CASTRO', birthDate: '19/05/1988', role: 'Coordenador de Frota' },
  { id: '14', name: 'IGOR DE SOUSA PESTANA', birthDate: '10/04/2001', role: 'Vigilante Patrimonial' },
  { id: '15', name: 'JOSE ERIELITON DA SILVA', birthDate: '04/12/1991', role: 'Líder de Equipe' },
  { id: '16', name: 'JÚLIA BARROS ALVES', birthDate: '08/10/1999', role: 'Operadora CFTV' },
  { id: '17', name: 'KARINE FERNANDES SOUSA', birthDate: '13/05/2002', role: 'Assistente de Portaria' },
  { id: '18', name: 'KLEYTON ALENCAR VIDAL', birthDate: '05/02/1997', role: 'Vigilante' },
  { id: '19', name: 'LUCAS ALVES DA CRUZ', birthDate: '12/12/1997', role: 'Técnico em Segurança' },
  { id: '20', name: 'LUZIA DE OLIVEIRA FREITAS', birthDate: '23/08/1988', role: 'ASSIST MONIT ELETRONICO' },
  { id: '21', name: 'MATHEUS FREITAS DA MATA', birthDate: '07/05/2000', role: 'Operador de Monitoramento' },
  { id: '22', name: 'MYLENA DA COSTA VIEIRA', birthDate: '23/03/2003', role: 'Auxiliar de Operações' },
  { id: '23', name: 'FRANCISCO IGOR COUTINHO', birthDate: '19/08/1997', role: 'Agente de Ronda' },
];

function formatShortName(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0];
}

export function TeamPerformanceBarChart() {
  const currentMonth = new Date().getMonth() + 1; // 1-indexed (8 = Agosto)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Parse all collaborators with birthdate
  const allBirthdays: CollaboratorBirth[] = useMemo(() => {
    return RAW_COLLABORATORS.map((colab) => {
      const parts = colab.birthDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parts[2] ? parseInt(parts[2], 10) : undefined;
      return {
        ...colab,
        shortName: formatShortName(colab.name),
        day,
        month,
        year,
      };
    }).filter((c) => !isNaN(c.day) && !isNaN(c.month));
  }, []);

  // Filter for selected month
  const monthBirthdays = useMemo(() => {
    return allBirthdays
      .filter((c) => c.month === selectedMonth)
      .sort((a, b) => a.day - b.day);
  }, [allBirthdays, selectedMonth]);

  const option = useMemo(() => {
    const categories = monthBirthdays.map((c) => c.shortName);
    const values = monthBirthdays.map((c) => c.day);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(201, 162, 101, 0.15)',
          },
        },
        backgroundColor: '#151b26',
        borderColor: '#c9a265',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
          color: '#f1f5f9',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
        },
        formatter: (params: any) => {
          const item = params[0];
          const colab = monthBirthdays[item.dataIndex];
          if (!colab) return '';
          return `<div style="min-width: 180px;">
            <div style="color: #dfbe85; font-weight: bold; font-size: 12px; margin-bottom: 2px;">
              🎂 ${colab.name}
            </div>
            <div style="color: #cbd5e1; font-size: 10px; margin-bottom: 4px;">
              ${colab.role || 'Colaborador(a)'}
            </div>
            <div style="color: #38bdf8; font-weight: 600; font-size: 11px; padding-top: 4px; border-top: 1px solid #1f2737;">
              Aniversário: <strong>Dia ${colab.day < 10 ? '0' + colab.day : colab.day}/${colab.month < 10 ? '0' + colab.month : colab.month}</strong>
            </div>
          </div>`;
        },
      },
      grid: {
        top: 35,
        right: 15,
        bottom: 30,
        left: 20,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories.length > 0 ? categories : ['Nenhum Aniversariante'],
        axisLine: {
          lineStyle: { color: '#1f2737' },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#cbd5e1',
          fontSize: 10,
          fontWeight: '600',
          fontFamily: 'Inter, sans-serif',
          interval: 0,
          rotate: categories.length > 5 ? 20 : 0,
        },
      },
      yAxis: {
        type: 'value',
        min: 1,
        max: 31,
        interval: 5,
        splitLine: {
          lineStyle: {
            color: '#1f2737',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 9,
          formatter: 'Dia {value}',
        },
      },
      series: [
        {
          name: 'Dia do Mês',
          type: 'bar',
          barWidth: monthBirthdays.length > 6 ? 18 : 28,
          data: values.length > 0 ? values : [0],
          label: {
            show: true,
            position: 'top',
            color: '#dfbe85',
            fontSize: 10,
            fontWeight: 'bold',
            formatter: (p: any) => {
              if (p.value === 0) return '';
              return `Dia ${p.value < 10 ? '0' + p.value : p.value}`;
            },
          },
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f43f5e' },
              { offset: 0.4, color: '#dfbe85' },
              { offset: 1, color: '#9a6320' },
            ]),
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#fb7185' },
                { offset: 0.5, color: '#fae4be' },
                { offset: 1, color: '#c9a265' },
              ]),
            },
          },
        },
      ],
    };
  }, [monthBirthdays]);

  return (
    <div className="bg-[#151b26] border border-[#1f2737] hover:border-[#c9a265]/50 rounded-2xl p-5 flex flex-col h-full min-h-[320px] shadow-xl transition-all relative">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#c9a265]/15 border border-[#c9a265]/30 text-[#dfbe85]">
            <Cake className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-[#f1f5f9] uppercase tracking-wider">
                ANIVERSARIANTES DO MÊS
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {monthBirthdays.length} Comemorando
              </span>
            </div>
            <p className="text-[10px] text-[#94a3b8]">
              Usuários cadastrados celebrando em {MONTH_NAMES[selectedMonth - 1]}
            </p>
          </div>
        </div>

        {/* Month Selector Dropdown */}
        <div className="relative z-30">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-1.5 text-xs text-[#dfbe85] bg-[#0c1017] px-3 py-1.5 rounded-xl border border-[#c9a265]/40 hover:border-[#c9a265] font-semibold cursor-pointer transition-all shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-[#c9a265]" />
            <span>{MONTH_NAMES[selectedMonth - 1]}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#94a3b8] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 bg-[#151b26] border border-[#c9a265]/50 rounded-xl shadow-2xl py-1 z-50 max-h-56 overflow-y-auto">
              {MONTH_NAMES.map((name, idx) => {
                const monthNum = idx + 1;
                const count = allBirthdays.filter((c) => c.month === monthNum).length;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedMonth(monthNum);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex justify-between items-center hover:bg-[#1f2737] transition-colors cursor-pointer ${
                      selectedMonth === monthNum ? 'text-[#dfbe85] font-bold bg-[#1f2737]/60' : 'text-[#cbd5e1]'
                    }`}
                  >
                    <span>{name} {monthNum === currentMonth ? '(Atual)' : ''}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#0c1017] text-[#94a3b8] font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 w-full relative min-h-[190px]">
        {monthBirthdays.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#0c1017]/50 rounded-xl border border-[#1f2737]">
            <Gift className="w-8 h-8 text-[#94a3b8]/40 mb-2" />
            <p className="text-xs font-semibold text-[#94a3b8]">
              Nenhum aniversariante cadastrado em {MONTH_NAMES[selectedMonth - 1]}.
            </p>
            <button
              onClick={() => setSelectedMonth(8)}
              className="mt-2 text-[11px] text-[#c9a265] hover:underline font-bold"
            >
              Ver Aniversariantes de Agosto (4 comemorando)
            </button>
          </div>
        ) : (
          <ReactECharts
            option={option}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        )}
      </div>

      {/* Bottom User Cards Strip */}
      {monthBirthdays.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#1f2737] grid grid-cols-1 sm:grid-cols-2 gap-2">
          {monthBirthdays.map((user) => (
            <div
              key={user.id}
              className="bg-[#0c1017] border border-[#1f2737] hover:border-[#c9a265]/40 rounded-xl p-2 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#dfbe85]/30 to-[#f43f5e]/30 border border-[#c9a265]/50 flex items-center justify-center text-[10px] font-black text-amber-200 shrink-0">
                  {user.day}
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold text-white group-hover:text-[#dfbe85] transition-colors truncate">
                    {user.name}
                  </div>
                  <div className="text-[9px] text-[#94a3b8] truncate">
                    {user.role || 'Colaborador'}
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex items-center space-x-1 pl-2">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#182232] text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  Dia {user.day < 10 ? '0' + user.day : user.day}/{user.month < 10 ? '0' + user.month : user.month}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
