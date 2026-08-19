import { useState, useEffect } from 'react';
import { PlantaoItem, PlantaoStatus, PlantaoOperacao } from '../data/plantaoData';
import { PlantaoFolderItem } from '../types/plantao3d';

export interface OccurrencesStats {
  total24h: number;
  resolvidos: number;
  acompanhar: number;
  paraConhecimento: number;
  atencao: number;
  registroGrid: number;
  totalAllTime: number;
}

export function getAllOccurrencesItems(): PlantaoItem[] {
  let records: PlantaoItem[] = [];
  let folderItems: PlantaoFolderItem[] = [];

  try {
    const savedRecords = localStorage.getItem('plantao_records_v2');
    if (savedRecords) {
      records = JSON.parse(savedRecords);
    }
  } catch (e) {
    console.error('Error parsing plantao_records_v2', e);
  }

  try {
    const savedFolderItems = localStorage.getItem('plantao_items_v2');
    if (savedFolderItems) {
      folderItems = JSON.parse(savedFolderItems);
    }
  } catch (e) {
    console.error('Error parsing plantao_items_v2', e);
  }

  const folderConverted: PlantaoItem[] = folderItems
    .filter((fi) => fi.tipo === 'ocorrencia')
    .map((fi) => {
      let status: PlantaoStatus = 'para conhecimento';
      if (fi.statusOcorrencia) {
        status = fi.statusOcorrencia as PlantaoStatus;
      } else {
        if (fi.statusAcompanhamento === 'concluido') status = 'resolvido';
        else if (fi.statusAcompanhamento === 'acompanhar') status = 'acompanhar';
        else if (fi.statusAcompanhamento === 'pendente_proximo_turno') status = 'atenção';
      }

      const recordId = fi.id.startsWith('item-from-ocorrencia-')
        ? fi.id.replace('item-from-ocorrencia-', '')
        : `conv-${fi.id}`;

      return {
        id: recordId,
        dataRegistro: fi.data || '',
        horaRegistro: fi.hora || '',
        turno: 'Central',
        operador: fi.userName || 'Operador',
        observacao: fi.descricao || '',
        unidadeTransportadora: 'Central',
        placa: fi.veiculoPlaca || '-',
        operacao: (fi.tags && (fi.tags[0] as PlantaoOperacao)) || 'transferencia',
        eventualidade: fi.titulo || 'Ocorrência',
        descricaoOcorrencia: fi.descricao || '',
        status: status,
        atualizacao: {
          descricaoRetorno: '',
        },
        createdAt: fi.createdAt,
      };
    });

  const allItems = [...records.filter((r) => !r.id.startsWith('plantao-'))];
  for (const converted of folderConverted) {
    if (!allItems.some((r) => r.id === converted.id)) {
      allItems.push(converted);
    }
  }

  // Sort descending by createdAt or date/time
  allItems.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return b.createdAt - a.createdAt;
    }
    return b.id.localeCompare(a.id);
  });

  return allItems;
}

export function getOccurrencesStats(): OccurrencesStats {
  const allItems = getAllOccurrencesItems();

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const todayStr = new Date().toLocaleDateString('pt-BR');

  let total24h = 0;
  let resolvidos = 0;
  let acompanhar = 0;
  let paraConhecimento = 0;
  let atencao = 0;
  let registroGrid = 0;

  for (const item of allItems) {
    const is24h =
      (item.createdAt && item.createdAt >= twentyFourHoursAgo) ||
      item.dataRegistro === todayStr;

    if (is24h) {
      total24h++;
    }

    if (item.status === 'resolvido') resolvidos++;
    else if (item.status === 'acompanhar') acompanhar++;
    else if (item.status === 'para conhecimento') paraConhecimento++;
    else if (item.status === 'atenção') atencao++;
    else if (item.status === 'registro grid') registroGrid++;
  }

  return {
    total24h,
    resolvidos,
    acompanhar,
    paraConhecimento,
    atencao,
    registroGrid,
    totalAllTime: allItems.length,
  };
}

export function useOccurrencesStats(): OccurrencesStats {
  const [stats, setStats] = useState<OccurrencesStats>(getOccurrencesStats);

  useEffect(() => {
    const handleUpdate = () => {
      setStats(getOccurrencesStats());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('occurrences_updated', handleUpdate);

    handleUpdate();

    const interval = setInterval(handleUpdate, 1500);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('occurrences_updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  return stats;
}

export function useRecentOccurrences(limit = 6): PlantaoItem[] {
  const [items, setItems] = useState<PlantaoItem[]>(() =>
    getAllOccurrencesItems().slice(0, limit)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getAllOccurrencesItems().slice(0, limit));
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('occurrences_updated', handleUpdate);

    handleUpdate();

    const interval = setInterval(handleUpdate, 1500);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('occurrences_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [limit]);

  return items;
}
