import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if the user is logged in
    if (user) {
      const newSocket = io(import.meta.env.VITE_API_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      // Temporary debug logs for frontend
      newSocket.on('connect', () => {
        console.log('CLIENT: 🟢 Socket connected! ID:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('CLIENT: 🔴 Socket connection error:', err.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
