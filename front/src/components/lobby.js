"use client";
import { useSocket } from "../hooks/useSocket.js";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../components/lobby.module.css";
import Button from "../components/button.js";

export default function Lobby({
        players,
        username,
        createdRoom, 
        errorMessage,
        setLobby,
        setGame,
        roomCode,
        closeRoom,
        leaveRoom,
        socketGame
}) {

  const isHost = useSearchParams().get("host") === "true";
  const playersAmount = useSearchParams().get("PlayersAmount") || 6;
  

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert("Código copiado al portapapeles");
  };

  function goToGame() {
    setGame(true);
    setLobby(false);
    socketGame();
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
              {players.map((player, index) => (
                <div
                  key={player.id || player.socketId || index}
                  className={`${styles.playerCard} ${player.username === username ? styles.currentPlayer : ""
                    } ${player.isHost ? styles.hostPlayer : ""
                    }`}
                >
                  <div className={styles.playerAvatar}>
                    {player.username === username ? "👤" :
                      player.isHost ? "👑" : "🎯"}
                  </div>
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>
                      {player.username}
                      {player.username === username && " (Tú)"}
                    </span>
                    {player.isHost && (
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
                    onClick={goToGame}
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
                <p><strong>Anfitrión:</strong> {players.find(p => p.isHost)?.username || "Cargando..."}</p>
                <p><strong>Jugadores:</strong> {players.length}/{playersAmount}</p>
                <p><strong>Estado:</strong> {createdRoom ? " Activa" : " Creando..."}</p>
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
        </div>);


}