"use client";
import { useSocket } from "../../hooks/useSocket.js";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Game.module.css";

export default function Game() {
  const socketObj = useSocket();
  const socket = socketObj?.socket;
  const searchParams = useSearchParams();
  const codigoSala = searchParams.get("codigo");

  const [estado, setEstado] = useState("");
  const [miRol, setMiRol] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [intendente, setIntendente] = useState("");
  const [victima, setVictima] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("juegoIniciado", (data) => {
      console.log("🎮 Juego iniciado:", data);
      setEstado(data.estado);
      
      // Encontrar mi rol
      const miJugador = data.jugadores.find(j => 
        j.username === localStorage.getItem("username")
      );
      if (miJugador) {
        setMiRol(miJugador.rol);
        console.log("🎭 Tu rol es:", miJugador.rol);
      }
      
      setJugadores(data.jugadores);
    });

    socket.on("estadoCambiado", (data) => {
      console.log("🔄 Estado cambiado:", data);
      setEstado(data.estado);
      setIntendente(data.intendente || "");
      setVictima(data.victima || "");
      setMensaje(data.mensaje || "");
    });

    socket.on("juegoTerminado", (data) => {
      console.log("🏁 Juego terminado:", data);
      setEstado("finalizado");
      setMensaje(data.mensaje);
      alert(`¡Juego terminado! ${data.mensaje}`);
    });

    return () => {
      socket.off("juegoIniciado");
      socket.off("estadoCambiado");
      socket.off("juegoTerminado");
    };
  }, [socket]);

  const votarVictima = (victimaSocketId) => {
    if (socket && estado === "noche_lobizones" && miRol === "lobizon") {
      socket.emit("votarVictima", {
        codigo: codigoSala,
        victimaSocketId: victimaSocketId
      });
    }
  };

  const renderizarContenido = () => {
    switch (estado) {
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
            {miRol === "lobizon" && (
              <div className={styles.voting}>
                <h3>Selecciona a tu víctima:</h3>
                {jugadores
                  .filter(j => j.rol !== "lobizon" && j.estaVivo)
                  .map(jugador => (
                    <button
                      key={jugador.socketId}
                      onClick={() => votarVictima(jugador.socketId)}
                      className={styles.playerButton}
                    >
                      🎯 {jugador.username}
                    </button>
                  ))
                }
              </div>
            )}
            {miRol !== "lobizon" && (
              <p>💤 Esperando a que los lobizones decidan...</p>
            )}
          </div>
        );

      case "noche_especiales":
        return (
          <div className={styles.phase}>
            <h2>🌙 Noche - Roles Especiales</h2>
            <p>Roles especiales, actúen...</p>
            {victima && <p>💀 Víctima: {victima}</p>}
          </div>
        );

      case "finalizado":
        return (
          <div className={styles.phase}>
            <h2>🏁 Juego Terminado</h2>
            <p>{mensaje}</p>
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
        <p>Sala: {codigoSala} | Estado: {estado}</p>
        {miRol && <p>Tu rol: <strong>{miRol}</strong></p>}
      </header>

      <main className={styles.main}>
        {renderizarContenido()}
        
        {/* Panel de jugadores */}
        <div className={styles.playersPanel}>
          <h3>Jugadores:</h3>
          {jugadores.map(jugador => (
            <div 
              key={jugador.socketId} 
              className={`${styles.player} ${
                !jugador.estaVivo ? styles.dead : ''
              }`}
            >
              <span>{jugador.username}</span>
              <span className={styles.role}>
                {!jugador.estaVivo ? '💀' : 
                 jugador.rol === 'lobizon' ? '🐺' : '👤'}
              </span>
              {!jugador.estaVivo && <span className={styles.deadText}>(Muerto)</span>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}