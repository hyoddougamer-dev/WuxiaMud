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
  type GameConfig,
  type PlayerProfile,
  type CheatLogEntry
} from '../services/adminService';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'players' | 'logs'>('events');
  
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

              {/* Quick Events */}
              <div>
                <h3 className="text-lg font-bold text-white mb-3">⚡ Quick Events</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(EVENT_PRESETS) as (keyof typeof EVENT_PRESETS)[]).map(key => {
                    const preset = EVENT_PRESETS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => handlePresetEvent(key)}
                        className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left border border-gray-700 hover:border-yellow-600 transition-colors"
                      >
                        <div className="font-bold text-white">{preset.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{preset.description}</div>
                        <div className="text-xs text-gray-500 mt-1">Duration: {preset.hours}h</div>
                      </button>
                    );
                  })}
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
