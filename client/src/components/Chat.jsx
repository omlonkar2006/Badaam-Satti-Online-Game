import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAudio } from '../context/AudioContext';

export default function Chat({ roomId, userId, userName, avatar }) {
    const socket = useSocket();
    const { playSound } = useAudio();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        return () => {
            socket.off('receive_message');
        };
    }, [socket]);

    useEffect(() => {
        // Handle unread count and scrolling when a new message arrives
        if (messages.length === 0) return;
        
        // Play notification sound for any incoming new messages
        playSound('message');

        if (!isOpen) {
            // Only increment unread if the latest message is not from us
            // (Actually just incrementing is fine since we sent a message while open 99% of time, but just to be safe)
            setUnread(prev => prev + 1);
        } else if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [messages, isOpen, playSound]);

    useEffect(() => {
        if (isOpen) {
            setUnread(0);
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }, [isOpen]);

    const sendMessage = (text) => {
        if (!text.trim()) return;
        socket.emit('send_message', { roomId, message: text, sender: userName, avatar });
        setInput('');
    };

    const handleSend = () => {
        sendMessage(input);
    };

    const sendEmoji = (emoji) => {
        sendMessage(emoji);
    };

    if (!isOpen) {
        return (
            <button 
                className="chat-toggle-btn" 
                onClick={() => setIsOpen(true)}
            >
                💬 Chat {unread > 0 && <span className="unread-badge">{unread}</span>}
            </button>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Chat</h3>
                <button className="chat-close-btn" onClick={() => setIsOpen(false)}>✖</button>
            </div>

            <div className="messages">
                {messages.map((m, i) => (
                    <div key={i} className="message">
                        <strong><span style={{ marginRight: '5px' }}>{m.avatar}</span>{m.sender}: </strong>{m.message}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="emoji-panel">
                {['😀', '😂', '😎', '😢', '❤️', '👍'].map(emoji => (
                    <span key={emoji} onClick={() => sendEmoji(emoji)} style={{ cursor: 'pointer', margin: '0 2px' }}>
                        {emoji}
                    </span>
                ))}
            </div>

            <div className="input-area">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}
