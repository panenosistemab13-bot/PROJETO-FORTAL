import { getInitialVehicles } from './veiculosData';

export type PlantaoStatus = 
  | 'acompanhar' 
  | 'resolvido' 
  | 'para conhecimento' 
  | 'atenção' 
  | 'registro grid';

export type PlantaoOperacao = 
  | 'transferencia' 
  | 'dedicado' 
  | 'distribuição risco' 
  | 'distribuição geral';

export const OPERACAO_OPTIONS: Array<{ value: PlantaoOperacao; label: string; description: string }> = [
  { value: 'transferencia', label: 'Transferência', description: 'Transferência entre unidades/CDs' },
  { value: 'dedicado', label: 'Dedicado', description: 'Operação dedicada exclusiva' },
  { value: 'distribuição risco', label: 'Distribuição Risco', description: 'Distribuição com gerenciamento de risco elevado' },
  { value: 'distribuição geral', label: 'Distribuição Geral', description: 'Distribuição geral e entregas regulares' },
];

export const OPERACAO_CONFIG: Record<PlantaoOperacao, {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}> = {
  'transferencia': {
    label: 'Transferência',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
  },
  'dedicado': {
    label: 'Dedicado',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
  },
  'distribuição risco': {
    label: 'Distribuição Risco',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
  },
  'distribuição geral': {
    label: 'Distribuição Geral',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
  },
};

export interface PlantaoItem {
  id: string;
  dataRegistro: string;
  horaRegistro: string;
  turno: string;
  operador: string;
  observacao: string;
  
  // Coluna Ocorrência
  unidadeTransportadora: string;
  placa: string;
  operacao?: PlantaoOperacao;
  eventualidade: string;
  descricaoOcorrencia: string;
  
  // Coluna Atualização/Retorno
  atualizacao: {
    temSubstituicao?: boolean;
    placaSubstituta?: string;
    condutorSubstituto?: string;
    descricaoRetorno: string;
    historico?: Array<{
      dataHora: string;
      operador: string;
      texto: string;
    }>;
  };
  
  // Coluna Status
  status: PlantaoStatus;
}

export const STATUS_CONFIG: Record<PlantaoStatus, {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}> = {
  'acompanhar': {
    label: 'acompanhar',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
    dotColor: 'bg-blue-400',
    description: 'Em monitoramento contínuo pelo CCO',
  },
  'resolvido': {
    label: 'resolvido',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    description: 'Ocorrência finalizada e validada',
  },
  'para conhecimento': {
    label: 'para conhecimento',
    badgeBg: 'bg-slate-500/15',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-500/30',
    dotColor: 'bg-slate-400',
    description: 'Informativo geral para o próximo turno',
  },
  'atenção': {
    label: 'atenção',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    dotColor: 'bg-amber-400 animate-pulse',
    description: 'Ponto crítico requer atenção redobrada',
  },
  'registro grid': {
    label: 'registro grid',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/30',
    dotColor: 'bg-purple-400',
    description: 'Cadastrado e rastreado no sistema Grid',
  },
};

export const INITIAL_PLANTAO_ITEMS: PlantaoItem[] = [];
