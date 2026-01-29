/**
 * Admin Panel Component - Quick access to game management
 * Only visible to users with admin/owner role
 */

import React, { useState, useEffect } from 'react';
import { 
  isAdmin, 
  startPresetEvent, 
  startEvent, 
  endEvent, 
  getGameConfig,
  getBannedPlayers,
  getCheatLogs,
  unbanPlayer,
  EVENT_PRESETS,
  getEventsByCategory,
  SUGGESTED_CALENDAR,
  type GameConfig,
  type PlayerProfile,
  type CheatLogEntry,
  type EventCategory,
  type EventPreset,
  type EventMechanic
} from '../services/adminService';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'players' | 'logs'>('events');
  const [eventCategory, setEventCategory] = useState<EventCategory | 'all'>('all');
  
  // State
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [bannedPlayers, setBannedPlayers] = useState<PlayerProfile[]>([]);
  const [cheatLogs, setCheatLogs] = useState<CheatLogEntry[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Custom event form
  const [customEvent, setCustomEvent] = useState({
    name: '',
    description: '',
    expMult: 1.5,
    dropMult: 1.5,
    stonesMult: 1.5,
    hours: 24
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authorized = await isAdmin();
    setIsAuthorized(authorized);
    if (authorized) {
      await loadData();
    }
    setLoading(false);
  };

  const loadData = async () => {
    const [configData, banned, logs] = await Promise.all([
      getGameConfig(),
      getBannedPlayers(),
      getCheatLogs(50)
    ]);
    setConfig(configData);
    setBannedPlayers(banned);
    setCheatLogs(logs);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePresetEvent = async (preset: keyof typeof EVENT_PRESETS) => {
    const result = await startPresetEvent(preset);
    if (result.success) {
      showMessage('success', `🎉 Event started: ${EVENT_PRESETS[preset].name}`);
      await loadData();
    } else {
      showMessage('error', result.error || 'Failed to start event');
    }
  };

  const handleCustomEvent = async () => {
    if (!customEvent.name) {
      showMessage('error', 'Event name is required');
      return;
    }
    const result = await startEvent(
      customEvent.name,
      customEvent.description,
      customEvent.expMult,
      customEvent.dropMult,
      customEvent.stonesMult,
      customEvent.hours
    );
    if (result.success) {
      showMessage('success', `🎉 Custom event started!`);
      await loadData();
    } else {
      showMessage('error', result.error || 'Failed to start event');
    }
  };

  const handleEndEvent = async () => {
    const result = await endEvent();
    if (result.success) {
      showMessage('success', 'Event ended');
      await loadData();
    } else {
      showMessage('error', result.error || 'Failed to end event');
    }
  };

  const handleUnban = async (userId: string) => {
    const result = await unbanPlayer(userId);
    if (result.success) {
      showMessage('success', 'Player unbanned');
      await loadData();
    } else {
      showMessage('error', result.error || 'Failed to unban');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="text-yellow-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-red-600 p-6 rounded-lg max-w-md">
          <h2 className="text-red-500 text-xl mb-4">🚫 Access Denied</h2>
          <p className="text-gray-400 mb-4">You don't have admin permissions.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-yellow-600 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-yellow-600/50">
          <h2 className="text-xl font-bold text-yellow-400">👑 Admin Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(['events', 'players', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 capitalize ${activeTab === tab ? 'bg-yellow-600/20 text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400 hover:text-white'}`}
            >
              {tab === 'events' && '🎉 '}
              {tab === 'players' && '👥 '}
              {tab === 'logs' && '📋 '}
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Current Event Status */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-2">Current Status</h3>
                {config?.active_event ? (
                  <div className="space-y-2">
                    <p className="text-green-400">🎉 Active: {config.active_event}</p>
                    <p className="text-gray-400 text-sm">{config.event_description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-400">EXP: {config.exp_multiplier}x</span>
                      <span className="text-purple-400">Drops: {config.drop_rate_multiplier}x</span>
                      <span className="text-yellow-400">Stones: {config.spirit_stones_multiplier}x</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      Ends: {config.event_end ? new Date(config.event_end).toLocaleString() : 'N/A'}
                    </p>
                    <button
                      onClick={handleEndEvent}
                      className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm"
                    >
                      End Event Now
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500">No active event</p>
                )}
              </div>

              {/* Quick Events by Category */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">⚡ Eventos Dinâmicos</h3>
                
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { id: 'all', label: '📋 Todos', color: 'gray' },
                    { id: 'combat', label: '⚔️ Combate', color: 'red' },
                    { id: 'exploration', label: '🗺️ Exploração', color: 'green' },
                    { id: 'progression', label: '📈 Progressão', color: 'blue' },
                    { id: 'social', label: '🤝 Social', color: 'purple' },
                    { id: 'economy', label: '💰 Economia', color: 'yellow' },
                    { id: 'challenge', label: '🏆 Desafio', color: 'orange' },
                    { id: 'seasonal', label: '🎄 Sazonal', color: 'pink' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setEventCategory(cat.id as EventCategory | 'all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        eventCategory === cat.id 
                          ? `bg-${cat.color}-600 text-white` 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Mechanic Legend */}
                <div className="mb-4 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                  <span className="font-bold text-gray-300">Mecânicas: </span>
                  <span className="text-red-400">🐉 World Boss</span> • 
                  <span className="text-yellow-400"> 🎁 Coleção</span> • 
                  <span className="text-purple-400"> ⚡ Realm Rush</span> • 
                  <span className="text-orange-400"> 🔥 Elemento</span> • 
                  <span className="text-cyan-400"> 🗼 Survival</span> • 
                  <span className="text-green-400"> 🔮 Mistério</span> • 
                  <span className="text-pink-400"> 🎲 Risco</span>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                  {Object.entries(EVENT_PRESETS)
                    .filter(([_, preset]) => eventCategory === 'all' || preset.category === eventCategory)
                    .map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => handlePresetEvent(key as keyof typeof EVENT_PRESETS)}
                        className={`p-3 bg-gradient-to-r ${preset.color} bg-opacity-20 hover:bg-opacity-30 rounded-lg text-left border border-gray-700 hover:border-yellow-500 transition-all group relative overflow-hidden`}
                      >
                        {/* Rarity + Mechanic indicators */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            preset.mechanic === 'world_boss' ? 'bg-red-500/80' :
                            preset.mechanic === 'collection' ? 'bg-yellow-500/80' :
                            preset.mechanic === 'survival' ? 'bg-cyan-500/80' :
                            preset.mechanic === 'mystery' ? 'bg-purple-500/80' :
                            preset.mechanic === 'double_or_nothing' ? 'bg-pink-500/80' :
                            preset.mechanic === 'secret_realm' ? 'bg-emerald-500/80' :
                            'bg-gray-500/80'
                          } text-white`}>
                            {preset.mechanic === 'world_boss' ? '🐉' :
                             preset.mechanic === 'collection' ? '🎁' :
                             preset.mechanic === 'survival' ? '🗼' :
                             preset.mechanic === 'mystery' ? '🔮' :
                             preset.mechanic === 'double_or_nothing' ? '🎲' :
                             preset.mechanic === 'secret_realm' ? '🏯' :
                             preset.mechanic === 'element_surge' ? '🔥' :
                             preset.mechanic === 'community_goal' ? '🌍' :
                             '⚡'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            preset.rarity === 'legendary' ? 'bg-yellow-500/80 text-black' :
                            preset.rarity === 'epic' ? 'bg-purple-500/80 text-white' :
                            preset.rarity === 'rare' ? 'bg-blue-500/80 text-white' :
                            'bg-gray-500/80 text-white'
                          }`}>
                            {preset.rarity}
                          </span>
                        </div>
                        
                        <div className="font-bold text-white flex items-center gap-2 pr-20">
                          <span className="text-lg">{preset.icon}</span>
                          <span className="text-sm truncate">{preset.name.replace(preset.icon + ' ', '')}</span>
                        </div>
                        
                        <div className="text-xs text-gray-300 mt-1 line-clamp-2">{preset.description}</div>
                        
                        {/* How to participate */}
                        <div className="text-[10px] text-blue-300 mt-2 italic line-clamp-1">
                          💡 {preset.howToParticipate}
                        </div>
                        
                        {/* Stats */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {preset.expMult !== 1.0 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/30 text-orange-300 rounded">
                              EXP {preset.expMult}x
                            </span>
                          )}
                          {preset.dropMult !== 1.0 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/30 text-cyan-300 rounded">
                              Drops {preset.dropMult}x
                            </span>
                          )}
                          {preset.stonesMult !== 1.0 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/30 text-yellow-300 rounded">
                              Stones {preset.stonesMult}x
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-500/30 text-gray-300 rounded">
                            ⏱️ {preset.hours}h
                          </span>
                        </div>
                        
                        {/* Special mechanics preview */}
                        {preset.specialMechanics && (
                          <div className="text-[9px] text-gray-400 mt-1">
                            {preset.specialMechanics.bossName && `👹 Boss: ${preset.specialMechanics.bossName}`}
                            {preset.specialMechanics.collectibleItems && `🎁 ${preset.specialMechanics.collectibleItems.length} items para colecionar`}
                            {preset.specialMechanics.waveCount && `🗼 ${preset.specialMechanics.waveCount} waves`}
                            {preset.specialMechanics.targetElement && `🔥 Elemento: ${preset.specialMechanics.targetElement}`}
                            {preset.specialMechanics.goalTarget && `🎯 Meta: ${preset.specialMechanics.goalTarget.toLocaleString()}`}
                          </div>
                        )}
                      </button>
                    ))}
                </div>
                
                {/* Recommended Schedule */}
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-bold text-yellow-400 mb-2">📅 Calendário Sugerido</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400 font-bold mb-1">Semanal:</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-blue-400">Segunda:</span><span className="text-gray-300">💎 Spiritual Vein</span></div>
                        <div className="flex justify-between"><span className="text-purple-400">Quarta:</span><span className="text-gray-300">🎲 Fortune Gamble</span></div>
                        <div className="flex justify-between"><span className="text-green-400">Sexta:</span><span className="text-gray-300">🦊 Beast Hunt</span></div>
                        <div className="flex justify-between"><span className="text-orange-400">Fim-de-semana:</span><span className="text-gray-300">🗼 Endless Tower</span></div>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 font-bold mb-1">Mensal:</div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-red-400">1ª Semana:</span><span className="text-gray-300">🐉 World Boss</span></div>
                        <div className="flex justify-between"><span className="text-teal-400">2ª Semana:</span><span className="text-gray-300">🏯 Secret Realm</span></div>
                        <div className="flex justify-between"><span className="text-amber-400">3ª Semana:</span><span className="text-gray-300">🔨 Crafting Week</span></div>
                        <div className="flex justify-between"><span className="text-purple-400">4ª Semana:</span><span className="text-gray-300">⚔️ Community Goal</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Event */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">🎨 Custom Event</h3>
                <div className="bg-gray-800 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Event Name"
                      value={customEvent.name}
                      onChange={e => setCustomEvent(prev => ({ ...prev, name: e.target.value }))}
                      className="p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    />
                    <input
                      type="number"
                      placeholder="Duration (hours)"
                      value={customEvent.hours}
                      onChange={e => setCustomEvent(prev => ({ ...prev, hours: Number(e.target.value) }))}
                      className="p-2 bg-gray-700 rounded border border-gray-600 text-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Description"
                    value={customEvent.description}
                    onChange={e => setCustomEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">EXP Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={customEvent.expMult}
                        onChange={e => setCustomEvent(prev => ({ ...prev, expMult: Number(e.target.value) }))}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Drop Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={customEvent.dropMult}
                        onChange={e => setCustomEvent(prev => ({ ...prev, dropMult: Number(e.target.value) }))}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Stones Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10"
                        value={customEvent.stonesMult}
                        onChange={e => setCustomEvent(prev => ({ ...prev, stonesMult: Number(e.target.value) }))}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCustomEvent}
                    className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded font-bold"
                  >
                    Start Custom Event
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Players Tab */}
          {activeTab === 'players' && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">🚫 Banned Players</h3>
              {bannedPlayers.length === 0 ? (
                <p className="text-gray-500">No banned players</p>
              ) : (
                <div className="space-y-2">
                  {bannedPlayers.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <div className="text-white font-bold">{player.username}</div>
                        <div className="text-sm text-red-400">{player.ban_reason}</div>
                        <div className="text-xs text-gray-500">
                          Banned: {player.banned_at ? new Date(player.banned_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnban(player.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                      >
                        Unban
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3">📋 Cheat Detection Logs</h3>
              {cheatLogs.length === 0 ? (
                <p className="text-gray-500">No cheat attempts detected</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {cheatLogs.map(log => (
                    <div key={log.id} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`font-bold ${log.action_taken === 'banned' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {log.cheat_type}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            log.action_taken === 'banned' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {log.action_taken}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {new Date(log.detected_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        User: {log.user_id.slice(0, 8)}...
                      </div>
                      {log.details && (
                        <pre className="text-gray-500 text-xs mt-1 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
