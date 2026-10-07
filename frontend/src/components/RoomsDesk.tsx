import React, { useState } from 'react';
import { DoorOpen, MapPin, CheckCircle2, Plus, X, Users, Sparkles } from 'lucide-react';
import { Room } from '../types';
import { api } from '../services/api';

interface RoomsDeskProps {
  rooms: Room[];
  onRefresh: () => void;
  onReserveRoom: (room: Room) => void;
}

export const RoomsDesk: React.FC<RoomsDeskProps> = ({ rooms, onRefresh, onReserveRoom }) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [formData, setFormData] = useState({
    RoomName: '',
    Location: '',
    Capacity: 8,
    Amenities: '',
    IsAvailable: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createRoom({
      ...formData,
      Amenities: formData.Amenities || '4K Display, Smart Video Bar, Whiteboard'
    });
    setShowDrawer(false);
    setFormData({ RoomName: '', Location: '', Capacity: 8, Amenities: '', IsAvailable: true });
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Conference & Meeting Rooms</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor room availability, equipment specs, and reserve meeting spaces.
          </p>
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Conference Room</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room) => (
          <div
            key={room.RoomId}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/40">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Available</span>
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">{room.RoomName}</h3>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{room.Location}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Capacity:</span>
                  <span className="font-semibold">{room.Capacity} Persons</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Amenities:</span>
                  <span className="font-medium text-right text-slate-700 dark:text-slate-300 line-clamp-2">{room.Amenities || 'Standard Display, Video Pod'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onReserveRoom(room)}
              className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Quick Reserve
            </button>
          </div>
        ))}
      </div>

      {/* Add Room Slide-Over Drawer from Right */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setShowDrawer(false)}
          />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Conference Room</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure conference hall or meeting room facilities</p>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="room-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter conference room name (e.g. Executive Boardroom 101)"
                    value={formData.RoomName}
                    onChange={(e) => setFormData({ ...formData, RoomName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Location / Floor / Wing *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter room location (e.g. Floor 3, East Wing, Tower 1)"
                    value={formData.Location}
                    onChange={(e) => setFormData({ ...formData, Location: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Seating Capacity (Persons) *
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="200"
                    required
                    placeholder="Enter max person capacity (e.g. 12)"
                    value={formData.Capacity}
                    onChange={(e) => setFormData({ ...formData, Capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Amenities & Hardware Facilities
                  </label>
                  <input
                    type="text"
                    placeholder="Enter room amenities (e.g. 4K Display, Polycom Video Bar, Dual Whiteboard)"
                    value={formData.Amenities}
                    onChange={(e) => setFormData({ ...formData, Amenities: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </form>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  form="room-form"
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20"
                >
                  Create Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
