import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Use window.location.origin in production to connect to the same host
        const socketUrl = import.meta.env.PROD
            ? window.location.origin
            : 'http://localhost:4001';

        const newSocket = io(socketUrl);

        newSocket.on('connect', () => console.log('Socket Connected:', newSocket.id));
        newSocket.on('connect_error', (err) => console.error('Socket Connection Error:', err));

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
