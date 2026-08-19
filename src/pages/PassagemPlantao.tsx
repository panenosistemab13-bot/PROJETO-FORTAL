import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  UserPlus,
  Search,
  Filter,
  Move3D,
  RotateCw,
  Sparkles,
  LayoutGrid,
  Layers,
  Sun,
  Moon,
  Clock,
  Shield,
  Coffee,
  Heart,
  ChevronDown,
  User,
  Plus,
  Eye,
  SlidersHorizontal,
  Flame,
  Award,
  Image as ImageIcon,
  Check,
  Truck,
  Sparkle,
} from 'lucide-react';

import { PlantaoUser, PlantaoFolderItem, FuncaoType, TurnoType, PeriodoType } from '../types/plantao3d';
import { INITIAL_PLANTAO_USERS, INITIAL_PLANTAO_ITEMS } from '../data/initialPlantaoUsers';
import { getCurrentUser } from '../lib/authStore';
import {
  subscribeToPlantaoUsers,
  savePlantaoUsersToRtdb,
  subscribeToPlantaoItems,
  savePlantaoItemsToRtdb,
} from '../lib/realtimeDb';
import {
  FestivalCafe360Viewer,
  WALLPAPERS_360_THEMES,
  Wallpaper360Theme,
} from '../components/plantao3d/FestivalCafe360Viewer';
import { UserFolderCard } from '../components/plantao3d/UserFolderCard';
import { FolderDetailModal } from '../components/plantao3d/FolderDetailModal';
import { UserManagementModal } from '../components/plantao3d/UserManagementModal';
import { AddFolderItemModal } from '../components/plantao3d/AddFolderItemModal';

import iconFolder3d from '../assets/images/icon_folder_3d_1787015156529.jpg';
import iconCoffee3d from '../assets/images/icon_coffee_3d_1787015165985.jpg';
import iconBadge3d from '../assets/images/icon_badge_3d_1787015174678.jpg';
import iconTruck3d from '../assets/images/icon_truck_3d_1787015195876.jpg';

export function PassagemPlantao() {
  // 1. Persistent Users & Folder Items state (Synced in Real-Time with Firebase RTDB)
  const [users, setUsers] = useState<PlantaoUser[]>(() => {
    const saved = localStorage.getItem('plantao_users_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved plantao users', e);
      }
    }
    return INITIAL_PLANTAO_USERS;
  });

  const [items, setItems] = useState<PlantaoFolderItem[]>(() => {
    const saved = localStorage.getItem('plantao_items_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved plantao items', e);
      }
    }
    return INITIAL_PLANTAO_ITEMS;
  });

  // Subscribe to Firebase Realtime Database
  useEffect(() => {
    const unsubUsers = subscribeToPlantaoUsers((rtdbUsers) => {
      if (rtdbUsers && rtdbUsers.length > 0) {
        setUsers(rtdbUsers);
      }
    });
    const unsubItems = subscribeToPlantaoItems((rtdbItems) => {
      if (rtdbItems) {
        setItems(rtdbItems);
      }
    });
    return () => {
      unsubUsers();
      unsubItems();
    };
  }, []);

  // 2. Active Logged-in Operator selector (defaults to logged-in user linked folder or Cristiane Fialho)
  const [currentActiveUserId, setCurrentActiveUserId] = useState<string>(() => {
    const activeAuthUser = getCurrentUser();
    if (activeAuthUser?.plantaoFolderId) {
      return activeAuthUser.plantaoFolderId;
    }
    const saved = localStorage.getItem('plantao_active_user_id');
    return saved || 'user-cristiane-fialho';
  });

  // 3. Active 360 Theme / Wallpaper in 4K
  const [activeWallpaperTheme, setActiveWallpaperTheme] = useState<Wallpaper360Theme>(() => {
    const savedId = localStorage.getItem('plantao_wallpaper_360_id');
    if (savedId) {
      const found = WALLPAPERS_360_THEMES.find((t) => t.id === savedId);
      if (found) return found;
    }
    return WALLPAPERS_360_THEMES[0];
  });

  // View Mode: 'mural3d' | 'grid'
  const [viewMode, setViewMode] = useState<'mural3d' | 'grid'>('mural3d');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurno, setFilterTurno] = useState<string>('all');
  const [filterPeriodo, setFilterPeriodo] = useState<string>('all');
  const [filterFuncao, setFilterFuncao] = useState<string>('all');

  // Modals state
  const [selectedFolderUser, setSelectedFolderUser] = useState<PlantaoUser | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlantaoUser | null>(null);

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [userForNewItem, setUserForNewItem] = useState<PlantaoUser | null>(null);
  const [editingItem, setEditingItem] = useState<PlantaoFolderItem | null>(null);

  useEffect(() => {
    localStorage.setItem('plantao_active_user_id', currentActiveUserId);
  }, [currentActiveUserId]);

  useEffect(() => {
    localStorage.setItem('plantao_wallpaper_360_id', activeWallpaperTheme.id);
  }, [activeWallpaperTheme]);

  // One-time clear of all mock data for the user
  useEffect(() => {
    if (items.length > 0) {
      const isMock = items.some(i => typeof i.id === 'string' && (i.id.includes('item-cf') || i.id.includes('item-ac') || i.id.includes('item-la') || i.id.includes('item-gf')));
      if (isMock) {
        // Find if there are any legit user-created items
        const legitItems = items.filter(i => !i.id.includes('item-cf') && !i.id.includes('item-ac') && !i.id.includes('item-la') && !i.id.includes('item-gf'));
        setItems(legitItems);
        savePlantaoItemsToRtdb(legitItems);
      }
    }
  }, [items]);

  const activeUser = useMemo(() => {
    return users.find((u) => u.id === currentActiveUserId) || users[0];
  }, [users, currentActiveUserId]);

  // Handlers for User Management (Synced with Firebase RTDB)
  const handleSaveUser = (savedUser: PlantaoUser) => {
    let updatedUsers: PlantaoUser[];
    if (editingUser) {
      updatedUsers = users.map((u) => (u.id === savedUser.id ? savedUser : u));
    } else {
      updatedUsers = [...users, savedUser];
    }
    setUsers(updatedUsers);
    savePlantaoUsersToRtdb(updatedUsers);
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    if (
      window.confirm(
        `Tem certeza que deseja remover a pasta e o usuário "${userToDelete.nome}" da Passagem de Plantão?`
      )
    ) {
      const updatedUsers = users.filter((u) => u.id !== userId);
      const updatedItems = items.filter((i) => i.userId !== userId);
      setUsers(updatedUsers);
      setItems(updatedItems);
      savePlantaoUsersToRtdb(updatedUsers);
      savePlantaoItemsToRtdb(updatedItems);

      if (currentActiveUserId === userId && users.length > 1) {
        const remaining = users.filter((u) => u.id !== userId);
        setCurrentActiveUserId(remaining[0].id);
      }
      if (selectedFolderUser?.id === userId) {
        setIsFolderModalOpen(false);
        setSelectedFolderUser(null);
      }
    }
  };

  // Handlers for Folder Items (Synced with Firebase RTDB)
  const handleSaveItem = (savedItem: PlantaoFolderItem) => {
    let updatedItems: PlantaoFolderItem[];
    if (editingItem) {
      updatedItems = items.map((i) => (i.id === savedItem.id ? savedItem : i));
    } else {
      updatedItems = [savedItem, ...items];
    }
    setItems(updatedItems);
    savePlantaoItemsToRtdb(updatedItems);
    setIsAddItemModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Tem certeza que deseja apagar este lançamento do seu turno?')) {
      const updatedItems = items.filter((i) => i.id !== itemId);
      setItems(updatedItems);
      savePlantaoItemsToRtdb(updatedItems);
    }
  };

  const handleToggleChecklist = (itemId: string, checkId: string) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId && item.checklistItems) {
        return {
          ...item,
          checklistItems: item.checklistItems.map((c) =>
            c.id === checkId ? { ...c, concluido: !c.concluido } : c
          ),
        };
      }
      return item;
    });
    setItems(updatedItems);
    savePlantaoItemsToRtdb(updatedItems);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.funcao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.turno.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTurno = filterTurno === 'all' || u.turno === filterTurno;
      const matchPeriodo = filterPeriodo === 'all' || u.periodo === filterPeriodo;
      const matchFuncao = filterFuncao === 'all' || u.funcao === filterFuncao;

      return matchSearch && matchTurno && matchPeriodo && matchFuncao;
    });
  }, [users, searchTerm, filterTurno, filterPeriodo, filterFuncao]);

  // Overall Stats
  const totalSummaries = items.filter((i) => i.tipo === 'resumo_turno').length;
  const totalOccurrences = items.filter((i) => i.tipo === 'ocorrencia').length;
  const totalChecklists = items.filter((i) => i.tipo === 'checklist').length;
  const totalPoints = items.filter((i) => i.tipo === 'pontuacao').length;

  return (
    <div className="relative space-y-6 pb-16 animate-fade-in text-slate-200">


      {/* Top Hero Banner with 3D Icons & 4K Theme Indicator */}
      <div className="relative z-10 rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-[#19130d] via-[#121825] to-[#0c1018] border-2 border-[#c9a265]/50 shadow-[0_15px_45px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Ambient Gold Radial Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-full bg-[radial-gradient(ellipse_at_top_right,rgba(201,162,101,0.22),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left Title & 3D Rendered Icons */}
          <div className="flex items-center space-x-4">
            {/* 3D Coffee Cup Icon */}
            <div className="relative w-16 h-16 rounded-3xl overflow-hidden border-2 border-[#c9a265] shadow-xl shadow-[#c9a265]/30 flex-shrink-0 bg-[#0c1017] group">
              <img
                src={iconCoffee3d}
                alt="Xícara de Café 3D"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <div>
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-2xl 2xl:text-3xl font-bold text-white tracking-tight font-serif">
                  Passagem de Plantão
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                Pastas Individuais dos Colaboradores &bull; Ambiente Virtual 360° em Ultra Definição 4K
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3D 360° Interactive Ultra HD 4K Viewer Canvas */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#dfbe85] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#c9a265]" />
            <span>Ambiente Virtual 360° em 4K &bull; {activeWallpaperTheme.name}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Move3D className="w-3.5 h-3.5 text-[#dfbe85]" />
            <span>Interativo 3D: arraste com o mouse para girar 360 graus</span>
          </div>
        </div>

        {/* 360 Interactive WebGL Three.js Component with 4K Texture Support */}
        <FestivalCafe360Viewer
          activeTheme={activeWallpaperTheme}
          onSelectHotspot={(hotspot) => {
            if (hotspot === 'mural') {
              const el = document.getElementById('mural-pastas-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      </div>


      {/* Section: Mural de Pastas */}
      <div id="mural-pastas-section" className="relative z-10 pt-2 space-y-4">
        {/* Search and Filters Bar - Hiddem per request */}
        {/* 
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0f141f]/95 border-2 border-[#1e283b] shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por colaborador ou função..."
                className="w-full pl-9 pr-4 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterTurno}
                onChange={(e) => setFilterTurno(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs text-slate-200 focus:outline-none transition-all"
              >
                <option value="all">Todos os Turnos (A, B, A e B)</option>
                <option value="Turno A">Turno A</option>
                <option value="Turno B">Turno B</option>
                <option value="Turno A e B">Turno A e B</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterPeriodo}
                onChange={(e) => setFilterPeriodo(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs text-slate-200 focus:outline-none transition-all"
              >
                <option value="all">Todos os Períodos</option>
                <option value="Diurno">Diurno (06:00 às 18:00)</option>
                <option value="Noturno">Noturno (18:00 às 06:00)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={filterFuncao}
                onChange={(e) => setFilterFuncao(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d14] border border-[#232f45] focus:border-[#c9a265] rounded-xl text-xs text-slate-200 focus:outline-none transition-all"
              >
                <option value="all">Todas Funções</option>
                <option value="Líder">Líder</option>
                <option value="Interino">Interino</option>
                <option value="Operador">Operador</option>
                <option value="Supervisor">Supervisor</option>
              </select>
            </div>
          </div>
        </div>
        */}

        {/* 3D Mural Display */}
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0e131d] border border-[#1e283b] space-y-2">
            <Folder className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              Nenhuma pasta encontrada para os filtros selecionados.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterTurno('all');
                setFilterPeriodo('all');
                setFilterFuncao('all');
              }}
              className="text-[#c9a265] text-xs font-bold hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 ${
              viewMode === 'mural3d' ? 'perspective-1000' : ''
            }`}
          >
            {filteredUsers.map((user) => (
              <UserFolderCard
                key={user.id}
                user={user}
                items={items}
                currentActiveUserId={currentActiveUserId}
                onOpenFolder={(u) => {
                  setSelectedFolderUser(u);
                  setIsFolderModalOpen(true);
                }}
                onEditUser={(u) => {
                  setEditingUser(u);
                  setIsUserModalOpen(true);
                }}
                onDeleteUser={handleDeleteUser}
                viewStyle={viewMode === 'mural3d' ? '3d' : 'classic'}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Folder Detail Modal */}
      {selectedFolderUser && (
        <FolderDetailModal
          isOpen={isFolderModalOpen}
          onClose={() => {
            setIsFolderModalOpen(false);
            setSelectedFolderUser(null);
          }}
          user={selectedFolderUser}
          items={items}
          currentActiveUserId={currentActiveUserId}
          onAddItem={(u) => {
            setUserForNewItem(u);
            setEditingItem(null);
            setIsAddItemModalOpen(true);
          }}
          onEditItem={(item) => {
            setUserForNewItem(selectedFolderUser);
            setEditingItem(item);
            setIsAddItemModalOpen(true);
          }}
          onDeleteItem={handleDeleteItem}
          onToggleChecklist={handleToggleChecklist}
        />
      )}

      {/* 2. User Management Modal (Add/Edit) */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />

      {/* 3. Add/Edit Folder Item Modal */}
      {userForNewItem && (
        <AddFolderItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => {
            setIsAddItemModalOpen(false);
            setUserForNewItem(null);
            setEditingItem(null);
          }}
          onSave={handleSaveItem}
          user={userForNewItem}
          editingItem={editingItem}
        />
      )}
    </div>
  );
}
