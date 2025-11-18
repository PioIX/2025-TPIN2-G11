
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./finDeJuego.module.css";

export default function FinDeJuego({ winner, players, playAgain, aliveLobizones, aliveVillagers }) {
  const [revealedPlayers, setRevealedPlayers] = useState([]);
  const [showWinner, setShowWinner] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const router = useRouter();
  const confettiRef = useRef(null);

  useEffect(() => {

    if (winner && winner.winner) {
      if (winner.winner === "Aldeanos") {
        console.log(" ¡Ganan los aldeanos! Actualizando scores...");

        const aliveVillagerPlayers = players.filter(p => p.isAlive && p.role !== 'Lobizón');

        aliveVillagerPlayers.forEach(p => {
          fetch('http://localhost:4000/updateScore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: p.username })
          }).then(response => {
            if (!response.ok) {
              console.error("Error actualizando score para:", p.username);
            } else {
              console.log("Score actualizado para aldeano:", p.username);
            }
          }).catch(error => {
            console.error("Error en fetch:", error);
          });
        });
      } else if (winner.winner === "Lobizones") {
        console.log("¡Ganan los lobizones! Actualizando scores...");

        const aliveLobizonPlayers = players.filter(p => p.isAlive && p.role === 'Lobizón');

        aliveLobizonPlayers.forEach(p => {
          fetch('http://localhost:4000/updateScore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: p.username })
          }).then(response => {
            if (!response.ok) {
              console.error("Error actualizando score para:", p.username);
            } else {
              console.log("Score actualizado para lobizón:", p.username);
            }
          }).catch(error => {
            console.error("Error en fetch:", error);
          });
        });
      }
    }
  }, [winner, players]);

  useEffect(() => {
    const revealPlayers = async () => {
      for (let i = 0; i < players.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setRevealedPlayers(prev => [...prev, players[i]]);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowWinner(true);
      setConfettiActive(true);
    };

    revealPlayers();
  }, [players]);

  useEffect(() => {
    if (confettiActive && confettiRef.current) {
      createConfetti();
    }
  }, [confettiActive]);

  const createConfetti = () => {
    const confettiContainer = confettiRef.current;
    if (!confettiContainer) return;

    const colors = winner.winner === "Lobizones"
      ? ['#8B0000', '#DC143C', '#FF4500', '#B22222']
      : ['#228B22', '#32CD32', '#00FF00', '#90EE90'];

    for (let i = 0; i < 150; i++) {
      const confetti = document.createElement('div');
      confetti.className = styles.confetti;
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiContainer.appendChild(confetti);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Lobizón': return '🐺';
      case 'Aldeano': return '👨‍🌾';
      case 'Bruja': return '🧙‍♀️';
      case 'Cazador': return '🏹';
      case 'Vidente': return '🔮';
      default: return '❓';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Lobizón': return '#8B0000';
      case 'Aldeano': return '#228B22';
      case 'Bruja': return '#8A2BE2';
      case 'Cazador': return '#DAA520';
      case 'Vidente': return '#4682B4';
      default: return '#666666';
    }
  };

  const handleReturnToHome = () => {
    router.push("/");
  };


  const handlePlayAgain = () => {
    console.log("🔄 Solicitando nueva partida...");
    playAgain();
  }

  if (!winner) {
    return (
      <div className={styles.container}>
        <h1>¡Juego Terminado!</h1>
        <p>Cargando resultados...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div
        ref={confettiRef}
        className={`${styles.confettiContainer} ${confettiActive ? styles.active : ''}`}
      ></div>

      <div className={styles.content}>
        {/* ganador */}
        {showWinner && (
          <div className={`${styles.winnerSection} ${styles.slideIn}`}>
            <div className={styles.winnerHeader}>
              <h1 className={styles.winnerTitle}>
                {winner.winner === "Lobizones" ? "🏆 ¡LOS LOBIZONES GANAN! 🏆" : "🏆 ¡LOS ALDEANOS GANAN! 🏆"}
              </h1>
              <div className={styles.winnerIcon}>
                {winner.winner === "Lobizones" ? "🐺👑" : "👨‍🌾👑"}
              </div>
            </div>

            <div className={styles.winnerMessage}>
              <p>{winner.message}</p>
              {winner.details && (
                <div className={styles.winnerDetails}>
                  {winner.details.lobizonesRestantes !== undefined && (
                    <p>Lobizones restantes: {winner.details.lobizonesRestantes}</p>
                  )}
                  {winner.details.aldeanosRestantes !== undefined && (
                    <p>Aldeanos restantes: {winner.details.aldeanosRestantes}</p>
                  )}
                  {winner.details.jugadorFinal && (
                    <p>Último jugador: {winner.details.jugadorFinal} ({winner.details.rolFinal})</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.rolesSection}>
          <h2 className={styles.rolesTitle}>Revelación de Roles</h2>
          <div className={styles.playersGrid}>
            {players.map((player, index) => (
              <div
                key={player.username}
                className={`${styles.playerCard} ${revealedPlayers.includes(player) ? styles.revealed : styles.hidden
                  }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={styles.playerHeader}>
                  <span className={styles.playerName}>{player.username}</span>
                  {!player.isAlive && <span className={styles.deadBadge}>💀</span>}
                </div>

                <div className={styles.roleReveal}>
                  <div
                    className={styles.roleIcon}
                    style={{ backgroundColor: getRoleColor(player.role) }}
                  >
                    {getRoleIcon(player.role)}
                  </div>
                  <span
                    className={styles.roleName}
                    style={{ color: getRoleColor(player.role) }}
                  >
                    {player.role}
                  </span>
                </div>

                <div className={styles.playerStatus}>
                  {player.isMayor && <span className={styles.mayorStatus}>👑 Intendente</span>}
                  <span className={player.isAlive ? styles.aliveStatus : styles.deadStatus}>
                    {player.isAlive ? '❤️ Vivo' : '💀 Muerto'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showWinner && (
          <div className={`${styles.actionsSection} ${styles.fadeIn}`}>
            <button
              className={styles.playAgainButton}
              onClick={handlePlayAgain}
            >
              Jugar Otra Vez
            </button>
            <button
              className={styles.lobbyButton}
              onClick={handleReturnToHome}
            >
              Volver al Home
            </button>
          </div>
        )}


        {showWinner && (
          <div className={styles.statsSection}>
            <div className={styles.statCard}>
              <h3>Resumen del Juego</h3>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {players.filter(p => p.role === 'Lobizón').length}
                  </span>
                  <span className={styles.statLabel}>Lobizones</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {players.filter(p => p.role !== 'Lobizón').length}
                  </span>
                  <span className={styles.statLabel}>Aldeanos</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {players.filter(p => p.isAlive).length}
                  </span>
                  <span className={styles.statLabel}>Sobrevivieron</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>
                    {players.filter(p => !p.isAlive).length}
                  </span>
                  <span className={styles.statLabel}>Fallecieron</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
