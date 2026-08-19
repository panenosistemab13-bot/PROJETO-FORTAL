import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Bell,
  User as UserIcon,
  ChevronDown,
  Calendar,
  Clock,
  ClipboardList,
  AlertTriangle,
  RotateCw,
  Truck,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRightLeft,
  Eye,
  Info,
  Radio,
  FileSpreadsheet,
  Plus,
  Compass,
  Database,
  Coffee,
  Move3d,
  Layers,
  MapPin,
  Check,
  Award,
  Lock
} from 'lucide-react';
import { 
  PlantaoItem, 
  PlantaoStatus, 
  PlantaoOperacao,
  OPERACAO_OPTIONS
} from '../data/plantaoData';
import { VehiclePlateSelect } from './VehiclePlateSelect';
import { getCurrentUser } from '../lib/authStore';
import { ThreePanorama } from './ThreePanorama';

// 3D Generated Assets (Café 3corações Theme)
import dioramaImg from '../assets/images/cafe_3c_logistics_diorama_3d_1787158330923.jpg';
import panorama3cHub from '../assets/images/cafe_3c_360_panorama_1787158352667.jpg';
import panoramaPatio from '../assets/images/santa_luzia_patio_logistica_360_1787083501915.jpg';
import panoramaSede from '../assets/images/edificio_joao_lima_360_1786970922827.jpg';

import registryBookImg from '../assets/images/golden_registry_book_3d_1787157768813.jpg';
import headsetImg from '../assets/images/golden_headset_3d_1787157777981.jpg';
import clipboardImg from '../assets/images/golden_clipboard_3d_1787157791115.jpg';

interface NovaOcorrencia3DViewProps {
  onSave: (record: PlantaoItem) => void;
  onCancel: () => void;
  editingRecord?: PlantaoItem | null;
}

const COMMON_SUGGESTIONS = [
  'Problema mecânico | troca de tração',
  'Alarme de violação de sensor / luz',
  'Desvio de rota em trecho rodoviário',
  'Cadastro de SM e Espelhamento Grid',
  'Informações operacionais / troca de chaves',
  'Atraso na entrega / parada prolongada',
  'Troca de motorista / alteração de escala',
];

const PANORAMA_OPTIONS = [
  { id: 'hub_3c', name: 'Hub CCO 3corações 360°', image: panorama3cHub },
  { id: 'patio_logistica', name: 'Pátio Logística 3C 360°', image: panoramaPatio },
  { id: 'sede_joao_lima', name: 'Edifício Sede 3C 360°', image: panoramaSede },
];

export function NovaOcorrencia3DView({
  onSave,
  onCancel,
  editingRecord
}: NovaOcorrencia3DViewProps) {
  const currentUser = getCurrentUser();
  const defaultOperatorName = currentUser?.fixedName || currentUser?.login || 'Cristiane Fialho';

  // Form states
  const [status, setStatus] = useState<PlantaoStatus>('acompanhar');
  const [operador, setOperador] = useState(defaultOperatorName);
  const [dataRegistro, setDataRegistro] = useState('');
  const [horaRegistro, setHoraRegistro] = useState('');
  const [observacao, setObservacao] = useState('');

  const [placa, setPlaca] = useState('');
  const [unidadeTransportadora, setUnidadeTransportadora] = useState('');
  const [operacao, setOperacao] = useState<PlantaoOperacao>('transferencia');
  const [eventualidade, setEventualidade] = useState('');
  const [descricaoOcorrencia, setDescricaoOcorrencia] = useState('');

  const [temSubstituicao, setTemSubstituicao] = useState(false);
  const [placaSubstituta, setPlacaSubstituta] = useState('');
  const [condutorSubstituto, setCondutorSubstituto] = useState('');
  const [descricaoRetorno, setDescricaoRetorno] = useState('');

  // Custom suggestions list
  const [suggestions, setSuggestions] = useState<string[]>(COMMON_SUGGESTIONS);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // 3D Interactive Mode (360° Panorama vs 3D Diorama 4K)
  const [viewer3DMode, setViewer3DMode] = useState<'panorama_360' | 'diorama_3d'>('diorama_3d');
  const [selectedPanorama, setSelectedPanorama] = useState(0);
  const [dioramaRotation, setDioramaRotation] = useState({ x: 0, y: 0 });
  const [isBeaconActive, setIsBeaconActive] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

  const dioramaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    if (editingRecord) {
      setStatus(editingRecord.status || 'acompanhar');
      setOperador(editingRecord.operador || defaultOperatorName);
      setDataRegistro(editingRecord.dataRegistro || now.toLocaleDateString('pt-BR'));
      setHoraRegistro(editingRecord.horaRegistro || now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setObservacao(editingRecord.observacao || '');
      setPlaca(editingRecord.placa || '');
      setUnidadeTransportadora(editingRecord.unidadeTransportadora || '');
      setOperacao(editingRecord.operacao || 'transferencia');
      setEventualidade(editingRecord.eventualidade || '');
      setDescricaoOcorrencia(editingRecord.descricaoOcorrencia || '');
      setTemSubstituicao(!!editingRecord.atualizacao?.temSubstituicao);
      setPlacaSubstituta(editingRecord.atualizacao?.placaSubstituta || '');
      setCondutorSubstituto(editingRecord.atualizacao?.condutorSubstituto || '');
      setDescricaoRetorno(editingRecord.atualizacao?.descricaoRetorno || '');
    } else {
      setDataRegistro(now.toLocaleDateString('pt-BR'));
      setHoraRegistro(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setOperador(defaultOperatorName);
    }
  }, [editingRecord, defaultOperatorName]);

  // 3D Parallax Mouse Tracking for Diorama
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dioramaContainerRef.current || viewer3DMode !== 'diorama_3d') return;
    const rect = dioramaContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 14;
    setDioramaRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setDioramaRotation({ x: 0, y: 0 });
    setActiveHotspot(null);
  };

  const handleVehiclePlatePicked = (pickedPlate: string, carrier?: string) => {
    setPlaca(pickedPlate);
    if (carrier) {
      setUnidadeTransportadora(carrier);
    }
  };

  const handleSelectSuggestion = (text: string) => {
    setEventualidade(text);
    if (!descricaoOcorrencia) {
      setDescricaoOcorrencia(`Registro de ${text}. Contato realizado com a base/condutor.`);
    }
  };

  const handleAddNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !suggestions.includes(newTagInput.trim())) {
      setSuggestions([...suggestions, newTagInput.trim()]);
      setEventualidade(newTagInput.trim());
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricaoOcorrencia.trim() && !eventualidade.trim() && !placa.trim()) {
      alert('Por favor, preencha a placa, eventualidade ou descrição da ocorrência.');
      return;
    }

    setIsSubmitting(true);
    setShowSuccessGlow(true);

    const now = new Date();
    const dateStr = dataRegistro.trim() || now.toLocaleDateString('pt-BR');
    const timeStr = horaRegistro.trim() || now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const opStr = operador.trim() || defaultOperatorName;

    const recordPayload: PlantaoItem = {
      id: editingRecord ? editingRecord.id : `plantao-${Date.now()}`,
      dataRegistro: dateStr,
      horaRegistro: timeStr,
      turno: editingRecord?.turno || 'Turno A (06:00 - 18:00)',
      operador: opStr,
      observacao: observacao.trim(),
      unidadeTransportadora: unidadeTransportadora.trim() || 'Logística 3C',
      placa: placa.trim().toUpperCase(),
      operacao: operacao,
      eventualidade: eventualidade.trim() || 'Ocorrência Operacional',
      descricaoOcorrencia: descricaoOcorrencia.trim(),
      createdAt: editingRecord?.createdAt || Date.now(),
      atualizacao: {
        temSubstituicao: temSubstituicao,
        placaSubstituta: temSubstituicao ? placaSubstituta.trim().toUpperCase() : '',
        condutorSubstituto: temSubstituicao ? condutorSubstituto.trim() : '',
        descricaoRetorno: descricaoRetorno.trim(),
        historico: editingRecord?.atualizacao?.historico || [
          {
            dataHora: `${dateStr} ${timeStr}`,
            operador: opStr,
            texto: descricaoRetorno.trim() || 'Abertura do registro de ocorrência no CCO.',
          }
        ]
      },
      status: status,
    };

    setTimeout(() => {
      onSave(recordPayload);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="w-full min-h-screen bg-[#07090d] text-slate-100 pb-16 font-sans relative select-none">
      
      {/* Background Subtle Luxury Grid & Vignette */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(201,162,101,0.06),transparent_80%)]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_60%_at_85%_30%,rgba(201,162,101,0.04),transparent_70%)]" />

      {/* ======================================================== */}
      {/* 1. TOP HEADER & BREADCRUMBS                              */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 pb-6 border-b border-[#1c2433]/70">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight flex items-center gap-3">
            <span>Nova Ocorrência</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-400 font-medium mt-1 flex items-center gap-2">
            <span>Registro de Ocorrências no Livro de Ocorrências</span>
            <span className="text-[#c9a265]">&rsaquo;</span>
            <span className="text-[#dfbe85] font-semibold">Grupo 3corações</span>
          </p>
        </div>

        {/* Top Right Executive Profile & Telemetry Badges */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              className="p-2.5 rounded-xl bg-[#111622] hover:bg-[#192233] border border-[#232f45] text-slate-300 hover:text-[#dfbe85] transition-all cursor-pointer shadow-md"
              title="Pesquisar registros"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-[#111622] border border-[#232f45] shadow-md">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#c9a265] to-[#f0d49f] flex items-center justify-center text-[#0c1017] font-black text-xs shadow">
              {operador.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-200 hidden md:inline">{operador}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Botão Fechar (X) na ponta superior direita para sair da página */}
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-[#1a1416] hover:bg-rose-950/70 border border-rose-900/60 hover:border-rose-500 text-rose-300 hover:text-white transition-all cursor-pointer shadow-lg flex items-center justify-center group active:scale-95 ml-1"
            title="Fechar e sair da página"
          >
            <X className="w-4 h-4 text-rose-400 group-hover:text-rose-200 transition-transform group-hover:rotate-90 duration-200" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">

        {/* ======================================================== */}
        {/* 2. STATUS DA OCORRÊNCIA (5 LUXURY SELECTOR CARDS)        */}
        {/* ======================================================== */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#dfbe85] font-bold block">
            STATUS DA OCORRÊNCIA
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            
            {/* 1. Acompanhar */}
            <button
              type="button"
              onClick={() => setStatus('acompanhar')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer flex items-center gap-3.5 ${
                status === 'acompanhar'
                  ? 'bg-gradient-to-r from-[#211a10] to-[#14120e] border-[#c9a265] shadow-[0_0_20px_rgba(201,162,101,0.25)] ring-1 ring-[#c9a265]'
                  : 'bg-[#0f141f] border-[#1d2638] hover:border-[#c9a265]/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                status === 'acompanhar'
                  ? 'bg-gradient-to-br from-[#dfbe85] to-[#c9a265] text-[#0c1017] shadow-lg shadow-[#c9a265]/40 scale-105'
                  : 'bg-[#182030] text-[#c9a265] border border-[#c9a265]/30 group-hover:scale-105'
              }`}>
                <RotateCw className={`w-5 h-5 ${status === 'acompanhar' ? 'animate-spin-slow' : ''}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-bold block ${status === 'acompanhar' ? 'text-white' : 'text-slate-200'}`}>
                  Acompanhar
                </span>
                <span className="text-[10px] text-slate-400 block truncate">Ocorrência em andamento</span>
              </div>
              {status === 'acompanhar' && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#c9a265] shadow-[0_0_10px_#c9a265]" />
              )}
            </button>

            {/* 2. Resolvido */}
            <button
              type="button"
              onClick={() => setStatus('resolvido')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer flex items-center gap-3.5 ${
                status === 'resolvido'
                  ? 'bg-gradient-to-r from-[#0d2116] to-[#091710] border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500'
                  : 'bg-[#0f141f] border-[#1d2638] hover:border-emerald-500/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                status === 'resolvido'
                  ? 'bg-emerald-500 text-[#0c1017] shadow-lg shadow-emerald-500/40 scale-105'
                  : 'bg-[#182030] text-emerald-400 border border-emerald-500/30 group-hover:scale-105'
              }`}>
                <CheckCircle2 className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-bold block ${status === 'resolvido' ? 'text-white' : 'text-slate-200'}`}>
                  Resolvido
                </span>
                <span className="text-[10px] text-slate-400 block truncate">Ocorrência finalizada</span>
              </div>
              {status === 'resolvido' && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_#10b981]" />
              )}
            </button>

            {/* 3. Para Conhecimento */}
            <button
              type="button"
              onClick={() => setStatus('para conhecimento')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer flex items-center gap-3.5 ${
                status === 'para conhecimento'
                  ? 'bg-gradient-to-r from-[#0d1c2e] to-[#0a1320] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-blue-500'
                  : 'bg-[#0f141f] border-[#1d2638] hover:border-blue-500/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                status === 'para conhecimento'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40 scale-105'
                  : 'bg-[#182030] text-blue-400 border border-blue-500/30 group-hover:scale-105'
              }`}>
                <Compass className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-bold block ${status === 'para conhecimento' ? 'text-white' : 'text-slate-200'}`}>
                  Para Conhecimento
                </span>
                <span className="text-[10px] text-slate-400 block truncate">Apenas informação</span>
              </div>
              {status === 'para conhecimento' && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
              )}
            </button>

            {/* 4. Atenção */}
            <button
              type="button"
              onClick={() => setStatus('atenção')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer flex items-center gap-3.5 ${
                status === 'atenção'
                  ? 'bg-gradient-to-r from-[#291e0a] to-[#1a1408] border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-500'
                  : 'bg-[#0f141f] border-[#1d2638] hover:border-amber-500/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                status === 'atenção'
                  ? 'bg-amber-500 text-[#0c1017] shadow-lg shadow-amber-500/40 scale-105'
                  : 'bg-[#182030] text-amber-400 border border-amber-500/30 group-hover:scale-105'
              }`}>
                <AlertTriangle className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-bold block ${status === 'atenção' ? 'text-white' : 'text-slate-200'}`}>
                  Atenção
                </span>
                <span className="text-[10px] text-slate-400 block truncate">Requer atenção</span>
              </div>
              {status === 'atenção' && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
              )}
            </button>

            {/* 5. Registro Grid */}
            <button
              type="button"
              onClick={() => setStatus('registro grid')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer flex items-center gap-3.5 ${
                status === 'registro grid'
                  ? 'bg-gradient-to-r from-[#211129] to-[#140b1a] border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-1 ring-purple-500'
                  : 'bg-[#0f141f] border-[#1d2638] hover:border-purple-500/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                status === 'registro grid'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/40 scale-105'
                  : 'bg-[#182030] text-purple-400 border border-purple-500/30 group-hover:scale-105'
              }`}>
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-bold block ${status === 'registro grid' ? 'text-white' : 'text-slate-200'}`}>
                  Registro Grid
                </span>
                <span className="text-[10px] text-slate-400 block truncate">Registro interno</span>
              </div>
              {status === 'registro grid' && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
              )}
            </button>

          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SECTION: OPERATOR / OBS & 3D 4K ISOMETRIC DIORAMA     */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Sub-Column (7 cols): Identificação & Coluna 1 */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Identificação Card */}
            <div className="p-5 rounded-2xl bg-[#0f141f] border border-[#1e273a] shadow-xl relative overflow-hidden">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#241c10] border border-[#c9a265]/40 flex items-center justify-center text-[#dfbe85]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                  IDENTIFICAÇÃO DO OPERADOR & DATA/HORA
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Operador (Fixo / Inalterável) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10.5px] font-medium text-slate-400">Operador / Usuário</label>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#c9a265]/20 text-[#dfbe85] font-bold uppercase flex items-center gap-1 border border-[#c9a265]/30">
                      <Lock className="w-2.5 h-2.5 text-[#dfbe85]" />
                      <span>POR PADRÃO</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={operador}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 bg-[#06080d] border border-[#1b2333] rounded-xl text-xs font-bold text-[#dfbe85] select-none cursor-not-allowed shadow-inner opacity-95"
                      placeholder="Nome do operador"
                    />
                  </div>
                </div>

                {/* Data (Fixa / Inalterável) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10.5px] font-medium text-slate-400">Data do Registro</label>
                    <span className="text-[8.5px] px-1 py-0.2 text-slate-500 font-mono">AUTOMÁTICA</span>
                  </div>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-[#c9a265]/70 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={dataRegistro}
                      readOnly
                      disabled
                      className="w-full pl-8 pr-3 py-2 bg-[#06080d] border border-[#1b2333] rounded-xl text-xs font-mono font-semibold text-slate-200 select-none cursor-not-allowed shadow-inner opacity-95"
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                </div>

                {/* Horário (Fixo / Inalterável) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10.5px] font-medium text-slate-400">Horário</label>
                    <span className="text-[8.5px] px-1 py-0.2 text-slate-500 font-mono">TEMPO REAL</span>
                  </div>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-[#c9a265]/70 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={horaRegistro}
                      readOnly
                      disabled
                      className="w-full pl-8 pr-3 py-2 bg-[#06080d] border border-[#1b2333] rounded-xl text-xs font-mono font-semibold text-slate-200 select-none cursor-not-allowed shadow-inner opacity-95"
                      placeholder="HH:MM"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA 1: OBSERVAÇÃO GERAL Card */}
            <div className="p-5 rounded-2xl bg-[#0f141f] border border-[#1e273a] shadow-xl flex-1 flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#241c10] border border-[#c9a265]/40 flex items-center justify-center text-[#dfbe85]">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                      COLUNA 1: OBSERVAÇÃO GERAL
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Digite observações complementares, avisos para o próximo operador ou notas rápidas...
                  </p>
                </div>

                {/* 3D Floating Clipboard Badge */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#c9a265]/40 shadow-xl flex-shrink-0 bg-[#0c1017] transition-all duration-300 group-hover:scale-105 group-hover:border-[#c9a265]">
                  <img
                    src={clipboardImg}
                    alt="3D Clipboard"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-none shadow-inner"
                placeholder="Ex: Turno tranquilo sem anomalias graves. Veículo 3C em monitoramento contínuo..."
              />
            </div>

          </div>

          {/* Right Sub-Column (5 cols): 3D 4K CAFÉ 3CORAÇÕES DIORAMA */}
          <div 
            ref={dioramaContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="lg:col-span-5 rounded-2xl bg-[#0f141f] border border-[#1e273a] hover:border-[#c9a265]/60 shadow-2xl relative overflow-hidden flex flex-col justify-center transition-all duration-300 group min-h-[290px]"
            style={{
              perspective: '1000px',
            }}
          >
            {/* 3D 4K ISOMETRIC DIORAMA (CAFÉ 3CORAÇÕES LOGISTICS FLEET) */}
            <div 
              className="relative w-full h-[290px] sm:h-[320px] flex items-center justify-center overflow-hidden transition-transform duration-200 ease-out"
              style={{
                transform: `rotateX(${dioramaRotation.x}deg) rotateY(${dioramaRotation.y}deg) scale(1.02)`,
              }}
            >
              <img
                src={dioramaImg}
                alt="3D Café 3corações Logistics Diorama 4K"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter contrast-105"
              />

              {/* Ambient Lighting & Shadows */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d14]/80 via-transparent to-transparent pointer-events-none" />

              {/* Dynamic Amber Glow overlay */}
              {isBeaconActive && (
                <div className="absolute top-[28%] left-[62%] w-10 h-10 rounded-full bg-amber-400/35 blur-md animate-pulse pointer-events-none" />
              )}

              {/* Interactive Inspection Hotspots */}
              <button
                type="button"
                onClick={() => setActiveHotspot(activeHotspot === 'truck' ? null : 'truck')}
                className="absolute top-[34%] left-[48%] w-5 h-5 rounded-full bg-[#c9a265] text-[#0c1017] font-black text-[10px] flex items-center justify-center shadow-[0_0_12px_#c9a265] animate-bounce z-20 cursor-pointer"
                title="Caminhão 3corações"
              >
                1
              </button>

              <button
                type="button"
                onClick={() => setActiveHotspot(activeHotspot === 'coffee' ? null : 'coffee')}
                className="absolute top-[58%] left-[26%] w-5 h-5 rounded-full bg-[#c9a265] text-[#0c1017] font-black text-[10px] flex items-center justify-center shadow-[0_0_12px_#c9a265] z-20 cursor-pointer"
                title="Café 3corações Especial"
              >
                2
              </button>

              <button
                type="button"
                onClick={() => setActiveHotspot(activeHotspot === 'gps' ? null : 'gps')}
                className="absolute top-[48%] right-[18%] w-5 h-5 rounded-full bg-amber-400 text-[#0c1017] font-black text-[10px] flex items-center justify-center shadow-[0_0_12px_#f59e0b] z-20 cursor-pointer"
                title="Rastreamento GPS / CCO"
              >
                3
              </button>

              {/* Active Hotspot Tooltip Popup */}
              {activeHotspot && (
                <div className="absolute bottom-4 left-4 right-4 z-30 p-2.5 rounded-xl bg-black/90 border border-[#c9a265] text-xs shadow-2xl backdrop-blur-md animate-fade-in flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#c9a265] flex-shrink-0" />
                    <span className="text-slate-200 text-[11px]">
                      {activeHotspot === 'truck' && 'Frota 3corações: Caminhão de transferência logística com telemetria ativa.'}
                      {activeHotspot === 'coffee' && 'Carga Café 3corações: Transporte paletizado com controle de trajeto.'}
                      {activeHotspot === 'gps' && 'Sinal CCO & Rastreamento 3C: Comunicação 24h espelhada no Grid.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(null)}
                    className="text-slate-400 hover:text-white ml-2 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* 4. SECTION: COLUNA 2 - DETALHES DA OCORRÊNCIA            */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f141f] border border-[#1e273a] shadow-xl relative overflow-hidden group">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#241c10] border border-[#c9a265]/40 flex items-center justify-center text-[#dfbe85]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                  COLUNA 2: DETALHES DA OCORRÊNCIA
                </h3>
                <p className="text-[11px] text-slate-400">
                  Preencha os dados do veículo, transportadora parceira ou frota própria e a descrição detalhada.
                </p>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Placa do Veículo (Autocomplete com Base) */}
            <div>
              <label className="text-[10.5px] font-medium text-slate-300 mb-1.5 block">
                Placa do Veículo (Busca na Base) <span className="text-[#c9a265]">*</span>
              </label>
              <VehiclePlateSelect
                value={placa}
                onChange={handleVehiclePlatePicked}
                placeholder="EX: ABC-1D23 OU SELECION"
                className="w-full"
              />
            </div>

            {/* Unidade / Transportadora */}
            <div>
              <label className="text-[10.5px] font-medium text-slate-300 mb-1.5 block">
                Unidade / Transportadora
              </label>
              <div className="relative">
                <Truck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={unidadeTransportadora}
                  onChange={(e) => setUnidadeTransportadora(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs font-semibold text-white focus:outline-none transition-all"
                  placeholder="Ex: LogFran, JC Excelsior, 3corações..."
                />
              </div>
            </div>

            {/* Operação */}
            <div>
              <label className="text-[10.5px] font-medium text-slate-300 mb-1.5 block">
                Operação <span className="text-[#c9a265]">*</span>
              </label>
              <div className="relative">
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  value={operacao}
                  onChange={(e) => setOperacao(e.target.value as PlantaoOperacao)}
                  className="w-full pl-8 pr-8 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs font-semibold text-white focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  {OPERACAO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Eventualidade */}
            <div>
              <label className="text-[10.5px] font-medium text-slate-300 mb-1.5 block">
                Eventualidade
              </label>
              <input
                type="text"
                value={eventualidade}
                onChange={(e) => setEventualidade(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs font-semibold text-white focus:outline-none transition-all"
                placeholder="Ex: Problema mecânico | troca"
              />
            </div>

          </div>

          {/* Sugestões Rápidas (Pills) */}
          <div className="mt-4 pt-3 border-t border-[#1e273a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
                Sugestões rápidas:
              </span>
              {!isAddingTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="text-[10px] text-[#dfbe85] hover:text-[#c9a265] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Adicionar Tag</span>
                </button>
              )}
            </div>

            {isAddingTag && (
              <div className="flex items-center gap-2 mb-3 animate-fade-in">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Nova tag sugerida..."
                  className="px-3 py-1.5 bg-[#090d14] border border-[#c9a265] rounded-lg text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  className="px-3 py-1.5 bg-[#c9a265] text-[#0c1017] rounded-lg text-xs font-bold"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => {
                const isSelected = eventualidade === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#c9a265] text-[#0c1017] font-bold shadow-md shadow-[#c9a265]/30 ring-1 ring-[#dfbe85]'
                        : 'bg-[#121824] hover:bg-[#1a2333] border border-[#232f45] hover:border-[#c9a265]/50 text-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição Completa da Ocorrência */}
          <div className="mt-4">
            <label className="text-[10.5px] font-medium text-slate-300 mb-1.5 block">
              Descrição Completa da Ocorrência <span className="text-[#c9a265]">*</span>
            </label>
            <textarea
              value={descricaoOcorrencia}
              onChange={(e) => setDescricaoOcorrencia(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner leading-relaxed"
              placeholder="Descreva detalhadamente o evento, contato com motorista (WhatsApp/Telefone), relatos, local da parada, medidas tomadas..."
            />
          </div>

        </div>

        {/* ======================================================== */}
        {/* 5. SECTION: COLUNA 3 - ATUALIZAÇÃO / RETORNO             */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f141f] border border-[#1e273a] shadow-xl relative overflow-hidden">
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#241c10] border border-[#c9a265]/40 flex items-center justify-center text-[#dfbe85]">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                COLUNA 3: ATUALIZAÇÃO / RETORNO
              </h3>
              <p className="text-[11px] text-slate-400">
                Parecer do operador, despacho ou retorno com instruções para liberação do veículo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            
            {/* Left Parecer / Despacho Textarea (7 cols) */}
            <div className="lg:col-span-7">
              <label className="text-[10.5px] font-medium text-slate-300 mb-1.5 block">
                Parecer / Despacho / Retorno da Central
              </label>
              <textarea
                value={descricaoRetorno}
                onChange={(e) => setDescricaoRetorno(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all resize-none shadow-inner"
                placeholder="Informe status do checklist, testes Audsat/Omnilink, contato noturno, previsão de liberação ou tratativas com a transportadora..."
              />
            </div>

            {/* Center 3D Operator Headset Sphere (2 cols) */}
            <div className="lg:col-span-2 flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#c9a265]/40 shadow-xl bg-[#0c1017] relative group hover:scale-105 transition-all">
                <img
                  src={headsetImg}
                  alt="3D Operator Headset"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <span className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] font-mono text-[#dfbe85] font-bold">
                  OPERADOR CCO
                </span>
              </div>
            </div>

            {/* Right Substituição Toggle & Fields (3 cols) */}
            <div className="lg:col-span-3 p-4 rounded-xl bg-[#090d14] border border-[#232f45] space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={temSubstituicao}
                  onChange={(e) => setTemSubstituicao(e.target.checked)}
                  className="w-4 h-4 rounded text-[#c9a265] bg-[#121824] border-[#2d3748] focus:ring-[#c9a265] focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200 leading-tight">
                  Houve substituição de veículo / condutor?
                </span>
              </label>

              {temSubstituicao && (
                <div className="space-y-2.5 pt-2 border-t border-[#1e273a] animate-fade-in">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Placa Substituta</label>
                    <input
                      type="text"
                      value={placaSubstituta}
                      onChange={(e) => setPlacaSubstituta(e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#2d3748] focus:border-[#c9a265] rounded-lg text-xs font-mono text-white focus:outline-none"
                      placeholder="Ex: XYZ-9K88"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Condutor Substituto</label>
                    <input
                      type="text"
                      value={condutorSubstituto}
                      onChange={(e) => setCondutorSubstituto(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#121824] border border-[#2d3748] focus:border-[#c9a265] rounded-lg text-xs text-white focus:outline-none"
                      placeholder="Nome do novo motorista"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* 6. BOTTOM EXECUTIVE ACTION BAR                           */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e131d] border border-[#1e273a] shadow-xl">
          
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#c9a265]" />
            <span>* Campos obrigatórios para lançamento no histórico de plantão</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-[#141b27] hover:bg-[#1e283a] text-slate-300 hover:text-white border border-[#232f45] text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#dfbe85] via-[#c9a265] to-[#8f6826] hover:brightness-110 text-[#0c1017] font-black text-xs transition-all shadow-[0_4px_20px_rgba(201,162,101,0.35)] cursor-pointer flex items-center space-x-2 active:scale-95 disabled:opacity-50 ${
                showSuccessGlow ? 'ring-4 ring-[#dfbe85]/50 scale-105' : ''
              }`}
            >
              <RotateCw className={`w-4 h-4 stroke-[2.4] ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{editingRecord ? 'Atualizar no Plantão' : 'Cadastrar no Plantão'}</span>
            </button>
          </div>

        </div>

      </form>

    </div>
  );
}
