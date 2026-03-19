import React, { useEffect, useState } from 'react';
import Board from './Board';
import Hand from './Hand';
import Chat from './Chat';
import RoundEnd from './RoundEnd';
import { useSocket } from '../context/SocketContext';
import { useAudio } from '../context/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameRoom({ room, userId }) {
    const socket = useSocket();
    const { playSound } = useAudio();
    const isHost = room.hostId === userId;
    const isMyTurn = room.players[room.currentTurnIndex]?.id === userId;
    const myPlayer = room.players.find(p => p.id === userId);
    const [showScoreboard, setShowScoreboard] = useState(false);
    const [showPassIndicator, setShowPassIndicator] = useState(false);

    useEffect(() => {
        if (isMyTurn && room.status === 'PLAYING') {
            playSound('yourTurn');
        }
    }, [isMyTurn, room.status, playSound]);

    const handleStartGame = () => {
        socket.emit('start_game', { roomId: room.id });
    };

    const handleAddBot = () => {
        socket.emit('add_bot', { roomId: room.id });
    };

    const handlePass = () => {
        playSound('playCard'); // Reusing playCard as a generic action sound for passing
        setShowPassIndicator(true);
        setTimeout(() => setShowPassIndicator(false), 1000);
        socket.emit('pass_turn', { roomId: room.id });
    };

    const hasValidMove = myPlayer?.hand?.some(card => {
        const { suit, value } = card;
        const suitState = room.board[suit];
        if (value === 7) return suitState === null;
        if (!suitState) return false;
        return value === suitState.low - 1 || value === suitState.high + 1;
    }) || false;

    return (
        <div className="game-room">
            {room?.status !== 'LOBBY' && (
                <button 
                    className="scoreboard-toggle" 
                    onClick={() => setShowScoreboard(true)}
                    title="Scoreboard"
                >
                    🏆
                </button>
            )}
            
            <div className="header-content">
                {room.status === 'LOBBY' && (
                    <div className="lobby-info">
                        <h3>Players ({room.players.length}/4):</h3>
                        <ul>
                            {room.players.map(p => <li key={p.id}><span style={{ fontSize: '1.2rem', marginRight: '5px' }}>{p.avatar}</span> {p.name} {p.id === room.hostId ? '(Host)' : ''}</li>)}
                        </ul>
                        {isHost && room.players.length >= 3 && (
                            <button onClick={handleStartGame}>Start Game</button>
                        )}
                        {isHost && room.players.length < 4 && (
                            <button onClick={handleAddBot} style={{ marginLeft: '10px' }}>Add Bot</button>
                        )}
                        {isHost && room.players.length < 3 && <p style={{ color: 'var(--warning-color)' }}>Need 3+ players (including bots) to start</p>}
                    </div>
                )}
                {room?.status === 'PLAYING' && (
                    <div className="game-status">
                        <h3>{room?.players?.[room?.currentTurnIndex] ? <span style={{ fontSize: '1.5rem', marginRight: '10px'}}>{room.players[room.currentTurnIndex].avatar}</span> : ''}{room?.players?.[room?.currentTurnIndex]?.name ? `${room.players[room.currentTurnIndex].name}'s Turn` : 'Unknown Turn'}</h3>
                        {isMyTurn && <div className="turn-alert">It's Your Turn!</div>}
                    </div>
                )}
            </div>

            {room.status === 'PLAYING' && (
                <div className="game-area">
                    <Board board={room.board} />

                    <div className="controls" style={{ position: 'relative' }}>
                        <AnimatePresence>
                            {showPassIndicator && (
                                <motion.div
                                    className="pass-indicator"
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: 1, y: -40 }}
                                    exit={{ opacity: 0, y: -60 }}
                                    transition={{ duration: 1 }}
                                >
                                    Pass...
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button
                            className={isMyTurn && !hasValidMove ? 'must-pass' : ''}
                            disabled={!isMyTurn}
                            onClick={handlePass}
                        >
                            Pass Turn
                        </button>
                    </div>

                    <Hand
                        hand={myPlayer?.hand || []}
                        isMyTurn={isMyTurn}
                        board={room.board}
                        roomId={room.id}
                        onPlay={(card) => socket.emit('play_card', { roomId: room.id, card })}
                    />
                </div>
            )}

            <div className="game-header">
                <div className="room-info">
                    <h2>Room: {room.id}</h2>
                    <span className="round-badge">Round {room.roundCount} / {room.maxRounds}</span>
                </div>
            </div>

            {(showScoreboard || room?.status === 'ROUND_OVER' || room?.status === 'GAME_OVER') && (
                <RoundEnd
                    room={room}
                    isHost={isHost}
                    onClose={() => setShowScoreboard(false)}
                />
            )}

            <Chat roomId={room.id} userId={userId} userName={myPlayer?.name} avatar={myPlayer?.avatar} />
        </div>
    );
}
