"use client";
import { useSocket } from "../../hooks/useSocket.js";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../lobby/lobby.module.css";
import Button from "../../components/button.js";

export default function Lobby() {
  const socketObj = useSocket(); // Esto retorna { socket }
  const socket = socketObj?.socket; // Extraemos el socket del objeto
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
  
  // Usar useRef para evitar múltiples conexiones
  const seUnioASala = useRef(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("username") || "Invitado";
    setUsername(savedUsername);
    
    console.log(" Estado del socket:", {
      socketDisponible: !!socket,
      socketId: socket?.id,
      codigoSala,
      esAnfitrion,
      username: savedUsername
    });

    if (!socket) {
      console.log(" Esperando conexión socket...");
      return;
    }

    // Evitar unirse múltiples veces
    if (seUnioASala.current) {
      console.log(" Ya se unió a la sala, evitando duplicado");
      return;
    }

    // Configurar listeners PRIMERO, antes de emitir
    const setupSocketListeners = () => {
      socket.on("usersInRoom", (listaJugadores) => {
        console.log("Jugadores en sala recibidos:", listaJugadores);
        console.log("Detalles:", {
          total: listaJugadores.length,
          jugadores: listaJugadores.map(j => ({
            username: j.username,
            esAnfitrion: j.esAnfitrion,
            id: j.id
          }))
        });
        setJugadores(listaJugadores);
        setSalaCreada(true);
      });

      socket.on("errorSala", (mensaje) => {
        console.error(" Error de sala:", mensaje);
        setMensajeError(mensaje);
        alert("Error: " + mensaje);
        setTimeout(() => router.push("/"), 3000);
      });

      socket.on("salaCerrada", (mensaje) => {
        console.log(" Sala cerrada:", mensaje);
        alert(mensaje);
        router.push("/");
      });

      socket.on("gameStarted", (iniciado) => {
        console.log(" Juego iniciado:", iniciado);
        setJuegoIniciado(iniciado);
        if (iniciado) {
          alert("¡El juego ha comenzado!");
        }
      });

      // Debug: escuchar todos los eventos
      socket.onAny((eventName, ...args) => {
        console.log(" Evento socket recibido:", eventName, args);
      });
    };

    setupSocketListeners();

    // Unirse a la sala después de un pequeño delay para asegurar que los listeners estén configurados
    const timeoutId = setTimeout(() => {
      console.log(" Uniéndose a sala:", codigoSala);
      
      if (esAnfitrion) {
        console.log(" Anfitrión creando sala...");
        socket.emit("crearSala", {
          codigo: codigoSala,
          anfitrion: savedUsername,
          maxJugadores: parseInt(cantidadJugadores)
        });
      } else {
        console.log(" Jugador uniéndose a sala...");
        socket.emit("joinRoom", {
          codigo: codigoSala,
          username: savedUsername
        });
      }
      seUnioASala.current = true;
    }, 1000); // Aumentamos el delay para asegurar que los listeners estén listos

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (socket) {
        socket.off("usersInRoom");
        socket.off("errorSala");
        socket.off("salaCerrada");
        socket.off("gameStarted");
        socket.offAny();
      }
    };
  }, [socket, codigoSala, esAnfitrion, cantidadJugadores, router]);

  const iniciarJuego = () => {
    if (socket && esAnfitrion) {
      console.log(" Emitiendo iniciar juego...");
      socket.emit("iniciarJuego", { codigo: codigoSala });
    }
  };

  const cerrarSala = () => {
    if (socket && esAnfitrion) {
      console.log(" Cerrando sala...");
      socket.emit("cerrarSala", { codigo: codigoSala });
    }
  };

  const abandonarSala = () => {
    if (socket) {
      console.log(" Abandonando sala...");
      socket.emit("abandonarSala", { codigo: codigoSala });
      router.push("/");
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoSala);
    alert("Código copiado al portapapeles");
  };

  // Agregar evento "iniciarJuego" al servidor si no existe
  useEffect(() => {
    if (!socket) return;

    socket.on("iniciarJuego", (data) => {
      console.log("Juego iniciado recibido:", data);
      setJuegoIniciado(true);
    });

    return () => {
      socket.off("iniciarJuego");
    };
  }, [socket]);

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
            {esAnfitrion ? "Anfitrión" : "Jugador"}
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            title="Copiar Código"
            onClick={copiarCodigo}
            className={styles.btnSecondary}
          />
          {esAnfitrion ? (
            <Button
              title="Cerrar Sala"
              onClick={cerrarSala}
              className={styles.btnDanger}
            />
          ) : (
            <Button
              title="Abandonar"
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
                key={jugador.id || jugador.socketId || index}
                className={`${styles.playerCard} ${
                  jugador.username === username ? styles.currentPlayer : ""
                } ${
                  jugador.esAnfitrion ? styles.hostPlayer : ""
                }`}
              >
                <div className={styles.playerAvatar}>
                  {jugador.username === username ? "👤" : 
                   jugador.esAnfitrion ? "👑" : "🎯"}
                </div>
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>
                    {jugador.username}
                    {jugador.username === username && " (Tú)"}
                  </span>
                  {jugador.esAnfitrion && (
                    <span className={styles.hostBadge}>Anfitrión</span>
                  )}
                </div>
                {index === 0 && <div className={styles.crown}>👑</div>}
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
                  Se necesitan al menos 2 jugadores para iniciar
                </p>
              )}
            </div>
          )}

          {/* Información de Sala */}
          <div className={styles.infoPanel}>
            <h3>Información de la Sala</h3>
            <div className={styles.infoContent}>
              <p><strong>Código:</strong> {codigoSala}</p>
              <p><strong>Anfitrión:</strong> {jugadores.find(j => j.esAnfitrion)?.username || "Cargando..."}</p>
              <p><strong>Jugadores:</strong> {jugadores.length}/{cantidadJugadores}</p>
              <p><strong>Estado:</strong> {salaCreada ? " Activa" : " Creando..."}</p>
              <p><strong>Socket ID:</strong> {socket?.id || "Desconectado"}</p>
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