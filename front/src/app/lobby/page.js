"use client";
import { useSocket } from "../../hooks/useSocket.js";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../lobby/lobby.module.css";
import Button from "../../components/button.js";

export default function Lobby() {
  const { socket } = useSocket();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const codigoSala = searchParams.get("codigo");
  const esAnfitrion = searchParams.get("host") === "true";
  const cantidadJugadores = searchParams.get("cantidadJugadores") || 6;

  const [jugadores, setJugadores] = useState([]);
  const [username, setUsername] = useState("");
  const [salaCreada, setSalaCreada] = useState(false);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    
    const savedUsername = localStorage.getItem("username") || "Invitado";
    setUsername(savedUsername);

    if (!socket) return;

    if (esAnfitrion) {
      socket.emit("crearSala", {
        codigo: codigoSala,
        anfitrion: savedUsername,
        maxJugadores: parseInt(cantidadJugadores)
      });
    } else {
      socket.emit("joinRoom", {
        codigo: codigoSala,
        username: savedUsername
      });
    }

    socket.on("usersInRoom", (listaJugadores) => {
      setJugadores(listaJugadores);
      setSalaCreada(true);
    });

    socket.on("errorSala", (mensaje) => {
      setMensajeError(mensaje);
      alert(mensaje);
      setTimeout(() => router.push("/"), 2000);
    });

    socket.on("salaCerrada", (mensaje) => {
      alert(mensaje);
      router.push("/");
    });

    socket.on("gameStarted", (iniciado) => {
      setJuegoIniciado(iniciado);
      if (iniciado) {
        alert("¡El juego ha comenzado!");
        // Aquí puedes redirigir a la pantalla de juego
      }
    });

    return () => {
      if (socket) {
        socket.off("usersInRoom");
        socket.off("errorSala");
        socket.off("salaCerrada");
        socket.off("gameStarted");
      }
    };
  }, [socket, codigoSala, esAnfitrion, cantidadJugadores, router]);

  const iniciarJuego = () => {
    if (socket && esAnfitrion) {
      socket.emit("iniciarJuego", { codigo: codigoSala });
    }
  };

  const cerrarSala = () => {
    if (socket && esAnfitrion) {
      socket.emit("cerrarSala", { codigo: codigoSala });
    }
  };

  const abandonarSala = () => {
    if (socket) {
      socket.emit("abandonarSala", { codigo: codigoSala });
      router.push("/");
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoSala);
    alert("Código copiado al portapapeles");
  };

  if (mensajeError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{mensajeError}</p>
          <Button title="Volver al Inicio" onClick={() => router.push("/")} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.roomInfo}>
          <h1>Sala: {codigoSala}</h1>
          <div className={styles.badge}>
            {esAnfitrion ? " Anfitrión" : " Jugador"}
          </div>
        </div>
        
        <div className={styles.actions}>
          <Button 
            title=" Copiar Código" 
            onClick={copiarCodigo}
            className={styles.btnSecondary}
          />
          {esAnfitrion ? (
            <Button 
              title=" Cerrar Sala" 
              onClick={cerrarSala}
              className={styles.btnDanger}
            />
          ) : (
            <Button 
              title=" Abandonar" 
              onClick={abandonarSala}
              className={styles.btnWarning}
            />
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className={styles.main}>
        {/* Panel de Jugadores */}
        <section className={styles.playersSection}>
          <h2>Jugadores en la Sala ({jugadores.length}/{cantidadJugadores})</h2>
          <div className={styles.playersGrid}>
            {jugadores.map((jugador, index) => (
              <div 
                key={jugador.id} 
                className={`${styles.playerCard} ${
                  jugador.username === username ? styles.currentPlayer : ""
                } ${
                  esAnfitrion && jugador.username === username ? styles.hostPlayer : ""
                }`}
              >
                <div className={styles.playerAvatar}>
                  {jugador.username === username ? "👤" : "🎯"}
                </div>
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>
                    {jugador.username}
                    {jugador.username === username && " (Tú)"}
                  </span>
                  {esAnfitrion && jugador.username === username && (
                    <span className={styles.hostBadge}>Anfitrión</span>
                  )}
                </div>
                {index === 0 && <div className={styles.crown}></div>}
              </div>
            ))}
            
            {/* Espacios vacíos */}
            {Array.from({ length: parseInt(cantidadJugadores) - jugadores.length }).map((_, index) => (
              <div key={`empty-${index}`} className={styles.emptySlot}>
                <div className={styles.emptyAvatar}>➕</div>
                <span className={styles.waitingText}>Esperando jugador...</span>
              </div>
            ))}
          </div>
        </section>

        {/* Panel de Control */}
        <section className={styles.controlSection}>
          {esAnfitrion && (
            <div className={styles.hostControls}>
              <div className={styles.controlButtons}>
                <Button
                  title=" Iniciar Juego"
                  onClick={iniciarJuego}
                  disabled={jugadores.length < 2}
                  className={styles.btnPrimary}
                />
              </div>
              {jugadores.length < 2 && (
                <p className={styles.warning}>
                  Se necesitan al menos 6 jugadores para iniciar
                </p>
              )}
            </div>
          )}

          {/* Chat o Información de Sala */}
          <div className={styles.infoPanel}>
            <h3>Información de la Sala</h3>
            <div className={styles.infoContent}>
              <p><strong>Código:</strong> {codigoSala}</p>
              <p><strong>Anfitrión:</strong> {jugadores[0]?.username || "Cargando..."}</p>
              <p><strong>Jugadores:</strong> {jugadores.length}/{cantidadJugadores}</p>
              <p><strong>Estado:</strong> {salaCreada ? "Activa" : "Creando..."}</p>
            </div>
            
            {!esAnfitrion && (
              <div className={styles.guestInfo}>
                <p> Esperando a que el anfitrión inicie el juego...</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Comparte el código de sala con tus amigos para que se unan</p>
      </footer>

      {/* Modal de Juego Iniciado */}
      {juegoIniciado && (
        <div className={styles.gameStartedModal}>
          <div className={styles.modalContent}>
            <h2> ¡El juego ha comenzado!</h2>
            <p>Redirigiendo a la pantalla de juego...</p>
            <Button
              title="Comenzar a Jugar"
              onClick={() => alert("Pantalla de juego en desarrollo")}
              className={styles.btnPrimary}
            />
          </div>
        </div>
      )}
    </div>
  );
}