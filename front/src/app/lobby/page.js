"use client";
import { useSocket } from "../../hooks/useSocket.js";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../lobby/lobby.module.css";
import Button from "../../components/button.js";

export default function Lobby() {
  const socketObj = useSocket();
  const socket = socketObj?.socket;
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomCode = searchParams.get("code");
  const isHost = searchParams.get("host") === "true";
  const playersAmount = searchParams.get("playersAmount") || 6;
  const usernameFromParams = searchParams.get("username"); // Obtener username de la URL

  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState("");
  const [createdRoom, setCreatedRoom] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const joinedARoom = useRef(false);

  useEffect(() => {
    // USAR EL USERNAME DE LOS PARÁMETROS DE LA URL PRIMERO
    // Si no hay en la URL, usar localStorage, sino "Invitado"
    const userToUse = usernameFromParams || localStorage.getItem("username") || "Invitado";
    setUsername(userToUse);
    
    console.log(" Estado del socket:", {
      socketDisponible: !!socket,
      socketId: socket?.id,
      roomCode,
      isHost,
      username: userToUse,
      usernameFromParams: usernameFromParams
    });

    if (!socket) {
      console.log(" Esperando conexión socket...");
      return;
    }

    if (joinedARoom.current) {
      console.log(" Ya se unió a la sala, evitando duplicado");
      return;
    }

    const setupSocketListeners = () => {
      socket.on("usersInRoom", (playersList) => {
        console.log("Jugadores en sala recibidos:", playersList);
        setPlayers(playersList);
        setCreatedRoom(true);
      });

      socket.on("roomError", (message) => {
        console.error(" Error de sala:", message);
        setErrorMessage(message);
        alert("Error: " + message);
        setTimeout(() => router.push("/"), 3000);
      });

      socket.on("closedRoom", (message) => {
        console.log(" Sala cerrada:", message);
        alert(message);
        router.push("/");
      });

      socket.on("gameStarted", (data) => {
        console.log("Juego iniciado recibido:", data);
        setGameStarted(true);
        localStorage.setItem('roomCode', roomCode);
        localStorage.setItem('isHost', isHost.toString());
        setTimeout(() => {
          router.push("/gameRoom");
        }, 2000);
      });

      socket.onAny((eventName, ...args) => {
        console.log(" Evento socket recibido:", eventName, args);
      });
    };

    setupSocketListeners();

    const timeoutId = setTimeout(() => {
      console.log(" Uniéndose a sala:", roomCode);
      console.log(" Username a usar:", userToUse);
      
      if (isHost) {
        console.log(" Anfitrión creando sala...");
        socket.emit("crearSala", {
          code: roomCode,
          anfitrion: userToUse, // Usar userToUse en lugar de savedUsername
          maxJugadores: parseInt(playersAmount)
        });
      } else {
        console.log(" Jugador uniéndose a sala...");
        socket.emit("joinRoom", {
          code: roomCode,
          username: userToUse // Usar userToUse en lugar de savedUsername
        });
      }
      joinedARoom.current = true;
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (socket) {
        socket.off("usersInRoom");
        socket.off("roomError");
        socket.off("closedRoom");
        socket.off("gameStarted");
        socket.offAny();
      }
    };
  }, [socket, roomCode, isHost, playersAmount, router, usernameFromParams]); // Agregar usernameFromParams a las dependencias

  const startGame = () => {
    if (socket && isHost) {
      console.log(" Emitiendo iniciar juego...");
      socket.emit("startGame", { code: roomCode });
      localStorage.setItem('roomCode', roomCode);
      localStorage.setItem('isHost', 'true');
      setTimeout(() => {
        router.push("/gameRoom");
      }, 2000);
    }
  };

  const closeRoom = () => {
    if (socket && isHost) {
      console.log("Cerrando sala...");
      socket.emit("closeRoom", { code: roomCode });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      console.log("Abandonando sala...");
      socket.emit("leaveRoom", { code: roomCode });
      router.push("/");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert("Código copiado al portapapeles");
  };

  function goToGame() {
    router.push("/gameRoom");
  }

  if (errorMessage) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{errorMessage}</p>
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
          <h1>Sala: {roomCode}</h1>
          <div className={styles.badge}>
            {isHost ? "Anfitrión" : "Jugador"}
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            title="Copiar Código"
            onClick={copyCode}
            className={styles.btnSecondary}
          />
          {isHost ? (
            <Button
              title="Cerrar Sala"
              onClick={closeRoom}
              className={styles.btnDanger}
            />
          ) : (
            <Button
              title="Abandonar"
              onClick={leaveRoom}
              className={styles.btnWarning}
            />
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className={styles.main}>
        {/* Panel de Jugadores */}
        <section className={styles.playersSection}>
          <h2>Jugadores en la Sala ({players.length}/{playersAmount})</h2>
          <div className={styles.playersGrid}>
            {players.map((jugador, index) => (
              <div
                key={jugador.id || jugador.socketId || index}
                className={`${styles.playerCard} ${jugador.username === username ? styles.currentPlayer : ""
                  } ${jugador.isHost ? styles.hostPlayer : ""
                  }`}
              >
                <div className={styles.playerAvatar}>
                  {jugador.username === username ? "👤" :
                    jugador.isHost ? "👑" : "🎯"}
                </div>
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>
                    {jugador.username}
                    {jugador.username === username && " (Tú)"}
                  </span>
                  {jugador.isHost && (
                    <span className={styles.hostBadge}>Anfitrión</span>
                  )}
                </div>
                {index === 0 && <div className={styles.crown}>👑</div>}
              </div>
            ))}

            {/* Espacios vacíos */}
            {Array.from({ length: parseInt(playersAmount) - players.length }).map((_, index) => (
              <div key={`empty-${index}`} className={styles.emptySlot}>
                <div className={styles.emptyAvatar}>➕</div>
                <span className={styles.waitingText}>Esperando jugador...</span>
              </div>
            ))}
          </div>
        </section>

        {/* Panel de Control */}
        <section className={styles.controlSection}>
          {isHost && (
            <div className={styles.hostControls}>
              <div className={styles.controlButtons}>
                <Button
                  title=" Iniciar Juego"
                  onClick={startGame}
                  disabled={players.length < 2}
                  className={styles.btnPrimary}
                />
              </div>
              {players.length < 2 && (
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
              <p><strong>Código:</strong> {roomCode}</p>
              <p><strong>Anfitrión:</strong> {players.find(j => j.isHost)?.username || "Cargando..."}</p>
              <p><strong>Jugadores:</strong> {jugadores.length}/{playersAmount}</p>
              <p><strong>Estado:</strong> {createdRoom ? " Activa" : " Creando..."}</p>
              <p><strong>Socket ID:</strong> {socket?.id || "Desconectado"}</p>
              <p><strong>Tu username:</strong> {username}</p>
            </div>

            {!isHost && (
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
      {gameStarted && (
        <div className={styles.gameStartedModal}>
          <div className={styles.modalContent}>
            <h2> ¡El juego ha comenzado!</h2>
            <p>Redirigiendo a la pantalla de juego...</p>
            <Button
              title="Comenzar a Jugar"
              onClick={goToGame}
              className={styles.btnPrimary}
            />
          </div>
        </div>
      )}
    </div>
  );
}