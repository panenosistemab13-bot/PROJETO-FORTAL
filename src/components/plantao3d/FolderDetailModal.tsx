import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FolderOpen,
  User,
  Clock,
  Sun,
  Moon,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Award,
  CheckSquare,
  Sparkles,
  Printer,
  Copy,
  Check,
  Search,
  Tag,
  Truck,
  MapPin,
  Coffee,
  Shield,
} from 'lucide-react';
import { PlantaoUser, PlantaoFolderItem, ItemTipo } from '../../types/plantao3d';
import { getCurrentUser } from '../../lib/authStore';
import { STATUS_CONFIG, PlantaoStatus } from '../../data/plantaoData';

import iconFolder3d from '../../assets/images/icon_folder_3d_1787015156529.jpg';
import iconBadge3d from '../../assets/images/icon_badge_3d_1787015174678.jpg';
import iconCoffee3d from '../../assets/images/icon_coffee_3d_1787015165985.jpg';
import iconTruck3d from '../../assets/images/icon_truck_3d_1787015195876.jpg';

interface FolderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PlantaoUser;
  items: PlantaoFolderItem[];
  currentActiveUserId: string;
  onAddItem: (user: PlantaoUser) => void;
  onEditItem: (item: PlantaoFolderItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleChecklist: (itemId: string, checkId: string) => void;
}

export function FolderDetailModal({
  isOpen,
  onClose,
  user,
  items,
  currentActiveUserId,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleChecklist,
}: FolderDetailModalProps) {
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUserObj = getCurrentUser();
  const isMaster = currentUserObj?.role?.toLowerCase().includes('mestre') || currentUserObj?.role === 'Mestre';
  const isOwner = currentActiveUserId === user.id || isMaster;
  
  const userItems = items.filter((item) => item.userId === user.id);

  const filteredItems = userItems.filter((item) => {
    const matchTipo = filterTipo === 'all' || item.tipo === filterTipo;
    const matchSearch =
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.veiculoPlaca && item.veiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.motorista && item.motorista.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchTipo && matchSearch;
  });

  const handleCopyReport = () => {
    const text = `=== PASSAGEM DE PLANTÃO - PASTA: ${user.nome.toUpperCase()} ===\nFunção: ${user.funcao} | ${user.turno} (${user.periodo})\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
      userItems.map((item, idx) => (
        `[${idx + 1}] ${item.titulo} (${item.data} às ${item.hora})\nTipo: ${item.tipo.toUpperCase()} | Prioridade: ${item.prioridade.toUpperCase()}\nDescrição: ${item.descricao}\n` +
        (item.veiculoPlaca ? `Veículo: ${item.veiculoPlaca} | Motorista: ${item.motorista || 'N/A'}\n` : '') +
        (item.checklistItems ? `Checklist: ${item.checklistItems.map(c => `[${c.concluido ? 'X' : ' '}] ${c.texto}`).join(', ')}\n` : '') +
        `----------------------------------------\n`
      )).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#0b1019] border border-[#1e283b] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up">
        
        {/* Header Section */}
        <div className="px-6 py-5 bg-[#121824] border-b border-[#1e283b] flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            {/* 3D Folder Icon */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#c9a265] shadow-lg flex-shrink-0 bg-[#080c14]">
              <img
                src={iconFolder3d}
                alt="Pasta 3D"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-[#dfbe85] font-mono border border-[#c9a265]/30">
                {user.avatarInitials}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {user.nome}
                </h2>
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${user.badgeColor}`}>
                  {user.funcao}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1.5 font-medium">
                <span className="flex items-center space-x-1.5 text-[#dfbe85]">
                  <Clock className="w-4 h-4" />
                  <span>{user.turno}</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center space-x-1.5">
                  {user.periodo === 'Diurno' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                  <span>{user.periodo}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats & Close Button */}
          <div className="flex items-start gap-4">
            <div className="hidden md:flex gap-2">
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#080c14] border border-[#1e283b] min-w-[70px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Itens</span>
                <span className="text-lg font-bold text-white font-mono leading-tight">{userItems.length}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1a2332] hover:bg-[#253248] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ownership Banner Alert */}
        <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
          isOwner
            ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
            : 'bg-amber-950/20 border-amber-900/50 text-amber-400'
        }`}>
          <div className="flex items-center space-x-2">
            {isOwner ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span className="font-semibold tracking-wide">
              {isOwner
                ? 'Sua Pasta (Edição Ativa)'
                : 'Modo Somente Leitura'}
            </span>
          </div>
          <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            CCO 3corações
          </span>
        </div>

        {/* Toolbar: Search, Filters, Actions */}
        <div className="p-4 sm:px-6 bg-[#0f141f] border-b border-[#1e283b] flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-72 flex-shrink-0">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar registros..."
                className="w-full pl-9 pr-3 py-2 bg-[#080c14] border border-[#1e283b] focus:border-[#c9a265]/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end overflow-x-auto pb-1 md:pb-0 custom-scroll">
              <button
                onClick={handleCopyReport}
                className="px-4 py-2 rounded-xl bg-[#1a2332] hover:bg-[#253248] text-slate-200 text-xs font-bold flex items-center gap-2 border border-[#2b3c58] transition-all whitespace-nowrap flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4 text-[#dfbe85]" />}
                <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
              </button>

              {isOwner && (
                <button
                  onClick={() => onAddItem(user)}
                  className="px-4 py-2 rounded-xl bg-[#c9a265] hover:bg-[#dfbe85] text-[#140e06] font-bold text-xs flex items-center gap-2 shadow-lg transition-all whitespace-nowrap flex-shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Lançar Registro</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scroll w-full pb-2">
            {[
              { id: 'all', label: `Todos` },
              { id: 'resumo_turno', label: 'Resumos' },
              { id: 'ocorrencia', label: 'Ocorrências' },
              { id: 'pontuacao', label: 'Pontuações' },
              { id: 'checklist', label: 'Checks' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterTipo(f.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  filterTipo === f.id
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#1a2332] text-slate-400 hover:text-white border border-[#2b3c58]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scroll flex-1 bg-[#080c14] space-y-4">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-[#0f141f] border border-[#1e283b] border-dashed mt-4">
              <FolderOpen className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-slate-300">Nenhum registro encontrado</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Esta pasta está vazia ou nenhum item corresponde à sua busca.
              </p>
              {isOwner && (
                <button
                  onClick={() => onAddItem(user)}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-[#c9a265] text-[#140e06] text-sm font-bold shadow-lg hover:scale-105 transition-all"
                >
                  Adicionar Primeiro Registro
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col p-5 rounded-2xl bg-[#0f141f] border border-[#1e283b] hover:border-[#384b6b] transition-all shadow-sm"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          item.tipo === 'resumo_turno'
                            ? 'bg-[#c9a265]/10 text-[#dfbe85] border border-[#c9a265]/30'
                            : item.tipo === 'ocorrencia'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : item.tipo === 'pontuacao'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {item.tipo.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          item.prioridade === 'critica'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : item.prioridade === 'importante'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.prioridade}
                      </span>
                      {item.tipo === 'ocorrencia' && (
                        (() => {
                          const statusKey = (item.statusOcorrencia || 'acompanhar') as PlantaoStatus;
                          const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['acompanhar'];
                          return (
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                              <span>{statusCfg.label}</span>
                            </span>
                          );
                        })()
                      )}
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {item.data} às {item.hora}
                      </div>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 rounded-lg bg-[#1a2332] hover:bg-[#253248] text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 rounded-lg bg-[#1a2332] hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <h4 className="text-base font-bold text-slate-200 mb-2">{item.titulo}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
                      {item.descricao}
                    </p>
                  </div>

                  {/* Metadata Footer */}
                  <div className="mt-4 pt-4 border-t border-[#1e283b] flex flex-col sm:flex-row gap-4 justify-between">
                    {/* Vehicle/Driver/Location */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.veiculoPlaca && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a2332] border border-[#2b3c58]">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-mono font-bold text-slate-300">{item.veiculoPlaca}</span>
                        </div>
                      )}
                      {item.motorista && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a2332] border border-[#2b3c58]">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-300">{item.motorista}</span>
                        </div>
                      )}
                      {item.local && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a2332] border border-[#2b3c58]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-300">{item.local}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1a2332] text-slate-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Checklists */}
                  {item.checklistItems && item.checklistItems.length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-[#080c14] border border-[#1e283b] space-y-2">
                      <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 mb-2">
                        <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                        Verificação de Tarefas
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.checklistItems.map((chk) => (
                          <label
                            key={chk.id}
                            className={`flex items-start gap-2.5 text-sm p-2 rounded-lg hover:bg-[#1a2332] transition-colors cursor-pointer ${
                              isOwner ? '' : 'pointer-events-none'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={chk.concluido}
                              disabled={!isOwner}
                              onChange={() => onToggleChecklist(item.id, chk.id)}
                              className="mt-0.5 rounded border-[#2b3c58] text-[#c9a265] focus:ring-[#c9a265]/50 bg-[#0f141f] cursor-pointer"
                            />
                            <span className={chk.concluido ? 'line-through text-slate-500' : 'text-slate-300 font-medium'}>
                              {chk.texto}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
