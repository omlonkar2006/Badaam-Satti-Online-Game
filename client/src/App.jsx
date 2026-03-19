import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { useAudio } from './context/AudioContext';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import RoundEnd from './components/RoundEnd';
import './index.css';

function App() {
  const socket = useSocket();
  const { isMuted, toggleMute } = useAudio();
  const [room, setRoom] = useState(null);
  const [view, setView] = useState('lobby'); // lobby, game
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room_joined', (roomData) => {
      setRoom(roomData);
      setView('game');
      setError('');
    });

    socket.on('error', (msg) => {
      setError(msg);
      // Suppress alerts for common gameplay errors to keep flow smooth
      const silentErrors = ['Not your turn', 'Invalid move', 'You have a valid card to play!'];
      if (!silentErrors.includes(msg)) {
        alert(msg);
      }
    });

    socket.on('room_update', (roomData) => {
      setRoom(roomData);
    });

    socket.on('game_started', (roomData) => {
      setRoom(roomData);
    });

    socket.on('game_update', (roomData) => {
      setRoom(roomData);
    });

    socket.on('round_over', ({ winner, room }) => {
      setRoom(room);
      // No longer using alert!
    });

    socket.on('notification', (msg) => {
      setNotification(msg);
    });

    return () => {
      socket.off('room_joined');
      socket.off('error');
      socket.off('room_update');
      socket.off('game_started');
      socket.off('game_update');
      socket.off('round_over');
      socket.off('notification');
    };
  }, [socket]);

  if (!socket) return <div>Connecting...</div>;

  return (
    <div className="App">
      <button 
        className="mute-toggle" 
        onClick={toggleMute}
        title={isMuted ? "Unmute Sound" : "Mute Sound"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      {notification && <div className="notification-bar">{notification}</div>}
      {view === 'lobby' && <Lobby />}
      {view === 'game' && room && <GameRoom room={room} userId={socket.id} />}
    </div>
  );
}

export default App;
