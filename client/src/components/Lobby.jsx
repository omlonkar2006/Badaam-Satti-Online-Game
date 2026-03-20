import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const AVATARS = ['👨', '👩', '🧑', '🐶', '🐱', '🦊', '🦄', '🐸', '🦁'];

export default function Lobby({ playerId }) {
    const { socket, isConnected } = useSocket();
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [maxRounds, setMaxRounds] = useState(1);
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = () => {
        if (!name) return setError('Name is required');
        const newRoomId = Math.random().toString(36).substring(7).toUpperCase();
        sessionStorage.setItem('playerName', name);
        sessionStorage.setItem('playerAvatar', selectedAvatar);
        socket.emit('create_room', { name, roomId: newRoomId, maxRounds, avatar: selectedAvatar, playerId });
    };

    const handleJoin = () => {
        if (!name || !roomId) return setError('Name and Room ID required');
        sessionStorage.setItem('playerName', name);
        sessionStorage.setItem('playerAvatar', selectedAvatar);
        socket.emit('join_room', { name, roomId, avatar: selectedAvatar, playerId });
    };

    React.useEffect(() => {
        const storedName = sessionStorage.getItem('playerName');
        const storedAvatar = sessionStorage.getItem('playerAvatar');
        if (storedName) setName(storedName);
        if (storedAvatar) setSelectedAvatar(storedAvatar);
    }, []);

    return (
        <div className="lobby">
            <h1>Badam Satti</h1>
            <div className="card-container">
                <div className="avatar-selection" style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {AVATARS.map(avatar => (
                        <div 
                            key={avatar} 
                            onClick={() => setSelectedAvatar(avatar)}
                            style={{
                                fontSize: '2rem',
                                cursor: 'pointer',
                                padding: '5px',
                                borderRadius: '50%',
                                background: selectedAvatar === avatar ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                                border: selectedAvatar === avatar ? '2px solid var(--primary-color)' : '2px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {avatar}
                        </div>
                    ))}
                </div>

                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />

                {!isConnected && (
                    <div style={{ color: 'var(--warning-color, #ffaa00)', marginBottom: '10px', fontSize: '0.9rem', textAlign: 'center' }}>
                        ⚠️ Waking up server... This may take up to 50 seconds on free hosting.
                    </div>
                )}

                {isCreating ? (
                    <div>
                        <p>Creating Room...</p>
                        <button onClick={handleCreate} disabled={!isConnected}>Start Room</button>
                        <button onClick={() => setIsCreating(false)}>Cancel</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Room ID"
                            value={roomId}
                            onChange={e => setRoomId(e.target.value)}
                        />
                        <button onClick={handleJoin} disabled={!isConnected}>Join Game</button>
                        <div style={{ margin: '10px 0' }}>OR</div>

                        <div className="round-select">
                            <label>Rounds: </label>
                            <select value={maxRounds} onChange={e => setMaxRounds(e.target.value)}>
                                {[1, 3, 5, 8, 10].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <button onClick={handleCreate} disabled={!isConnected}>Create New Game</button>
                    </div>
                )}

                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </div>
    );
}
