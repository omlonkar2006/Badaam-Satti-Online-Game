import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
    const [isMuted, setIsMuted] = useState(false);
    
    // We maintain references to our audio elements using reliable remote URLs
    const sounds = useRef({
        playCard: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'), // Soft gentle swoosh
        yourTurn: new Audio('https://assets.mixkit.co/active_storage/sfx/2157/2157-preview.mp3'), // Soft gentle bell/pop
        message: new Audio('https://assets.mixkit.co/active_storage/sfx/3005/3005-preview.mp3'), // Tiny droplet
        win: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3') // Happy soft harp
    });

    useEffect(() => {
        // Initialize volumes and loops
        sounds.current.playCard.volume = 0.3;
        sounds.current.yourTurn.volume = 0.4;
        sounds.current.message.volume = 0.2;
        sounds.current.win.volume = 0.5;
    }, []);

    // Apply mute logic to all sounds
    useEffect(() => {
        Object.values(sounds.current).forEach(audio => {
            audio.muted = isMuted;
        });
    }, [isMuted]);

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const playSound = (soundName) => {
        if (isMuted) return;
        
        const audio = sounds.current[soundName];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    };

    return (
        <AudioContext.Provider value={{ isMuted, toggleMute, playSound }}>
            {children}
        </AudioContext.Provider>
    );
}

export const useAudio = () => useContext(AudioContext);
