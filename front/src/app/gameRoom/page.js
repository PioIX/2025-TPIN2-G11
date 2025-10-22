"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSocket from "@/hooks/useSocket"
import styles from "./GameRoom.module.css";

export default function GameRoom() {
  const [users, setUsers] = useState([]);
  const [gameStart, setGameStart] = useState(false);
  const socket = useSocket();
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo");
  const isHost = searchParams.get("host") === "true";

  useEffect(() => {
    if (!socket) return;

    const username = localStorage.getItem("username") || "Invitado";
    socket.emit("joinRoom", { codigo, username });

    socket.on("usersInRoom", (usersList) => {
      setUsers(usersList);
    });

    socket.on("gameStarted", () => {
      setGameStart(true);
    });


    return () => {
      socket.off("usersInRoom");
      socket.off("gameStarted");
    };
    
  }, );

  function iniciarPartida() {
    socket.emit("iniciarJuego", { codigo });
  }

  return (
    <>
      {!gameStart ? (
        <>
          <h2>Código de sala: {codigo}</h2>
          <p>Esperá hasta que todos se unan o el anfitrión inicie la partida</p>
          <ul className={styles.user}>
            {users.length > 0 ? (
              users.map((u, i) => <li key={i}>{u.username}</li>)
            ) : (
              <p>No hay jugadores aún...</p>
            )}
          </ul>

          {isHost && users.length >= 2 && (
            <button className={styles.btn} onClick={iniciarPartida}>
              Iniciar partida
            </button>
          )}
        </>
      ) : (
        <p>Partida en curso...</p>
      )}
    </>
  );
}
