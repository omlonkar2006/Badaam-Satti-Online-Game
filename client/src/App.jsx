import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { useAudio } from './context/AudioContext';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import RoundEnd from './components/RoundEnd';
import './index.css';

function App() {
  const { socket } = useSocket();
  const { isMuted, toggleMute } = useAudio();
  const [room, setRoom] = useState(null);
  const [view, setView] = useState('lobby'); // lobby, game
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    // Session persistence initialization
    let storedPlayerId = sessionStorage.getItem('playerId');
    if (!storedPlayerId) {
      storedPlayerId = Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('playerId', storedPlayerId);
    }
    setPlayerId(storedPlayerId);
  }, []);

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
      sessionStorage.setItem('roomId', roomData.id);
    });

    const storedRoomId = sessionStorage.getItem('roomId');
    const storedPlayerId = sessionStorage.getItem('playerId');
    if (storedRoomId && storedPlayerId) {
      socket.emit('rejoin_room', { roomId: storedRoomId, playerId: storedPlayerId });
    }

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

    socket.on('player_kicked', ({ playerId: kickedId }) => {
      const storedPlayerId = sessionStorage.getItem('playerId');
      if (storedPlayerId === kickedId) {
        setRoom(null);
        setView('lobby');
        sessionStorage.removeItem('roomId');
        alert('You have been kicked from the room.');
      }
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
      socket.off('player_kicked');
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
      {view === 'lobby' && <Lobby playerId={playerId} />}
      {view === 'game' && room && <GameRoom room={room} userId={playerId} />}
    </div>
  );
}

export default App;
