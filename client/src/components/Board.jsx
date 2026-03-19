import React from 'react';

const SUITS = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
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

const Card = ({ suit, value }) => {
    const rankMap = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
    const displayRank = rankMap[value] || value;
    return (
        <div className={`card ${SUIT_COLORS[suit]}`}>
            {displayRank} {SUIT_ICONS[suit]}
        </div>
    );
};

export default function Board({ board }) {
    if (!board) return null;

    const renderSuitRow = (suit) => {
        const state = board[suit];
        if (!state) return <div className="empty-suit-slot">Waiting for 7...</div>;

        const cards = [];
        // Show only Low and High
        cards.push(<Card key="low" suit={suit} value={state.low} />);
        if (state.high !== state.low) {
            cards.push(<div key="sep" className="card-sep">...</div>);
            cards.push(<Card key="high" suit={suit} value={state.high} />);
        }
        return cards;
    };

    return (
        <div className="game-board">
            {SUITS.map(suit => (
                <div key={suit} className="suit-row">
                    <div className="suit-label" style={{ color: SUIT_COLORS[suit], width: '30px', fontSize: '24px' }}>
                        {SUIT_ICONS[suit]}
                    </div>
                    {renderSuitRow(suit)}
                </div>
            ))}
        </div>
    );
}
