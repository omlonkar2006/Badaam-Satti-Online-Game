const {
    createRoom, joinRoom, getRoom, leaveRoom, startGame, playCard, passTurn, addBot, executeBotTurn
} = require('./gameManager');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('create_room', ({ name, roomId, maxRounds, avatar }) => {
            const result = createRoom(roomId, socket.id, name, maxRounds, avatar);
            if (result.success) {
                socket.join(roomId);
                // Return updated room list or specific room info
                const room = getRoom(roomId);
                socket.emit('room_joined', room);
            } else {
                socket.emit('error', result.error);
            }
        });

        socket.on('join_room', ({ name, roomId, avatar }) => {
            const result = joinRoom(roomId, socket.id, name, avatar);
            if (result.success) {
                socket.join(roomId);
                io.to(roomId).emit('room_update', result.room);
                socket.emit('room_joined', result.room);
            } else {
                socket.emit('error', result.error);
            }
        });

        socket.on('pass_turn', ({ roomId }) => {
            const result = passTurn(roomId, socket.id);
            if (result.success) {
                io.to(roomId).emit('game_update', result.room);
                handleBotTurns(roomId);
            } else {
                socket.emit('error', result.error);
            }
        });

        socket.on('add_bot', ({ roomId }) => {
            const result = addBot(roomId);
            if (result.success) {
                io.to(roomId).emit('room_update', result.room);
            } else {
                socket.emit('error', result.error);
            }
        });

        const handleRoundOver = (roomId, result) => {
            io.to(roomId).emit('round_over', {
                winner: result.winner,
                room: result.room
            });

            // Automatically start next round after 10 seconds if not GAME_OVER
            if (result.room.status === 'ROUND_OVER') {
                setTimeout(() => {
                    const room = getRoom(roomId);
                    // Double check status case someone started it or left
                    if (room && room.status === 'ROUND_OVER') {
                        const startResult = startGame(roomId);
                        if (startResult.success) {
                            io.to(roomId).emit('game_started', startResult.room);
                            handleBotTurns(roomId);
                        }
                    }
                }, 10000);
            }
        };

        const handleBotTurns = (roomId) => {
            const room = getRoom(roomId);
            if (!room || room.status !== 'PLAYING') return;

            const currentPlayer = room.players[room.currentTurnIndex];
            if (currentPlayer.isBot) {
                // Wait small delay for realism
                setTimeout(() => {
                    const result = executeBotTurn(roomId);
                    if (result && result.success) {
                        io.to(roomId).emit('game_update', result.room);
                        if (result.alertLowCards) {
                            io.to(roomId).emit('notification', `${result.alertLowCards} has only 3 cards left!`);
                        }
                        if (result.winner) {
                            handleRoundOver(roomId, result);
                        } else {
                            // Recursively check if next player is also a bot
                            handleBotTurns(roomId);
                        }
                    }
                }, 1500);
            }
        };

        socket.on('start_game', ({ roomId }) => {
            const result = startGame(roomId);
            if (result.success) {
                io.to(roomId).emit('game_started', result.room);
                handleBotTurns(roomId);
            } else {
                socket.emit('error', result.error);
            }
        });

        socket.on('play_card', ({ roomId, card }) => {
            const result = playCard(roomId, socket.id, card);
            if (result.success) {
                io.to(roomId).emit('game_update', result.room);
                if (result.alertLowCards) {
                    io.to(roomId).emit('notification', `${result.alertLowCards} has only 3 cards left!`);
                }
                if (result.winner) {
                    handleRoundOver(roomId, result);
                } else {
                    handleBotTurns(roomId);
                }
            } else {
                socket.emit('error', result.error);
            }
        });

        socket.on('send_message', ({ roomId, message, sender, avatar }) => {
            io.to(roomId).emit('receive_message', { sender, message, avatar });
        });

        socket.on('disconnect', () => {
            // Find room player was in? 
            // In a real app we'd track socket->room mapping.
            // efficient way: socket.rooms (but it's a Set, and includes socket.id)
            // For now, ignoring auto-leave logic or we'd need to iterate all rooms.
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
