import { formatDate } from '../utils';
import React, { useState, useEffect } from 'react';
import { Trip, ItineraryItem, CheckIn, TripStatus, UserProfile } from '../types';
import { CompanionsList } from './CompanionsList';
import { ContactsPickerModal } from './ContactsPickerModal';
import { SelectingCoverModal } from './SelectingCoverModal';
import { CountryFlag } from './CountryFlag';
import { TripDashboardBento } from './TripDashboardBento';
import { MileaLogo } from './MileaLogo';
import { MileaLogoHorizontal } from './MileaLogoHorizontal';
import { AuthMenu } from './AuthMenu';
import { SiteHeader } from './SiteHeader';
import {
  X,
  Star,
  Calendar,
  DollarSign,
  MapPin,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
  ExternalLink,
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  ArrowLeft,
  Sun,
  Map as MapIcon,
  User,
  NotebookPen,
  Check,
  TrendingUp,
  Wallet,
  PlaneTakeoff,
  Search
} from 'lucide-react';

interface TripDetailModalProps {
  trip: Trip | null;
  checkins: CheckIn[];
  onClose: () => void;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  onEditTripDetails?: (trip: Trip) => void;
  onOpenCheckinForTrip: (trip: Trip) => void;
  currencySymbol?: string;
  user?: UserProfile | null;
  onUserChange?: (user: UserProfile | null) => void;
  onOpenCustomization?: () => void;
  onTabChange?: (tab: string) => void;
  onOpenTripForm?: () => void;
  onOpenSearch?: () => void;
  searchQuery?: string;
}

const PRESET_COVERS = [
  { label: 'Praia Tropical', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Montanhas & Fiordes', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cidade Européia', url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Bali & Natureza', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Florestas & Neve', url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Deserto & Dunas', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80' }
];

const PRESET_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1476514525535-ce74f458112d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&w=800&q=80'
];

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
  trip,
  checkins,
  onClose,
  onUpdateTrip,
  onDeleteTrip,
  onEditTripDetails,
  onOpenCheckinForTrip,
  currencySymbol = 'R$',
  user,
  onUserChange,
  onOpenCustomization,
  onTabChange,
  onOpenTripForm,
  onOpenSearch,
  searchQuery,
}) => {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'gallery' | 'notes' | 'checkins'>('itinerary');

  // Itinerary state
  const [showAddItineraryForm, setShowAddItineraryForm] = useState(false);
  const [newPlace, setNewPlace] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newDay, setNewDay] = useState(1);
  const [newDesc, setNewDesc] = useState('');
  const [newCost, setNewCost] = useState<number | undefined>(undefined);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  // Gallery state
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  // Title edit
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Quick Inline Edits (Date, Budget, Status)
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudget, setEditBudget] = useState<number>(0);

  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editStatus, setEditStatus] = useState<TripStatus>('planned');

  // Cover image modal state
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState('');

  // Contacts modal state
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);

  useEffect(() => {
    if (trip) {
      setEditStartDate(trip.startDate || '');
      setEditEndDate(trip.endDate || '');
      setEditBudget(trip.budget || 0);
      setEditStatus(trip.status || 'planned');
    }
  }, [trip]);

  if (!trip) return null;

  const tripCheckins = checkins.filter((c) => c.tripId === trip.id);

  // Financial calculations
  const totalItineraryCost = (trip.itinerary || []).reduce((acc, item) => acc + (item.cost || 0), 0);
  const remainingBudget = (trip.budget || 0) - totalItineraryCost;

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateTrip({ ...trip, title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSelectCover = (url: string) => {
    if (!url.trim()) return;
    onUpdateTrip({ ...trip, coverImage: url.trim() });
    setShowCoverSelector(false);
    setCustomCoverUrl('');
  };

  const handleToggleItineraryItem = (itemId: string) => {
    const updatedItinerary = trip.itinerary.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onUpdateTrip({ ...trip, itinerary: updatedItinerary });
  };

  const handleDeleteItineraryItem = (itemId: string) => {
    const updatedItinerary = trip.itinerary.filter((item) => item.id !== itemId);
    onUpdateTrip({ ...trip, itinerary: updatedItinerary });
  };

  const handleAddItineraryItem = () => {
    if (!newPlace.trim()) return;

    const newItem: ItineraryItem = {
      id: Date.now().toString(),
      day: newDay,
      time: newTime || '10:00',
      place: newPlace.trim(),
      description: newDesc.trim(),
      cost: newCost && newCost > 0 ? newCost : undefined,
      done: false,
    };

    onUpdateTrip({
      ...trip,
      itinerary: [...(trip.itinerary || []), newItem],
    });

    setNewPlace('');
    setNewDesc('');
    setNewCost(undefined);
    setShowAddItineraryForm(false);
  };

  const handleSaveEditedItineraryItem = () => {
    if (!editingItem || !editingItem.place.trim()) return;

    const updatedItinerary = trip.itinerary.map((item) =>
      item.id === editingItem.id ? editingItem : item
    );

    onUpdateTrip({ ...trip, itinerary: updatedItinerary });
    setEditingItem(null);
  };

  const handleAddPhoto = (urlToAdd?: string) => {
    const targetUrl = urlToAdd || newPhotoUrl;
    if (!targetUrl.trim()) return;
    onUpdateTrip({
      ...trip,
      gallery: [...(trip.gallery || []), targetUrl.trim()],
    });
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const updatedGallery = (trip.gallery || []).filter((_, idx) => idx !== indexToRemove);
    onUpdateTrip({
      ...trip,
      gallery: updatedGallery,
    });
  };

  const handleRemoveParticipant = (indexToRemove: number) => {
    const updatedParticipants = (trip.participants || []).filter((_, idx) => idx !== indexToRemove);
    onUpdateTrip({
      ...trip,
      participants: updatedParticipants,
    });
  };

  const handleSaveNotes = () => {
    onUpdateTrip({
      ...trip,
      notes: notesText,
    });
    setIsEditingNotes(false);
  };

  const handleConfirmDeleteTrip = () => {
    if (confirm(`Tem certeza que deseja excluir a viagem "${trip.title}"?`)) {
      onDeleteTrip(trip.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#eef2f6] dark:bg-[#121316] text-slate-900 dark:text-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-300 w-full h-[100dvh] overflow-y-auto">
      {/* Header Banner Section with Background Image going behind the Site Header */}
      <div className="relative w-full min-h-[300px] sm:min-h-[340px] md:min-h-[380px] overflow-hidden shrink-0 bg-[#eef2f6] dark:bg-[#121316] flex flex-col justify-between">
        {/* Banner Cover Image Background (Sits directly behind the header and overlays) */}
        <img
          src={trip.coverImage || (trip.gallery && trip.gallery[0]) || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80'}
          alt={trip.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80 dark:opacity-60"
        />
        {/* Gradient Overlay for high legibility in light & dark modes */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/40 to-[#eef2f6] dark:from-slate-950/85 dark:via-slate-950/40 dark:to-[#121316] pointer-events-none" />

        {/* Site Navigation Header (Unificado sem tarja) */}
        <SiteHeader
          activeTab="roteiro"
          onTabChange={(tab) => {
            onClose();
            onTabChange?.(tab);
          }}
          onOpenTripForm={() => onOpenTripForm?.()}
          onOpenSearch={() => onOpenSearch?.()}
          searchQuery={searchQuery}
          user={user || null}
          onUserChange={onUserChange || (() => {})}
          onOpenCustomization={onOpenCustomization}
        />

        {/* Header Overlay Controls & Content */}
        <div className="relative z-20 p-4 sm:p-6 md:p-8 flex flex-col justify-between w-full max-w-[1720px] mx-auto px-4 sm:px-8 flex-1">
          {/* Top Row: Botões 50px Glassmorphism (Editar Capa & Editar Roteiro) */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCoverSelector(true);
              }}
              className="w-[50px] h-[50px] bg-white/30 dark:bg-white/20 hover:bg-white/50 dark:hover:bg-white/30 backdrop-blur-md text-[#001f3f] dark:text-white rounded-full transition border border-white/40 shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
              title="Editar Capa"
            >
              <Camera className="w-5 h-5" />
            </button>

            {onEditTripDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTripDetails(trip);
                }}
                className="w-[50px] h-[50px] bg-white/30 dark:bg-white/20 hover:bg-white/50 dark:hover:bg-white/30 backdrop-blur-md text-[#001f3f] dark:text-white rounded-full transition border border-white/40 shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
                title="Editar Roteiro"
              >
                <NotebookPen className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom Row: Banner Info (Country next to Flag, City underneath) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-4">
            <div>
              {/* Country beside Flag */}
              <div className="inline-flex items-center gap-2 mb-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-[#001f3f]/80 backdrop-blur-[15px] border border-white/60 dark:border-white/10 shadow-sm text-xs font-bold tracking-wide uppercase text-[#007ea7] dark:text-[#a3e635]">
                <CountryFlag country={trip.country} />
                <span>{trip.country || 'Destino'}</span>
              </div>

              {/* City underneath */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#001f3f] dark:text-white tracking-tight leading-tight">
                {trip.destination || trip.title}
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs font-medium">
              {trip.startDate && (
                <div className="flex items-center gap-1.5 bg-white text-[#001f3f] border border-slate-200/80 dark:bg-[#001f3f] dark:text-white dark:border-white/20 backdrop-blur-[15px] px-3.5 py-1.5 rounded-full shadow-md font-extrabold text-xs">
                  <Calendar className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635]" />
                  <span>{formatDate(trip.startDate)} {trip.endDate ? `a ${formatDate(trip.endDate)}` : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Bento Grid Container */}
      <div className="p-2 sm:p-4 md:p-6 w-full max-w-[1720px] mx-auto px-4 sm:px-8 flex-1">
        <TripDashboardBento
          trips={[trip]}
          activeTrip={trip}
          checkins={checkins}
          onSaveTrip={(updatedTrip) => onUpdateTrip(updatedTrip)}
          onDeleteTrip={(tripId) => {
            onDeleteTrip(tripId);
            onClose();
          }}
          onOpenEditTrip={(t) => {
            if (onEditTripDetails) {
              onEditTripDetails(t);
            }
          }}
          onOpenMapTab={() => {
            onClose();
          }}
        />
      </div>

      {/* Rodapé Glassmorphism em Barra Contínua na Base da Página de Roteiros */}
      <footer className="w-full backdrop-blur-[15px] shadow-2xl relative z-30 shrink-0 mt-4 sm:mt-6 py-6 bg-white/10 dark:bg-[#001f3f]/10 border-t border-white/60 dark:border-white/10">
        <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              © {new Date().getFullYear()} Melia. Todos os direitos reservados.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Planejamento inteligente de roteiros, mapas interativos e memórias inesquecíveis.
            </p>
          </div>

          <div 
            onClick={() => {
              onClose();
              onTabChange?.('home');
            }}
            className="flex items-center cursor-pointer transition hover:opacity-90 shrink-0"
          >
            <div className="hidden md:flex">
              <MileaLogoHorizontal size="md" />
            </div>
            <div className="md:hidden flex">
              <MileaLogoHorizontal size="sm" />
            </div>
          </div>
        </div>
      </footer>

      {/* CONTACTS PICKER MODAL */}
      <ContactsPickerModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        onAddParticipants={(newCompanions) => {
          onUpdateTrip({
            ...trip,
            participants: [...(trip.participants || []), ...newCompanions],
          });
        }}
        existingParticipants={trip.participants || []}
      />

      {/* SELECTING COVER MODAL */}
      <SelectingCoverModal
        isOpen={showCoverSelector}
        onClose={() => setShowCoverSelector(false)}
        trip={trip}
        onSelectCover={handleSelectCover}
      />
    </div>
  );
};
