import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Printer,
  LayoutGrid,
  ListFilter,
  Truck,
  User,
  Clock,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCw,
  Sparkles,
  ArrowRight,
  Shield,
  Edit2,
  Trash2,
  MessageSquarePlus,
  ChevronDown,
} from 'lucide-react';
import {
  PlantaoItem,
  PlantaoStatus,
  PlantaoOperacao,
  STATUS_CONFIG,
  OPERACAO_CONFIG,
  INITIAL_PLANTAO_ITEMS,
} from '../data/plantaoData';
import { PlantaoUser, PlantaoFolderItem } from '../types/plantao3d';
import {
  subscribeToOcorrencias,
  subscribeToPlantaoItems,
  saveOcorrenciasToRtdb,
  clearAllOcorrenciasFromRtdb,
  savePlantaoItemsToRtdb,
} from '../lib/realtimeDb';
import { PlantaoRecordModal } from '../components/modals/PlantaoRecordModal';
import { AddPlantaoUpdateModal } from '../components/modals/AddPlantaoUpdateModal';
import { NovaOcorrencia3DView } from '../components/NovaOcorrencia3DView';
import { getCurrentUser } from '../lib/authStore';
import { PlacaMercosul } from '../components/PlacaMercosul';
import { INITIAL_VEHICLES_RAW } from '../data/veiculosData';

const getCarrierName = (plate: string, currentCarrier?: string) => {
  const matchedVehicle = INITIAL_VEHICLES_RAW.find(
    (v) => v.plate.toUpperCase().trim() === plate.toUpperCase().trim()
  );
  if (matchedVehicle) {
    return matchedVehicle.carrier;
  }
  // If the current carrier is empty or generic 'Central', fall back to 'Logística 3C'
  if (!currentCarrier || currentCarrier === 'Central' || currentCarrier === 'CCO') {
    return 'Logística 3C';
  }
  return currentCarrier;
};

export function Ocorrencias() {
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const [expandedRetorno, setExpandedRetorno] = useState<Record<string, boolean>>({});

  const renderTruncatedText = (
    text: string,
    itemId: string,
    isRetorno: boolean
  ) => {
    if (!text) return null;
    const isLong = text.length > 75;
    const expandedMap = isRetorno ? expandedRetorno : expandedDesc;
    const setExpandedMap = isRetorno ? setExpandedRetorno : setExpandedDesc;
    const isExpanded = !!expandedMap[itemId];

    if (!isLong) {
      return <p className="text-[11px] text-slate-300 mt-1 leading-relaxed text-center">{text}</p>;
    }

    return (
      <div className="flex flex-col items-center justify-center">
        <p className={`text-[11px] text-slate-300 mt-1 leading-relaxed text-center ${isExpanded ? '' : 'line-clamp-2'}`}>
          {text}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedMap(prev => ({ ...prev, [itemId]: !isExpanded }));
          }}
          className="text-[10px] text-[#dfbe85] hover:text-[#c9a265] font-extrabold mt-1 transition-colors cursor-pointer inline-flex items-center"
        >
          {isExpanded ? 'Ver menos' : 'Ver +'}
        </button>
      </div>
    );
  };

  const [rtdbRecords, setRtdbRecords] = useState<PlantaoItem[]>(() => {
    const saved = localStorage.getItem('plantao_records_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: PlantaoItem) => !item.id.startsWith('plantao-'));
        }
      } catch (e) {
        console.error('Error loading saved plantao records:', e);
      }
    }
    return [];
  });

  const [rtdbFolderItems, setRtdbFolderItems] = useState<PlantaoFolderItem[]>(() => {
    const saved = localStorage.getItem('plantao_items_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading saved plantao items:', e);
      }
    }
    return [];
  });

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    const unsubscribeRecords = subscribeToOcorrencias((recordsList) => {
      if (recordsList) {
        const cleaned = recordsList.filter((item) => !item.id.startsWith('plantao-'));
        setRtdbRecords(cleaned);
      } else {
        setRtdbRecords([]);
      }
    });

    const unsubscribeFolderItems = subscribeToPlantaoItems((itemsList) => {
      if (itemsList) {
        setRtdbFolderItems(itemsList);
      } else {
        setRtdbFolderItems([]);
      }
    });

    return () => {
      unsubscribeRecords();
      unsubscribeFolderItems();
    };
  }, []);

  // Dynamically merge standard occurrences and occurrences created inside any user folders
  const records = useMemo(() => {
    const result = [...rtdbRecords];

    const folderConverted = rtdbFolderItems
      .filter((fi) => fi.tipo === 'ocorrencia')
      .map((fi) => {
        const recordId = fi.id.startsWith('item-from-ocorrencia-')
          ? fi.id.replace('item-from-ocorrencia-', '')
          : fi.id;

        let status: PlantaoStatus = 'acompanhar';
        if (fi.statusOcorrencia) {
          status = fi.statusOcorrencia as PlantaoStatus;
        } else {
          if (fi.statusAcompanhamento === 'concluido') status = 'resolvido';
          else if (fi.statusAcompanhamento === 'informativo') status = 'para conhecimento';
          else if (fi.statusAcompanhamento === 'pendente_proximo_turno') status = 'atenção';
        }

        return {
          id: recordId,
          dataRegistro: fi.data,
          horaRegistro: fi.hora,
          turno: 'Central',
          operador: fi.userName || 'Operador',
          observacao: fi.descricao || '',
          unidadeTransportadora: 'Central',
          placa: fi.veiculoPlaca || '-',
          operacao: (fi.tags && fi.tags[0] as PlantaoOperacao) || 'transferencia',
          eventualidade: fi.titulo || 'Ocorrência',
          descricaoOcorrencia: fi.descricao || '',
          status: status,
          atualizacao: {
            descricaoRetorno: '',
          }
        } as PlantaoItem;
      });

    // Merge non-duplicate entries from user folders
    for (const convertedItem of folderConverted) {
      if (!result.some((r) => r.id === convertedItem.id)) {
        result.push(convertedItem);
      }
    }

    return result;
  }, [rtdbRecords, rtdbFolderItems]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PlantaoStatus | 'all'>('all');
  const [selectedOperacao, setSelectedOperacao] = useState<PlantaoOperacao | 'all'>('all');
  const [selectedTurno, setSelectedTurno] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'nova_ocorrencia'>('table');

  // Subscription and clear hooks
  const currentUserObj = getCurrentUser();
  const isMaster = currentUserObj?.role?.toLowerCase().includes('mestre') || currentUserObj?.role === 'Mestre';
  
  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PlantaoItem | null>(null);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [recordToUpdate, setRecordToUpdate] = useState<PlantaoItem | null>(null);

  // Sync to Firebase RTDB & local storage
  const saveRecords = (newRecords: PlantaoItem[]) => {
    saveOcorrenciasToRtdb(newRecords);
  };

  // Handlers
  const handleSaveRecord = (savedRecord: PlantaoItem) => {
    if (editingRecord) {
      saveRecords(records.map((r) => (r.id === savedRecord.id ? savedRecord : r)));

      // Also update status and title in corresponding folder item if it exists
      const savedItemsStr = localStorage.getItem('plantao_items_v2');
      if (savedItemsStr) {
        try {
          const folderItems: PlantaoFolderItem[] = JSON.parse(savedItemsStr);
          const updatedFolderItems = folderItems.map((item) => {
            if (item.id === `item-from-ocorrencia-${savedRecord.id}`) {
              return {
                ...item,
                titulo: savedRecord.eventualidade || 'Ocorrência Operacional',
                descricao: savedRecord.descricaoOcorrencia || '',
                veiculoPlaca: savedRecord.placa || undefined,
                statusOcorrencia: savedRecord.status,
                prioridade: savedRecord.status === 'atenção' ? 'critica' as const : 'normal' as const,
              };
            }
            return item;
          });
          savePlantaoItemsToRtdb(updatedFolderItems);
        } catch (e) {
          console.error('Error updating linked folder item on save edit:', e);
        }
      }
    } else {
      saveRecords([savedRecord, ...records]);

      // Automatically link newly added occurrence to the creator's folder in Passagem de Plantão
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Load plantao users from localStorage to match the folder
        const savedUsersStr = localStorage.getItem('plantao_users_v2');
        let plantaoUsers: PlantaoUser[] = [];
        if (savedUsersStr) {
          try {
            plantaoUsers = JSON.parse(savedUsersStr);
          } catch (e) {
            console.error('Error loading plantao users in Ocorrencias page:', e);
          }
        }

        const matchedUser = plantaoUsers.find(
          (pu) =>
            pu.id === currentUser.plantaoFolderId ||
            pu.nome.trim().toLowerCase() === currentUser.plantaoFolderName?.trim().toLowerCase() ||
            pu.nome.trim().toLowerCase() === currentUser.fixedName?.trim().toLowerCase() ||
            pu.nome.trim().toLowerCase() === currentUser.login?.trim().toLowerCase()
        );

        if (matchedUser) {
          // Load current folder items
          const savedItemsStr = localStorage.getItem('plantao_items_v2');
          let folderItems: PlantaoFolderItem[] = [];
          if (savedItemsStr) {
            try {
              folderItems = JSON.parse(savedItemsStr);
            } catch (e) {
              console.error('Error loading plantao items in Ocorrencias page:', e);
            }
          }

          // Generate new PlantaoFolderItem with predictable id and statusOcorrencia field
          const newFolderItem: PlantaoFolderItem = {
            id: `item-from-ocorrencia-${savedRecord.id}`,
            userId: matchedUser.id,
            userName: matchedUser.nome,
            tipo: 'ocorrencia',
            titulo: savedRecord.eventualidade || 'Ocorrência Operacional',
            descricao: savedRecord.descricaoOcorrencia || '',
            data: savedRecord.dataRegistro || new Date().toLocaleDateString('pt-BR'),
            hora: savedRecord.horaRegistro || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            prioridade: savedRecord.status === 'atenção' ? 'critica' : 'normal',
            veiculoPlaca: savedRecord.placa || undefined,
            statusAcompanhamento: 'acompanhar',
            statusOcorrencia: savedRecord.status,
            tags: [savedRecord.operacao || 'transferencia'],
            createdAt: Date.now(),
          };

          const updatedFolderItems = [newFolderItem, ...folderItems];
          savePlantaoItemsToRtdb(updatedFolderItems);
        }
      }
    }
    setIsRecordModalOpen(false);
    setEditingRecord(null);
  };

  const handleStatusChange = (recordId: string, newStatus: PlantaoStatus) => {
    // 1. Update the status of the occurrence record globally
    const updatedRecords = records.map((r) => {
      if (r.id === recordId) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    saveRecords(updatedRecords);

    // 2. Also update the linked folder item in Passagem de Plantão
    const savedItemsStr = localStorage.getItem('plantao_items_v2');
    if (savedItemsStr) {
      try {
        const folderItems: PlantaoFolderItem[] = JSON.parse(savedItemsStr);
        const updatedFolderItems = folderItems.map((item) => {
          if (item.id === `item-from-ocorrencia-${recordId}`) {
            let statusAcompanhamento: 'concluido' | 'acompanhar' | 'pendente_proximo_turno' | 'informativo' = 'acompanhar';
            if (newStatus === 'resolvido') {
              statusAcompanhamento = 'concluido';
            } else if (newStatus === 'para conhecimento') {
              statusAcompanhamento = 'informativo';
            } else if (newStatus === 'atenção') {
              statusAcompanhamento = 'pendente_proximo_turno';
            } else if (newStatus === 'registro grid') {
              statusAcompanhamento = 'concluido';
            } else {
              statusAcompanhamento = 'acompanhar';
            }

            return {
              ...item,
              statusOcorrencia: newStatus,
              statusAcompanhamento,
              prioridade: newStatus === 'atenção' ? 'critica' as const : 'normal' as const,
            };
          }
          return item;
        });
        savePlantaoItemsToRtdb(updatedFolderItems);
      } catch (e) {
        console.error('Error updating status for linked folder item:', e);
      }
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de ocorrência?')) {
      saveRecords(records.filter((r) => r.id !== id));

      // Also delete from user's plantao folder
      const savedItemsStr = localStorage.getItem('plantao_items_v2');
      if (savedItemsStr) {
        try {
          const folderItems: PlantaoFolderItem[] = JSON.parse(savedItemsStr);
          const updatedFolderItems = folderItems.filter((item) => item.id !== `item-from-ocorrencia-${id}`);
          savePlantaoItemsToRtdb(updatedFolderItems);
        } catch (e) {
          console.error('Error deleting linked folder item:', e);
        }
      }
    }
  };

  const handleClearAllRecords = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os registros da pasta de ocorrências?')) {
      saveRecords([]);
      clearAllOcorrenciasFromRtdb();
    }
  };

  const handleSaveUpdate = (
    recordId: string,
    updateData: {
      novoTexto: string;
      novoStatus: PlantaoStatus;
      temSubstituicao: boolean;
      placaSubstituta?: string;
      condutorSubstituto?: string;
    }
  ) => {
    saveRecords(
      records.map((r) => {
        if (r.id === recordId) {
          const nowStr = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
          const existingHistorico = r.atualizacao?.historico || [];
          return {
            ...r,
            status: updateData.novoStatus,
            atualizacao: {
              temSubstituicao: updateData.temSubstituicao,
              placaSubstituta: updateData.placaSubstituta,
              condutorSubstituto: updateData.condutorSubstituto,
              descricaoRetorno: updateData.novoTexto || r.atualizacao?.descricaoRetorno || '',
              historico: [
                ...existingHistorico,
                {
                  dataHora: nowStr,
                  operador: getCurrentUser()?.fixedName || 'Operador Central',
                  texto: updateData.novoTexto,
                },
              ],
            },
          };
        }
        return r;
      })
    );
    setIsUpdateModalOpen(false);
    setRecordToUpdate(null);
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchSearch =
        item.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.operador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.observacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unidadeTransportadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.eventualidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricaoOcorrencia.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchOperacao = selectedOperacao === 'all' || item.operacao === selectedOperacao;
      const matchTurno = selectedTurno === 'all' || item.turno === selectedTurno;

      return matchSearch && matchStatus && matchOperacao && matchTurno;
    });
  }, [records, searchTerm, selectedStatus, selectedOperacao, selectedTurno]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in text-slate-200">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#17130e] via-[#10151f] to-[#0c1017] border border-[#c9a265]/35 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(201,162,101,0.15),transparent_70%)] pointer-events-none" />

        <div className="flex items-center space-x-3.5 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a265] to-[#8f6826] flex items-center justify-center shadow-lg shadow-[#c9a265]/25 flex-shrink-0">
            <ClipboardList className="w-6 h-6 text-[#140e06] stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl 2xl:text-2xl font-bold text-white tracking-tight font-serif">
                Ocorrências
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#c9a265]/20 border border-[#c9a265]/40 text-[#dfbe85] text-[10.5px] font-bold font-mono uppercase tracking-wider">
                Central 24H
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Monitoramento de Ocorrências em Trânsito, Operações e Transição de Turno &bull; Grupo 3corações
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5 z-10">
          <div className="flex items-center rounded-xl bg-[#121824] border border-[#232f45] p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#c9a265] text-[#140e06] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Lista / Tabela</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#c9a265] text-[#140e06] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => {
                setEditingRecord(null);
                setViewMode('nova_ocorrencia');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'nova_ocorrencia'
                  ? 'bg-gradient-to-r from-[#dfbe85] to-[#c9a265] text-[#0c1017] shadow-lg shadow-[#c9a265]/30'
                  : 'text-[#dfbe85] hover:text-white hover:bg-[#1a2436]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nova Ocorrência 3D</span>
            </button>
          </div>

          {records.length > 0 && isMaster && (
            <button
              onClick={handleClearAllRecords}
              className="px-3.5 py-2 rounded-xl bg-[#1c1214] border border-rose-900/50 hover:border-rose-500 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Limpar todos os registros da pasta"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Limpar Registros</span>
            </button>
          )}

          {currentUserObj && (
            <button
              onClick={() => {
                setEditingRecord(null);
                setViewMode('nova_ocorrencia');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#dfbe85] via-[#c9a265] to-[#a37c3f] hover:brightness-110 text-[#140e06] font-bold text-xs flex items-center space-x-2 shadow-lg shadow-[#c9a265]/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nova Ocorrência 3D</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'nova_ocorrencia' ? (
        <NovaOcorrencia3DView
          onSave={(rec) => {
            handleSaveRecord(rec);
            setViewMode('table');
          }}
          onCancel={() => setViewMode('table')}
          editingRecord={editingRecord}
        />
      ) : (
        <>
      {/* Search & Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#0f141d] border border-[#1e2738] shadow-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, eventualidade, operador..."
              className="w-full pl-9 pr-4 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Operação Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedOperacao}
              onChange={(e) => setSelectedOperacao(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs font-semibold text-slate-200 focus:outline-none transition-all"
            >
              <option value="all">Todas as Operações</option>
              <option value="transferencia">Transferência</option>
              <option value="dedicado">Dedicado</option>
              <option value="distribuição risco">Distribuição Risco</option>
              <option value="distribuição geral">Distribuição Geral</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs font-semibold text-slate-200 focus:outline-none transition-all"
            >
              <option value="all">Todos os Status ({records.length})</option>
              <option value="acompanhar">Acompanhar</option>
              <option value="resolvido">Resolvido</option>
              <option value="para conhecimento">Para Conhecimento</option>
              <option value="atenção">Atenção</option>
              <option value="registro grid">Registrado no Grid</option>
            </select>
          </div>

          {/* Turno Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedTurno}
              onChange={(e) => setSelectedTurno(e.target.value)}
              className="w-full px-3 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs font-semibold text-slate-200 focus:outline-none transition-all"
            >
              <option value="all">Todos os Turnos</option>
              <option value="Turno A (06:00 - 18:00)">Turno A</option>
              <option value="Turno B (18:00 - 06:00)">Turno B</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List / Table View */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl border border-[#232f45] bg-[#0c1017] shadow-xl overflow-hidden">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121927] border-b border-[#232f45] text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3.5 px-4 text-center">REGISTRO</th>
                  <th className="py-3.5 px-4 text-center">Operador</th>
                  <th className="py-3.5 px-4 text-center">Operação</th>
                  <th className="py-3.5 px-4 text-center">PLACA / TRANSPORTADORA</th>
                  <th className="py-3.5 px-4 text-center">Eventualidade / Ocorrência</th>
                  <th className="py-3.5 px-4 text-center">Atualização & Retorno</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2535]">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 px-4">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-[#171e2c] border border-[#26354d] flex items-center justify-center text-[#c9a265] shadow-inner">
                          <ClipboardList className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-white">Nenhum registro de ocorrência</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          A pasta de ocorrências está limpa e sem pendências no momento. Clique no botão abaixo para adicionar um novo registro operacional.
                        </p>
                        <button
                          onClick={() => {
                            setEditingRecord(null);
                            setIsRecordModalOpen(true);
                          }}
                          className="mt-2 px-4 py-2 rounded-xl bg-[#c9a265] hover:bg-[#dfbe85] text-[#140e06] font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-[#c9a265]/20"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Cadastrar Primeira Ocorrência</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
                    const statusCfg = STATUS_CONFIG[item.status] || {
                      label: item.status,
                      badgeBg: 'bg-slate-800',
                      badgeText: 'text-slate-200',
                      badgeBorder: 'border-slate-700',
                      dotColor: 'bg-slate-400',
                    };
                    const opCfg = item.operacao ? OPERACAO_CONFIG[item.operacao] : null;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#121927]/60 transition-colors group"
                      >
                        {/* Data / Hora / Turno */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center space-x-1.5 text-white font-mono font-bold text-xs justify-center">
                              <Clock className="w-3 h-3 text-[#dfbe85]" />
                              <span>{item.dataRegistro}</span>
                              <span className="text-[#dfbe85]">{item.horaRegistro}</span>
                            </div>
                            <div className="text-[10.5px] text-slate-400 mt-0.5 text-center">
                              {item.turno}
                            </div>
                          </div>
                        </td>

                        {/* Operador CCO */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center space-x-1.5 text-slate-200 font-medium justify-center">
                              <User className="w-3.5 h-3.5 text-[#c9a265]" />
                              <span className="font-semibold text-[13px]">{item.operador}</span>
                            </div>
                          </div>
                        </td>

                        {/* Operação */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {opCfg ? (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider border ${opCfg.badgeBg} ${opCfg.badgeText} ${opCfg.badgeBorder}`}
                              >
                                {opCfg.label}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            )}
                          </div>
                        </td>

                        {/* Transportadora & Placa */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center">
                              <PlacaMercosul placa={item.placa} />
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1.5 font-semibold text-center">
                              {getCarrierName(item.placa, item.unidadeTransportadora)}
                            </div>
                          </div>
                        </td>

                        {/* Eventualidade & Descrição */}
                        <td className="py-3.5 px-4 align-top max-w-xs text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="font-bold text-white text-xs text-center">
                              {item.eventualidade}
                            </div>
                            {renderTruncatedText(item.descricaoOcorrencia, item.id, false)}
                          </div>
                        </td>

                        {/* Atualização & Retorno */}
                        <td className="py-3.5 px-4 align-top max-w-xs text-center">
                          <div className="flex flex-col items-center justify-center">
                            {item.atualizacao?.temSubstituicao && item.atualizacao.placaSubstituta && (
                              <div className="mb-2 flex flex-col items-center space-y-1">
                                <span className="text-[10px] text-amber-300 font-extrabold uppercase">Placa Sub:</span>
                                <PlacaMercosul placa={item.atualizacao.placaSubstituta} />
                              </div>
                            )}
                            {renderTruncatedText(item.atualizacao?.descricaoRetorno || 'Sem retorno registrado.', item.id, true)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            {currentUserObj ? (
                              <div className="relative inline-block">
                                <select
                                  value={item.status}
                                  onChange={(e) => handleStatusChange(item.id, e.target.value as PlantaoStatus)}
                                  className={`appearance-none pl-3 pr-7 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider border outline-none cursor-pointer transition-all ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder} focus:ring-1 focus:ring-[#c9a265] text-center`}
                                >
                                  <option value="acompanhar" className="bg-[#0f141d] text-blue-400">Acompanhar</option>
                                  <option value="resolvido" className="bg-[#0f141d] text-emerald-400">Resolvido</option>
                                  <option value="para conhecimento" className="bg-[#0f141d] text-slate-300">Para Conhecimento</option>
                                  <option value="atenção" className="bg-[#0f141d] text-amber-400">Atenção</option>
                                  <option value="registro grid" className="bg-[#0f141d] text-purple-300">Registrado no Grid</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-[#c9a265] absolute right-2 top-2 pointer-events-none" />
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                                <span>{statusCfg.label}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setRecordToUpdate(item);
                                setIsUpdateModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#141b28] hover:bg-[#202c42] text-slate-300 hover:text-white border border-[#232f45] transition-all cursor-pointer"
                              title="Adicionar Atualização / Retorno"
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5 text-[#dfbe85]" />
                            </button>
                            {isMaster && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingRecord(item);
                                    setIsRecordModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-[#141b28] hover:bg-[#202c42] text-slate-300 hover:text-white border border-[#232f45] transition-all cursor-pointer"
                                  title="Editar Ocorrência"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(item.id)}
                                  className="p-1.5 rounded-lg bg-[#141b28] hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-[#232f45] transition-all cursor-pointer"
                                  title="Excluir Ocorrência"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        filteredRecords.length === 0 ? (
          <div className="p-12 rounded-2xl border border-[#232f45] bg-[#0c1017] shadow-xl text-center">
            <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#171e2c] border border-[#26354d] flex items-center justify-center text-[#c9a265] shadow-inner">
                <ClipboardList className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Nenhum registro de ocorrência</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A pasta de ocorrências está limpa e sem pendências no momento. Clique no botão abaixo para adicionar um novo registro operacional.
              </p>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setIsRecordModalOpen(true);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#c9a265] hover:bg-[#dfbe85] text-[#140e06] font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-[#c9a265]/20"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Cadastrar Primeira Ocorrência</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((item) => {
            const statusCfg = STATUS_CONFIG[item.status] || {
              label: item.status,
              badgeBg: 'bg-slate-800',
              badgeText: 'text-slate-200',
              badgeBorder: 'border-slate-700',
              dotColor: 'bg-slate-400',
            };
            const opCfg = item.operacao ? OPERACAO_CONFIG[item.operacao] : null;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-gradient-to-b from-[#151b27] via-[#101520] to-[#0c1017] border border-[#232f45] hover:border-[#c9a265] transition-all shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top line: Data/Hora & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#dfbe85] flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.dataRegistro} {item.horaRegistro}</span>
                    </span>
                    {currentUserObj ? (
                      <div className="relative inline-block">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as PlantaoStatus)}
                          className={`appearance-none pl-2.5 pr-6.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border outline-none cursor-pointer transition-all ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder} focus:ring-1 focus:ring-[#c9a265]`}
                        >
                          <option value="acompanhar" className="bg-[#0f141d] text-blue-400">Acompanhar</option>
                          <option value="resolvido" className="bg-[#0f141d] text-emerald-400">Resolvido</option>
                          <option value="para conhecimento" className="bg-[#0f141d] text-slate-300">Para Conhecimento</option>
                          <option value="atenção" className="bg-[#0f141d] text-amber-400">Atenção</option>
                          <option value="registro grid" className="bg-[#0f141d] text-purple-300">Registrado no Grid</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-[#c9a265] absolute right-1.5 top-1.5 pointer-events-none" />
                      </div>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                      >
                        {statusCfg.label}
                      </span>
                    )}
                  </div>

                  {/* Operação & Placa */}
                  <div className="flex items-center justify-between">
                    <div>
                      <PlacaMercosul placa={item.placa} />
                    </div>
                    {opCfg && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${opCfg.badgeBg} ${opCfg.badgeText} ${opCfg.badgeBorder}`}
                      >
                        {opCfg.label}
                      </span>
                    )}
                  </div>

                  {/* Transportadora & Operador */}
                  <div className="text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-semibold">{getCarrierName(item.placa, item.unidadeTransportadora)}</span>
                    <span className="text-slate-400 font-medium">Por: {item.operador}</span>
                  </div>

                  {/* Eventualidade & Descrição */}
                  <div className="p-3 rounded-xl bg-[#090d14] border border-[#1e2738] space-y-1">
                    <div className="font-bold text-white text-xs">{item.eventualidade}</div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {item.descricaoOcorrencia}
                    </p>
                  </div>

                  {/* Retorno */}
                  {item.atualizacao?.descricaoRetorno && (
                    <div className="p-3 rounded-xl bg-[#0c121d] border border-[#223046] space-y-1">
                      <div className="text-[10px] font-bold uppercase text-[#dfbe85] tracking-wider">
                        Atualização / Retorno:
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {item.atualizacao.descricaoRetorno}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[#1d273a] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setRecordToUpdate(item);
                      setIsUpdateModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#141b28] hover:bg-[#202c42] text-xs font-semibold text-[#dfbe85] flex items-center space-x-1.5 border border-[#232f45] transition-all cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>+ Retorno</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {isMaster && (
                      <>
                        <button
                          onClick={() => {
                            setEditingRecord(item);
                            setIsRecordModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[#141b28] hover:bg-[#202c42] text-slate-300 hover:text-white border border-[#232f45] transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(item.id)}
                          className="p-1.5 rounded-lg bg-[#141b28] hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-[#232f45] transition-all cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}
      </>
      )}

      {/* Modals */}
      <PlantaoRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        editingRecord={editingRecord}
      />

      <AddPlantaoUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setRecordToUpdate(null);
        }}
        record={recordToUpdate}
        onSaveUpdate={handleSaveUpdate}
      />
    </div>
  );
}
