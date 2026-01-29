import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Users, Globe, ShoppingCart, HelpCircle, Minimize2, Maximize2, Volume2, VolumeX, Star } from 'lucide-react';

// Chat Message Types - Only implemented channels
export type ChatChannel = 'global' | 'zone' | 'trade' | 'help' | 'whisper';

// Chat Message
export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  senderId: string;
  senderName: string;
  senderLevel?: number;
  senderTitle?: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
  whisperTo?: string;
}

// Channel Configuration - Only implemented channels
const channelConfig: Record<ChatChannel, {
  label: string;
  icon: React.ReactNode;
  color: string;
  prefix: string;
}> = {
  global: {
    label: 'Global',
    icon: <Globe size={14} />,
    color: 'text-blue-400',
    prefix: '[World]'
  },
  zone: {
    label: 'Zone',
    icon: <Users size={14} />,
    color: 'text-green-400',
    prefix: '[Zone]'
  },
  trade: {
    label: 'Trade',
    icon: <ShoppingCart size={14} />,
    color: 'text-amber-400',
    prefix: '[Trade]'
  },
  help: {
    label: 'Help',
    icon: <HelpCircle size={14} />,
    color: 'text-cyan-400',
    prefix: '[Help]'
  },
  whisper: {
    label: 'Whisper',
    icon: <MessageCircle size={14} />,
    color: 'text-pink-400',
    prefix: '[Whisper]'
  }
};

// Generate mock chat messages (max level 29)
function generateMockMessages(): ChatMessage[] {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      channel: 'global',
      senderId: 'player_1',
      senderName: 'DragonSlayer99',
      senderLevel: 25,
      content: 'Anyone want to farm the Forest Temple?',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      channel: 'global',
      senderId: 'player_2',
      senderName: 'IceSorcerer',
      senderLevel: 18,
      senderTitle: 'Foundation Elder',
      content: 'Sure, I\'m in! What level mobs?',
      timestamp: new Date(Date.now() - 280000),
    },
    {
      id: '3',
      channel: 'trade',
      senderId: 'player_3',
      senderName: 'MerchantKing',
      senderLevel: 29,
      content: 'WTS [Celestial Blade] - 5000 Spirit Stones!',
      timestamp: new Date(Date.now() - 250000),
    },
    {
      id: '4',
      channel: 'zone',
      senderId: 'player_4',
      senderName: 'NewbieHelper',
      senderLevel: 15,
      content: 'There\'s a boss spawning at the Ancient Gate!',
      timestamp: new Date(Date.now() - 200000),
    },
    {
      id: '5',
      channel: 'global',
      senderId: 'system',
      senderName: 'System',
      content: '🎉 DragonSlayer99 has reached level 25! Congratulations!',
      timestamp: new Date(Date.now() - 150000),
      isSystem: true,
    },
    {
      id: '6',
      channel: 'help',
      senderId: 'player_5',
      senderName: 'Confused123',
      senderLevel: 3,
      content: 'How do I equip weapons?',
      timestamp: new Date(Date.now() - 100000),
    },
    {
      id: '7',
      channel: 'help',
      senderId: 'player_6',
      senderName: 'HelpfulSage',
      senderLevel: 22,
      senderTitle: 'Golden Core Cultivator',
      content: 'Go to Inventory, click on the weapon, and select Equip! 😊',
      timestamp: new Date(Date.now() - 80000),
    },
    {
      id: '8',
      channel: 'trade',
      senderId: 'player_7',
      senderName: 'CrafterPro',
      senderLevel: 27,
      content: 'WTB Iron Ore x50, paying 100 stones each!',
      timestamp: new Date(Date.now() - 50000),
    },
  ];
  
  return mockMessages;
}

// Chat message component
const ChatMessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const config = channelConfig[message.channel];
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (message.isSystem) {
    return (
      <div className="px-3 py-1.5 bg-amber-900/20 border-l-2 border-amber-500/50">
        <span className="text-amber-400 text-xs">{message.content}</span>
      </div>
    );
  }
  
  return (
    <div className="px-3 py-1.5 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-2">
        {/* Timestamp */}
        <span className="text-[10px] text-gray-600 pt-0.5 flex-shrink-0">
          {formatTime(message.timestamp)}
        </span>
        
        {/* Channel Badge */}
        <span className={`text-[10px] ${config.color} flex-shrink-0`}>
          {config.prefix}
        </span>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Sender */}
          <span className={`font-bold text-sm ${
            message.senderTitle ? 'text-amber-300' : 'text-white'
          }`}>
            {message.senderName}
          </span>
          {message.senderLevel && (
            <span className="text-[10px] text-gray-500 ml-1">
              Lv.{message.senderLevel}
            </span>
          )}
          {message.senderTitle && (
            <span className="text-[9px] text-amber-400/60 ml-1.5 px-1 py-0.5 bg-amber-500/10 rounded">
              {message.senderTitle}
            </span>
          )}
          <span className="text-gray-400 mx-1">:</span>
          
          {/* Content */}
          <span className="text-gray-300 text-sm break-words">{message.content}</span>
        </div>
      </div>
    </div>
  );
};

// Props
interface ChatPanelProps {
  playerName: string;
  playerLevel: number;
  playerTitle?: string;
  currentZone?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  playerName,
  playerLevel,
  playerTitle,
  currentZone = 'Azure Cloud Sect',
  isMinimized = false,
  onToggleMinimize
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(generateMockMessages());
  const [inputValue, setInputValue] = useState('');
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('global');
  const [visibleChannels, setVisibleChannels] = useState<ChatChannel[]>(['global', 'zone', 'trade', 'help']);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // New state for expansion
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Filter messages by visible channels
  const filteredMessages = messages.filter(m => visibleChannels.includes(m.channel));
  
  // Send message
  const sendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      channel: activeChannel,
      senderId: 'current_player',
      senderName: playerName,
      senderLevel: playerLevel,
      senderTitle: playerTitle,
      content: inputValue,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button 
          onClick={onToggleMinimize}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-blue-500/50 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all"
        >
          <MessageCircle size={18} className="text-blue-400" />
          <span className="text-white font-bold text-sm">Chat</span>
          {messages.length > 0 && (
            <span className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {Math.min(messages.length, 9)}
            </span>
          )}
        </button>
      </div>
    );
  }
  
  return (
    <div className={`fixed bottom-4 right-4 z-40 flex flex-col bg-gradient-to-br from-[#1a1f2e]/95 to-[#151820]/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
      isExpanded ? 'w-[600px] h-[500px]' : 'w-[400px] h-[350px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-900/30 to-indigo-900/20 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-blue-400" />
          <span className="font-bold text-white text-sm">Chat</span>
          <span className="text-[10px] text-gray-500">- {currentZone}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={14} className="text-red-400" /> : <Volume2 size={14} className="text-gray-400" />}
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title={isExpanded ? 'Shrink' : 'Expand'}
          >
            <Maximize2 size={14} className={isExpanded ? 'text-blue-400' : 'text-gray-400'} />
          </button>
          <button 
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Channel Tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-black/20 border-b border-white/5 overflow-x-auto">
        {(Object.keys(channelConfig) as ChatChannel[]).map(channel => {
          const config = channelConfig[channel];
          const isActive = visibleChannels.includes(channel);
          return (
            <button
              key={channel}
              onClick={() => {
                if (isActive && visibleChannels.length > 1) {
                  setVisibleChannels(prev => prev.filter(c => c !== channel));
                } else if (!isActive) {
                  setVisibleChannels(prev => [...prev, channel]);
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                isActive
                  ? `${config.color} bg-${config.color.replace('text-', '')}/20 border border-${config.color.replace('text-', '')}/30`
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {config.icon}
              {config.label}
            </button>
          );
        })}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No messages yet. Start chatting!
          </div>
        ) : (
          <>
            {filteredMessages.map(message => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input */}
      <div className="p-2 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          {/* Channel Selector */}
          <select
            value={activeChannel}
            onChange={(e) => setActiveChannel(e.target.value as ChatChannel)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            {(Object.keys(channelConfig) as ChatChannel[]).map(channel => (
              <option key={channel} value={channel}>
                {channelConfig[channel].label}
              </option>
            ))}
          </select>
          
          {/* Message Input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message in ${channelConfig[activeChannel].label}...`}
            className="flex-1 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            maxLength={200}
          />
          
          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Floating chat button when chat is closed
export const ChatButton: React.FC<{
  onClick: () => void;
  unreadCount?: number;
}> = ({ onClick, unreadCount = 0 }) => {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-blue-400/50 rounded-full shadow-lg shadow-blue-500/30 hover:scale-110 transition-all"
    >
      <MessageCircle size={24} className="text-white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse">
          {Math.min(unreadCount, 99)}
        </span>
      )}
    </button>
  );
};
