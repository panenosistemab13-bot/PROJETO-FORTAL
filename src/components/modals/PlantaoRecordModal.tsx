import React from 'react';
import { createPortal } from 'react-dom';
import { PlantaoItem } from '../../data/plantaoData';
import { NovaOcorrencia3DView } from '../NovaOcorrencia3DView';

interface PlantaoRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: PlantaoItem) => void;
  editingRecord?: PlantaoItem | null;
}

export function PlantaoRecordModal({
  isOpen,
  onClose,
  onSave,
  editingRecord,
}: PlantaoRecordModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in custom-scroll">
      <div className="relative w-full max-w-7xl max-h-[92vh] overflow-y-auto custom-scroll bg-[#07090d] border border-[#c9a265]/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] p-4 sm:p-8 my-auto">
        <NovaOcorrencia3DView
          onSave={(record) => {
            onSave(record);
            onClose();
          }}
          onCancel={onClose}
          editingRecord={editingRecord}
        />
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
