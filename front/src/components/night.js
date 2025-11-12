"use client";
import { useSocket } from "../hooks/useSocket.js";
import React, { useState, useEffect } from "react";
import styles from "../components/night.module.css";
import Modal from "./modal.js";

export default function Night({
    players,
    username,
    role,
    isNight,
    setIsNight,
    nightVictim,
    isOpenNightModal,
    setIsOpenNightModal,
    voteNightKill,
    hasVotedNight,
    nightTieBreakData,
    isOpenNightTieBreak,
    setIsOpenNightTieBreak,
    voteNightTieBreak,
    startDay
}) {
    const [showDayTransition, setShowDayTransition] = useState(false);
    const [alivePlayers, setAlivePlayers] = useState([]);
    const [transitionStarted, setTransitionStarted] = useState(false);

    useEffect(() => {
        console.log("  Actualizando jugadores vivos en Night:",
            players.map(p => `${p.username} (${p.isAlive ? 'vivo' : 'muerto'})`));

        const alive = players.filter(player => player.isAlive);
        console.log(`  Jugadores vivos encontrados: ${alive.length}`,
            alive.map(p => p.username));

        setAlivePlayers(alive);
    }, [players]);

    const isLobizon = role === 'lobizón' || role === 'lobizon';
    const canVote = isLobizon && players.find(p => p.username === username)?.isAlive;

    useEffect(() => {
        console.log(" Debug Night - condiciones:", {
            isNight,
            isLobizon,
            canVote,
            nightVictim,
            isOpenNightModal,
            role,
            username,
            transitionStarted
        });

        if (isNight && isLobizon && canVote && !nightVictim && !isOpenNightModal && !transitionStarted) {
            console.log("✅ Condiciones cumplidas - abriendo modal de nightKill");

            const timer = setTimeout(() => {
                console.log("🚀 Abriendo modal de votación nocturna para:", username);
                setIsOpenNightModal(true);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [isNight, isLobizon, canVote, nightVictim, isOpenNightModal, username, setIsOpenNightModal, transitionStarted]);

    // Efecto PRINCIPAL para manejar la transición automática
    useEffect(() => {
        if (nightVictim && isNight && !transitionStarted) {
            console.log("🌅 Iniciando transición automática de noche a día...");
            setTransitionStarted(true);
            
            // Cerrar cualquier modal abierto
            setIsOpenNightModal(false);
            setIsOpenNightTieBreak(false);

            // Esperar 3 segundos para mostrar el resultado
            const resultTimer = setTimeout(() => {
                console.log("🔄 Mostrando transición...");
                setShowDayTransition(true);

                // Después de la transición, cambiar a día
                const transitionTimer = setTimeout(() => {
                    console.log("🏙️ Cambiando a día...");
                    setIsNight(false);
                    setShowDayTransition(false);
                    setTransitionStarted(false);
                    
                    if (startDay) {
                        console.log("🚀 Llamando a startDay...");
                        startDay();
                    }
                }, 3000); // Duración de la transición visual

                return () => clearTimeout(transitionTimer);
            }, 3000); // Tiempo para mostrar el resultado

            return () => clearTimeout(resultTimer);
        }
    }, [nightVictim, isNight, transitionStarted, setIsNight, startDay, setIsOpenNightModal, setIsOpenNightTieBreak]);

    const getAttackablePlayers = () => {
        return alivePlayers.filter(player => {
            const isOtherPlayer = player.username !== username;
            const isNotLobizon = player.role !== 'lobizón' && player.role !== 'lobizon';
            return isOtherPlayer && isNotLobizon && player.isAlive;
        });
    };

    // Debug en render
    console.log("🎯 Night Render - estado actual:", {
        isOpenNightModal,
        isLobizon,
        canVote,
        role,
        username,
        alivePlayersCount: alivePlayers.length,
        nightVictim,
        transitionStarted,
        showDayTransition
    });

    if (!isNight) return null;

    return (
        <>
            <div className={styles.nightOverlay}>
                {showDayTransition && (
                    <div className={styles.dayTransition}>
                        <h1>Amaneciendo...</h1>
                        <p>La noche ha terminado</p>
                    </div>
                )}

                {nightVictim && !showDayTransition && (
                    <div className={styles.nightResult}>
                        <h1>Noche Completa</h1>
                        <p>Los lobizones han elegido a su víctima...</p>
                        <div className={styles.victimAnnouncement}>
                            <h2>¡{nightVictim} fue atacado!</h2>
                            <p>Los lobizones han devorado a {nightVictim} durante la noche</p>
                        </div>
                        <div className={styles.transitionInfo}>
                            <p>Preparando el nuevo día...</p>
                        </div>
                    </div>
                )}

                {!nightVictim && !showDayTransition && (
                    <div className={styles.nightContainer}>
                        <div className={styles.nightHeader}>
                            <h1>Es de noche en Castro Barros</h1>
                            <p>Los lobizones deambulan por las calles...</p>

                            <div className={styles.roleInfo}>
                                <h3>Tu rol: {role}</h3>
                                {isLobizon ? (
                                    <p>Eres un lobizón. Debes elegir a quién atacar esta noche.</p>
                                ) : (
                                    <p>Descansa mientras los lobizones toman su decisión.</p>
                                )}
                            </div>
                        </div>

                        <section className={styles.playersSection}>
                            <h3>Jugadores ({alivePlayers.length} vivos)</h3>
                            <div className={styles.playersGrid}>
                                {alivePlayers.map((player, index) => (
                                    <div
                                        key={player.id || player.socketId || index}
                                        className={`${styles.playerCard} 
                                            ${player.username === username ? styles.currentPlayer : ""}
                                            ${player.isHost ? styles.hostPlayer : ""}
                                            ${player.isMayor ? styles.mayorPlayer : ""}
                                            ${styles.nightPlayer}`}
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
                                            {player.isMayor && (
                                                <span className={styles.mayorBadge}>Intendente</span>
                                            )}
                                            {player.username === username && (
                                                <span className={styles.roleBadge}>{role}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {isLobizon && canVote && (
                            <div className={styles.actionInfo}>
                                <p>Puedes votar por atacar a otro jugador. Elige cuidadosamente.</p>
                                <p>Jugadores disponibles para atacar: {getAttackablePlayers().length}</p>
                                {!isOpenNightModal && (
                                    <p className={styles.waitingModal}>El modal de votación se abrirá automáticamente...</p>
                                )}
                            </div>
                        )}

                        {isLobizon && !canVote && (
                            <div className={styles.deadInfo}>
                                <p>Estás muerto. No puedes participar en las votaciones nocturnas.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal para votación nocturna - solo para lobizones vivos */}
            {isOpenNightModal && isLobizon && canVote && (
                <Modal
                    isOpen={isOpenNightModal}
                    onClose={() => { }}
                    type={"nightKill"}
                    players={getAttackablePlayers()}
                    voteNightKill={voteNightKill}
                    hasVotedNight={hasVotedNight}
                    nightVictim={nightVictim}
                />
            )}

            {/* Modal para desempate nocturno - solo para lobizones vivos */}
            {isOpenNightTieBreak && nightTieBreakData && isLobizon && canVote && (
                <Modal
                    isOpen={isOpenNightTieBreak}
                    onClose={() => { }}
                    type={"nightTieBreak"}
                    nightTieBreakData={nightTieBreakData}
                    voteNightTieBreak={voteNightTieBreak}
                />
            )}
        </>
    );
}