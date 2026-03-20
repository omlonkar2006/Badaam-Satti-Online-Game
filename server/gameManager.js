const SUITS = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getRankValue = (rank) => RANKS.indexOf(rank) + 1;

const rooms = new Map();

const BOT_AVATARS = ['🤖', '👽', '👾', '👻', '🤠'];

function createRoom(roomId, hostId, hostName, maxRounds = 1, avatar = '👤') {
    if (rooms.has(roomId)) return { error: 'Room already exists' };
    rooms.set(roomId, {
        id: roomId,
        players: [{ id: hostId, name: hostName, avatar, hand: [], score: 0 }],
        hostId,
        board: {
            HEARTS: null, DIAMONDS: null, CLUBS: null, SPADES: null
        },
        deck: [],
        currentTurnIndex: 0,
        status: 'LOBBY', // LOBBY, PLAYING, ROUND_OVER, GAME_OVER
        roundCount: 1,
        maxRounds: parseInt(maxRounds)
    });
    return { success: true };
}

function joinRoom(roomId, playerId, playerName, avatar = '👤') {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'LOBBY') return { error: 'Game already in progress' };
    if (room.players.some(p => p.id === playerId)) {
        return { success: true, room }; // Successfully handle rejoins naturally
    }
    if (room.players.length >= 4) return { error: 'Room is full' };

    room.players.push({ id: playerId, name: playerName, avatar, hand: [], score: 0 });
    return { success: true, room };
}

function getRoom(roomId) {
    return rooms.get(roomId);
}

function leaveRoom(roomId, playerId) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== playerId);
    if (room.players.length === 0) {
        rooms.delete(roomId);
    }
    // Handle host leaving? For now, assigning new host if host leaves
    if (room.hostId === playerId && room.players.length > 0) {
        room.hostId = room.players[0].id;
    }
    return room;
}


function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function startGame(roomId) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.players.length < 3) return { error: 'Need at least 3 players' }; // User requirement: min 3

    // Reset Board
    room.board = { HEARTS: null, DIAMONDS: null, CLUBS: null, SPADES: null };

    // If we're starting a new round after ROUND_OVER, increment roundCount
    if (room.status === 'ROUND_OVER') {
        room.roundCount++;
    }

    room.status = 'PLAYING';

    // Create Deck
    let deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({ suit, rank, value: getRankValue(rank) });
        }
    }
    deck = shuffle(deck);

    // Deal Cards
    const numPlayers = room.players.length;
    room.players.forEach(p => p.hand = []);

    let pIdx = 0;
    while (deck.length > 0) {
        room.players[pIdx].hand.push(deck.pop());
        pIdx = (pIdx + 1) % numPlayers;
    }

    // Sort hands (optional but good for UX)
    room.players.forEach(p => {
        p.hand.sort((a, b) => {
            if (a.suit === b.suit) return a.value - b.value;
            return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
        });
    });

    // Find 7 of Hearts
    let starterIndex = -1;
    for (let i = 0; i < numPlayers; i++) {
        if (room.players[i].hand.some(c => c.suit === 'HEARTS' && c.rank === '7')) {
            starterIndex = i;
            break;
        }
    }

    if (starterIndex === -1) {
        // Should not happen with standard deck
        return { error: '7 of Hearts not found? Internal Error.' };
    }

    room.currentTurnIndex = starterIndex;

    // Auto-play 7 of Hearts? 
    // User says: "That card is automatically placed on the board."
    // So we should execute the move immediately.

    room.currentTurnIndex = starterIndex; // Set turn to holder
    // Execute move
    const sevenHearts = { suit: 'HEARTS', rank: '7', value: 7 };

    // Remove from hand
    const player = room.players[starterIndex];
    player.hand = player.hand.filter(c => !(c.suit === 'HEARTS' && c.rank === '7'));

    // Update board
    room.board.HEARTS = { low: 7, high: 7 };

    // Move turn to next player
    room.currentTurnIndex = (starterIndex + 1) % numPlayers;

    return { success: true, room };
}


function isValidMove(room, card) {
    const { suit, value } = card;
    const suitState = room.board[suit];

    if (value === 7) {
        // 7 is valid if it's the first in the suit
        // But 7 of Hearts is already played at start.
        // Other 7s are always valid if the suit hasn't started (which is implied if it's 7)
        // If suitState is null, 7 is valid.
        return suitState === null;
    }

    // If suit not on board, cannot play non-7
    if (!suitState) return false;

    // Check adjacency
    if (value === suitState.low - 1) return true;
    if (value === suitState.high + 1) return true;

    return false;
}

function hasValidMove(room, playerIndex) {
    const player = room.players[playerIndex];
    return player.hand.some(card => isValidMove(room, card));
}


function playCard(roomId, playerId, card) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex !== room.currentTurnIndex) return { error: 'Not your turn' };

    if (!isValidMove(room, card)) return { error: 'Invalid move' };

    // Update board
    const suitState = room.board[card.suit];
    if (card.value === 7) {
        room.board[card.suit] = { low: 7, high: 7 };
    } else if (card.value === suitState.low - 1) {
        suitState.low = card.value;
    } else if (card.value === suitState.high + 1) {
        suitState.high = card.value;
    }

    // Remove from hand
    const player = room.players[playerIndex];
    player.hand = player.hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));

    // Check Win
    if (player.hand.length === 0) {
        // Calculate scores
        calculateScores(room);

        if (room.roundCount >= room.maxRounds) {
            room.status = 'GAME_OVER';
        } else {
            room.status = 'ROUND_OVER';
        }

        return { success: true, room, winner: player };
    }

    // Check "3 cards left"
    let alertLowCards = null;
    if (player.hand.length === 3) {
        alertLowCards = player.name;
    }

    // Next turn
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;

    return { success: true, room, alertLowCards };
}

function passTurn(roomId, playerId) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex !== room.currentTurnIndex) return { error: 'Not your turn' };

    // Validate: Can only pass if no valid move
    if (hasValidMove(room, playerIndex)) {
        return { error: 'You have a valid card to play!' };
    }

    // Next turn
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    return { success: true, room };
}

function calculateScores(room) {
    // A=1, 2-10=face, J=11, Q=12, K=13
    room.players.forEach(p => {
        let roundScore = 0;
        p.hand.forEach(c => {
            if (c.value === 1) roundScore += 1;
            else if (c.value >= 11) roundScore += c.value; // J=11, Q=12, K=13. Rank value matches points
            else roundScore += c.value;
        });
        p.score += roundScore;
    });
}

function kickPlayer(roomId, hostId, targetPlayerId) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'LOBBY') return { error: 'Game already in progress' };
    if (room.hostId !== hostId) return { error: 'Only the host can kick players' };
    
    room.players = room.players.filter(p => p.id !== targetPlayerId);
    return { success: true, room };
}

function addBot(roomId) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'LOBBY') return { error: 'Game already in progress' };
    if (room.players.length >= 4) return { error: 'Room is full' };

    const botNames = ["SONU DADA", "Sayali DON", "Vaishnavi MAFIA", "Ashwini DAKAIT"];
    // Find a name not already taken
    const takenNames = room.players.map(p => p.name);
    const botName = botNames.find(n => !takenNames.includes(n)) || `Bot ${room.players.length}`;
    const botAvatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];

    const botId = `bot_${Math.random().toString(36).substring(7)}`;
    room.players.push({ id: botId, name: botName, avatar: botAvatar, hand: [], score: 0, isBot: true });

    return { success: true, room };
}

function executeBotTurn(roomId) {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'PLAYING') return null;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer.isBot) return null;

    // Logic: find first valid move
    let cardToPlay = currentPlayer.hand.find(card => isValidMove(room, card));

    if (cardToPlay) {
        return playCard(roomId, currentPlayer.id, cardToPlay);
    } else {
        return passTurn(roomId, currentPlayer.id);
    }
}

module.exports = {
    createRoom,
    joinRoom,
    getRoom,
    leaveRoom,
    startGame,
    playCard,
    passTurn,
    kickPlayer,
    addBot,
    executeBotTurn
};
