"use client";
import { useSocket } from "../../hooks/useSocket.js";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Game.module.css";

export default function Game() {
  const socketObj = useSocket();
  const socket = socketObj?.socket;
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code");

  const [state, setState] = useState("");
  const [myRole, setMyRole] = useState("");
  const [players, setPlayers] = useState([]);
  const [mayor, setMayor] = useState("");
  const [victim, setVictim] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("gameStarted", (data) => {
      console.log("Juego iniciado:", data);
      setState(data.state);
      
      // Encontrar mi rol
      const myPlayer = data.players.find(j => 
        j.username === localStorage.getItem("username")
      );
      if (myPlayer) {
        setMyRole(myPlayer.role);
        console.log("🎭 Tu rol es:", myPlayer.rol);
      }
      
      setPlayers(data.players);
    });

    socket.on("changingState", (data) => {
      console.log("Estado cambiado:", data);
      setState(data.state);
      setMayor(data.mayor || "");
      setVictim(data.victim || "");
      setMessage(data.message || "");
    });

    socket.on("gameFinished", (data) => {
      console.log("🏁 Juego terminado:", data);
      setState("finalizado");
      setMessage(data.message);
      alert(`¡Juego terminado! ${data.message}`);
    });

    return () => {
      socket.off("gameStarted");
      socket.off("changingState");
      socket.off("gameFinished");
    };
  }, [socket]);

  const voteVictim = (victimSocketId) => {
    if (socket && state === "noche_lobizones" && myRole === "lobizon") {
      socket.emit("voteVictim", {
        code: roomCode,
        victimSocketId: victimSocketId
      });
    }
  };

  const renderContent = () => {
    switch (state) {
      case "inicio":
        return (
          <div className={styles.phase}>
            <h2>🏛️ Elección del Intendente</h2>
            <p>Voten por quien será el intendente</p>
            {/* Aquí iría la interfaz de votación */}
          </div>
        );

      case "noche_lobizones":
        return (
          <div className={styles.phase}>
            <h2>🌙 Noche - Turno de los Lobizones</h2>
            <p>Lobizones, elijan a su víctima...</p>
            {myRole === "lobizon" && (
              <div className={styles.voting}>
                <h3>Selecciona a tu víctima:</h3>
                {players
                  .filter(j => j.role !== "lobizon" && j.isAlive)
                  .map(player => (
                    <button
                      key={player.socketId}
                      onClick={() => voteVictim(player.socketId)}
                      className={styles.playerButton}
                    >
                      🎯 {player.username}
                    </button>
                  ))
                }
              </div>
            )}
            {myRole !== "lobizon" && (
              <p>💤 Esperando a que los lobizones decidan...</p>
            )}
          </div>
        );

      case "noche_especiales":
        return (
          <div className={styles.phase}>
            <h2>🌙 Noche - Roles Especiales</h2>
            <p>Roles especiales, actúen...</p>
            {victim && <p>💀 Víctima: {victim}</p>}
          </div>
        );

      case "finalizado":
        return (
          <div className={styles.phase}>
            <h2>🏁 Juego Terminado</h2>
            <p>{message}</p>
            <button onClick={() => window.location.reload()}>
              Jugar de nuevo
            </button>
          </div>
        );

      default:
        return <p>Cargando...</p>;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Lobizones de Castro Barros</h1>
        <p>Sala: {roomCode} | Estado: {state}</p>
        {myRole && <p>Tu rol: <strong>{myRole}</strong></p>}
      </header>

      <main className={styles.main}>
        {renderContent()}
        
        {/* Panel de jugadores */}
        <div className={styles.playersPanel}>
          <h3>Jugadores:</h3>
          {players.map(player => (
            <div 
              key={player.socketId} 
              className={`${styles.player} ${
                !player.isAlive ? styles.dead : ''
              }`}
            >
              <span>{player.username}</span>
              <span className={styles.role}>
                {!player.isAlive ? '💀' : 
                 player.role === 'lobizon' ? '🐺' : '👤'}
              </span>
              {!player.isAlive && <span className={styles.deadText}>(Muerto)</span>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}