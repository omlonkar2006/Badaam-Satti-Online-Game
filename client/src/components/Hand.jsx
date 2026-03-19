import React from 'react';
import { useAudio } from '../context/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';

const SUIT_ICONS = {
    HEARTS: '♥',
    DIAMONDS: '♦',
    CLUBS: '♣',
    SPADES: '♠'
};
const SUIT_COLORS = {
    HEARTS: 'red',
    DIAMONDS: 'red',
    CLUBS: 'black',
    SPADES: 'black'
};

export default function Hand({ hand, isMyTurn, board, onPlay }) {

    const isValidMove = (card) => {
        if (!board) return false;
        const { suit, value } = card;
        const suitState = board[suit];

        if (value === 7) return suitState === null;
        if (!suitState) return false;
        return value === suitState.low - 1 || value === suitState.high + 1;
    };

    const { playSound } = useAudio();

    // Simple sort for display
    const sortedHand = [...hand].sort((a, b) => {
        if (a.suit === b.suit) return a.value - b.value;
        return a.suit.localeCompare(b.suit);
    });

    const handleClick = (card) => {
        if (isMyTurn) {
            playSound('playCard');
            onPlay(card);
        }
    };

    return (
        <div className="player-hand">
            <AnimatePresence>
                {sortedHand.map((card, idx) => (
                    <motion.div
                        key={`${card.suit}-${card.value}`}
                        layout
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                        transition={{ duration: 0.2 }}
                        className={`card hand-card ${SUIT_COLORS[card.suit]} ${isMyTurn && isValidMove(card) ? 'playable' : ''}`}
                        onClick={() => handleClick(card)}
                    >
                        {card.rank} {SUIT_ICONS[card.suit]}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
