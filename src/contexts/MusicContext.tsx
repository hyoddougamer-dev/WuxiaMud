// ============================================
// MUSIC CONTEXT - Sistema de Áudio Global
// Gere música de fundo, volume e playlists
// ============================================

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

interface MusicContextType {
  // Estado
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  currentTrack: string;
  
  // Ações
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  playLoginMusic: () => void;
  playGameMusic: () => void;
  stopMusic: () => void;
  nextTrack: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Playlist do jogo (será shuffled)
const GAME_TRACKS = [
  '/music/game-1.mp3',
  '/music/game-2.mp3',
  '/music/game-3.mp3',
  '/music/game-4.mp3',
  '/music/game-5.mp3',
  '/music/game-6.mp3',
];

const LOGIN_TRACK = '/music/login.mp3';

// Shuffle array (Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado persistido no localStorage
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('wuxia_music_volume');
    return saved ? parseFloat(saved) : 0.3; // 30% por defeito
  });
  
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('wuxia_music_muted');
    return saved === 'true';
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('');
  const [currentMode, setCurrentMode] = useState<'login' | 'game' | 'none'>('none');
  
  // Playlist shuffled
  const [shuffledPlaylist, setShuffledPlaylist] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  // Audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Inicializar audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = isMuted ? 0 : volume;
    
    // Quando uma música acaba, tocar a próxima (só no modo game)
    audioRef.current.addEventListener('ended', () => {
      if (currentMode === 'game') {
        playNextGameTrack();
      } else if (currentMode === 'login') {
        // Loop na música de login
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
    });
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Atualizar volume quando muda
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem('wuxia_music_volume', volume.toString());
    localStorage.setItem('wuxia_music_muted', isMuted.toString());
  }, [volume, isMuted]);
  
  // Função para tocar próxima música do game
  const playNextGameTrack = useCallback(() => {
    if (shuffledPlaylist.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % shuffledPlaylist.length;
    
    // Re-shuffle quando completar a playlist
    if (nextIndex === 0) {
      const newShuffled = shuffleArray(GAME_TRACKS);
      setShuffledPlaylist(newShuffled);
      setCurrentTrackIndex(0);
      
      if (audioRef.current) {
        audioRef.current.src = newShuffled[0];
        audioRef.current.play().catch(() => {});
        setCurrentTrack(newShuffled[0]);
      }
    } else {
      setCurrentTrackIndex(nextIndex);
      
      if (audioRef.current) {
        audioRef.current.src = shuffledPlaylist[nextIndex];
        audioRef.current.play().catch(() => {});
        setCurrentTrack(shuffledPlaylist[nextIndex]);
      }
    }
  }, [shuffledPlaylist, currentTrackIndex]);
  
  // Atualizar referência para o event listener
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => {
      if (currentMode === 'game') {
        playNextGameTrack();
      } else if (currentMode === 'login') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    };
    
    audio.removeEventListener('ended', handleEnded);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentMode, playNextGameTrack]);
  
  // === AÇÕES ===
  
  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  };
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      // Se estava muted e agora não está, tentar retomar a música
      if (prev && !newMuted && audioRef.current && currentMode !== 'none') {
        // Garantir que o volume é aplicado
        audioRef.current.volume = volume;
        // Se a música parou, reiniciar
        if (audioRef.current.paused) {
          audioRef.current.play().catch((e) => {
            console.log('Failed to resume music:', e);
          });
        }
      }
      return newMuted;
    });
  }, [volume, currentMode]);
  
  const playLoginMusic = useCallback(() => {
    if (!audioRef.current) return;
    
    // Don't restart if already playing login music
    if (currentMode === 'login' && isPlaying && !audioRef.current.paused) {
      return;
    }
    
    setCurrentMode('login');
    audioRef.current.src = LOGIN_TRACK;
    audioRef.current.loop = true;
    // Volume é gerido pelo useEffect separado
    audioRef.current.play().catch((e) => {
      console.log('Auto-play blocked, waiting for user interaction');
    });
    setCurrentTrack(LOGIN_TRACK);
    setIsPlaying(true);
  }, [currentMode, isPlaying]);
  
  const playGameMusic = useCallback(() => {
    if (!audioRef.current) return;
    
    // Don't restart if already playing game music
    if (currentMode === 'game' && isPlaying && !audioRef.current.paused) {
      return;
    }
    
    setCurrentMode('game');
    audioRef.current.loop = false;
    
    // Criar nova playlist shuffled
    const shuffled = shuffleArray(GAME_TRACKS);
    setShuffledPlaylist(shuffled);
    setCurrentTrackIndex(0);
    
    audioRef.current.src = shuffled[0];
    // Volume é gerido pelo useEffect separado
    audioRef.current.play().catch((e) => {
      console.log('Auto-play blocked');
    });
    setCurrentTrack(shuffled[0]);
    setIsPlaying(true);
  }, [currentMode, isPlaying]);
  
  const stopMusic = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentMode('none');
    setIsPlaying(false);
    setCurrentTrack('');
  }, []);
  
  const nextTrack = useCallback(() => {
    if (currentMode === 'game') {
      playNextGameTrack();
    }
  }, [currentMode, playNextGameTrack]);
  
  return (
    <MusicContext.Provider
      value={{
        volume,
        isMuted,
        isPlaying,
        currentTrack,
        setVolume,
        toggleMute,
        playLoginMusic,
        playGameMusic,
        stopMusic,
        nextTrack,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
