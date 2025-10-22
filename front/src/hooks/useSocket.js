import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:4000"); 

    return () => {
      socket.current.disconnect();
    };
  }, []);

  return socket.current;
}
