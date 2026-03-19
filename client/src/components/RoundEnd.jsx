import React, { useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const SUIT_ICONS = { HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠' };
const SUIT_COLORS = { HEARTS: 'red', DIAMONDS: 'red', CLUBS: 'black', SPADES: 'black' };
const RANKS = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

function getRank(value) {
    return RANKS[value] || value;
}

export default function RoundEnd({ room, onNextRound, isHost, onClose }) {
    const { playSound } = useAudio();
    const { width, height } = useWindowSize();
    
    if (!room) return null;
    
    const isGameOver = room.status === 'GAME_OVER';
    const isRoundOver = room.status === 'ROUND_OVER' || isGameOver;
    const sortedPlayers = [...(room.players || [])].sort((a, b) => (a.score || 0) - (b.score || 0));

    useEffect(() => {
        if (isRoundOver) {
            playSound('win');
        }
    }, [isRoundOver, playSound]);

    return (
        <div className="round-end-overlay">
            {isGameOver && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
            <div className="round-end-modal">
                <div className="modal-header">
                    <h2>{isGameOver ? '🏆 Final Results' : isRoundOver ? `Round ${room.roundCount} Results` : '🏆 Scoreboard'}</h2>
                    {!isGameOver && <button className="close-modal" onClick={onClose}>&times;</button>}
                </div>

                <div className="leaderboard">
                    <h3>Leaderboard (Total Scores)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Round Penalty</th>
                                <th>Total Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPlayers.map((p, idx) => {
                                return (
                                    <tr key={p.id} className={idx === 0 ? 'top-player' : ''}>
                                        <td>{idx + 1}</td>
                                        <td><span style={{ marginRight: '5px' }}>{p.avatar}</span> {p.name} {p.isBot ? '🤖' : ''}</td>
                                        <td>{!isRoundOver ? '-' : p.hand?.length > 0 ? (
                                            <span style={{ color: 'var(--warning-color)' }}>
                                                +{p.hand.reduce((sum, c) => sum + (c.value || 0), 0)} pts
                                            </span>
                                        ) : 'Winner!'}</td>
                                        <td>{p.score}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {isRoundOver && (
                    <div className="leftover-cards-section">
                        <h3>Leftover Cards</h3>
                        <div className="players-leftover">
                            {room.players.map(p => (
                                <div key={p.id} className="player-leftover-row">
                                    <strong><span style={{ marginRight: '5px' }}>{p.avatar}</span> {p.name}:</strong>
                                    <div className="leftover-hand">
                                        {(!p.hand || p.hand.length === 0) ? <span className="finished">Finished!</span> : (
                                            p.hand.map((c, i) => (
                                                <span key={i} className={`mini-card ${SUIT_COLORS[c?.suit] || 'black'}`}>
                                                    {getRank(c?.value)}{SUIT_ICONS[c?.suit] || ''}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isRoundOver && !isGameOver && (
                    <div style={{ marginTop: '20px', color: 'var(--success-color)', fontWeight: 'bold' }}>
                        Next round starting in 10 seconds...
                    </div>
                )}

                {!isGameOver && (
                    <button className="close-modal-btn" onClick={onClose} style={{ marginTop: '10px' }}>
                        Back to Game
                    </button>
                )}
                {isGameOver && (
                    <button className="next-round-btn" onClick={() => window.location.reload()}>
                        Back to Lobby
                    </button>
                )}
            </div>
        </div>
    );
}
