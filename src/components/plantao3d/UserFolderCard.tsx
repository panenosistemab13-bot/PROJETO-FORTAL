import React from 'react';
import {
  Edit2,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';
import { PlantaoUser, PlantaoFolderItem } from '../../types/plantao3d';
import { getCurrentUser, getAuthUsers } from '../../lib/authStore';

interface UserFolderCardProps {
  user: PlantaoUser;
  items: PlantaoFolderItem[];
  currentActiveUserId: string;
  onOpenFolder: (user: PlantaoUser) => void;
  onEditUser: (user: PlantaoUser) => void;
  onDeleteUser: (userId: string) => void;
  viewStyle?: '3d' | 'classic';
}

export function UserFolderCard({
  user,
  items,
  currentActiveUserId,
  onOpenFolder,
  onEditUser,
  onDeleteUser,
  viewStyle = '3d',
}: UserFolderCardProps) {
  const currentUser = getCurrentUser();
  const allAuthUsers = getAuthUsers();
  
  const matchedAuthUser = allAuthUsers.find(
    au => au.plantaoFolderName?.trim().toLowerCase() === user.nome.trim().toLowerCase() ||
          au.fixedName?.trim().toLowerCase() === user.nome.trim().toLowerCase() ||
          au.login?.trim().toLowerCase() === user.nome.trim().toLowerCase()
  );
  
  const profilePic = matchedAuthUser?.profilePic;

  const isMaster = currentUser?.role?.toLowerCase().includes('mestre') || currentUser?.role === 'Mestre';
  const isOwner = !!currentUser && (
    currentUser.plantaoFolderId === user.id ||
    currentUser.plantaoFolderName?.trim().toLowerCase() === user.nome.trim().toLowerCase() ||
    currentUser.fixedName?.trim().toLowerCase() === user.nome.trim().toLowerCase() ||
    currentUser.login?.trim().toLowerCase() === user.nome.trim().toLowerCase() ||
    currentUser.id === user.id ||
    currentActiveUserId === user.id
  );

  const canEditOrDelete = isMaster || isOwner;
  const userItems = items.filter((item) => item.userId === user.id);

  const occurrencesCount = userItems.filter((i) => i.tipo === 'ocorrencia').length;
  const summariesCount = userItems.filter((i) => i.tipo === 'resumo_turno').length;

  return (
    <div
      onClick={() => onOpenFolder(user)}
      className="group relative rounded-2xl p-4 border border-[#2b3c58] hover:border-[#c9a265] shadow-2xl hover:shadow-[0_12px_32px_rgba(201,162,101,0.2)] transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer select-none flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: profilePic ? `url(${profilePic})` : 'linear-gradient(to bottom, #182030, #121824, #0c1017)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background Overlay to ensure text readability */}
      {profilePic && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-[#0c1017]/85 to-[#0c1017]/45 pointer-events-none" />
      )}
      {!profilePic && (
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#c9a265]/5 to-transparent pointer-events-none" />
      )}

      {/* Content wrapper relative to overlay */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Lock/Unlock Icon top left */}
        <div className="absolute -top-1 -left-1" title={isOwner ? "Sua Pasta (Edição Ativa)" : "Mural Coletivo (Somente Leitura)"}>
          {isOwner ? (
            <Unlock className="w-3.5 h-3.5 text-emerald-400/70" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-slate-500/40" />
          )}
        </div>

        {/* Actions top right */}
        {canEditOrDelete && (
          <div className="absolute -top-2 -right-2 flex items-center space-x-0.5" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEditUser(user)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Editar">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDeleteUser(user.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Excluir">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Avatar Circle */}
        <div className="relative mt-1 mb-3">
          <div className="w-[68px] h-[68px] rounded-full bg-[#080c14] border border-[#c9a265]/40 group-hover:border-[#dfbe85] shadow-[0_0_15px_rgba(201,162,101,0.12)] flex items-center justify-center transition-all duration-300 overflow-hidden">
            {profilePic ? (
               <img src={profilePic} alt={user.nome} className="w-full h-full object-cover" />
            ) : (
               <span className="text-lg font-bold text-[#dfbe85] font-serif tracking-wider">
                 {user.avatarInitials}
               </span>
            )}
          </div>
          {/* Online Status Dot - Only visible when user is logged in (isOwner) */}
          {isOwner && (
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-[2.5px] border-[#121824] bg-emerald-500"
              title="Online"
            />
          )}
        </div>

        {/* Name & Role */}
        <h3 className="text-[15px] font-bold text-white font-serif tracking-tight text-center mb-1 drop-shadow-md">
          {user.nome}
        </h3>
        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest text-center flex items-center justify-center space-x-1.5 drop-shadow-md">
          <span className="text-[#c9a265]">{user.funcao}</span>
          {user.periodo && (
            <>
              <span className="text-slate-500">•</span>
              <span>{user.periodo}</span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#c9a265]/20 to-transparent mt-4 mb-3.5" />

        {/* Stats */}
        <div className="flex items-center justify-center space-x-8 w-full">
          <div className="flex flex-col items-center">
            <span className="text-[18px] font-black text-white font-mono leading-none mb-1 drop-shadow-md">{occurrencesCount}</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 drop-shadow-md">Ocorrências</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[18px] font-black text-white font-mono leading-none mb-1 drop-shadow-md">{summariesCount}</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 drop-shadow-md">Resumos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
