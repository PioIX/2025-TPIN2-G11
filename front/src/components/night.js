"use client";
import { useSocket } from "../hooks/useSocket.js";
import React, { useState, useEffect, useRef } from "react";
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
    startDay,
    setIsOpenNightModaltarotista,
    handleShowTarotistaResult,
    isOpenNightModaltarotista,
    voteNightQuestion,
    hasVotedQuestion,
    tarotistaResult
}) {
    const [showDayTransition, setShowDayTransition] = useState(false);
    const [alivePlayers, setAlivePlayers] = useState([]);
    const [showTarotistaResultLocal, setShowTarotistaResultLocal] = useState(false);
    const transitionTimeoutRef = useRef(null);


    useEffect(() => {
        const positionPlayersInCircle = () => {
            const cards = document.querySelectorAll('[class*="playerCard"]');
            const container = document.querySelector('[class*="playersGrid"]');

            if (!cards.length || !container) return;

            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const radius = Math.min(containerWidth, containerHeight) * 0.42;
            const centerX = containerWidth / 2;
            const centerY = containerHeight / 2;
            const totalPlayers = cards.length;
            const angleStep = (2 * Math.PI) / totalPlayers;
            const startAngle = -Math.PI / 2;

            cards.forEach((card, index) => {
                const angle = startAngle + (index * angleStep);
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                card.style.left = `${x}px`;
                card.style.top = `${y}px`;
            });
        };

        positionPlayersInCircle();

        window.addEventListener('resize', positionPlayersInCircle);

        return () => {
            window.removeEventListener('resize', positionPlayersInCircle);
        };
    }, [players]);

    useEffect(() => {
        console.log("  Actualizando jugadores vivos en Night:",
            players.map(p => `${p.username} (${p.isAlive ? 'vivo' : 'muerto'})`));

        const alive = players.filter(player => player.isAlive);
        console.log(`  Jugadores vivos encontrados: ${alive.length}`,
            alive.map(p => p.username));

        setAlivePlayers(alive);
    }, [players]);

    const isLobizon = role === 'Lobizón';
    const isTarotista = role === 'Tarotista';
    const canVote = (isLobizon || isTarotista) && players.find(p => p.username === username)?.isAlive;

    console.log("Night - Estado del jugador:", {
        username,
        role,
        isLobizon,
        isTarotista,
        canVote,
        isAlive: players.find(p => p.username === username)?.isAlive
    });

    useEffect(() => {
        if (nightVictim && isNight) {
            console.log("Noche completada - Iniciando transición a día...");

            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }

            setIsOpenNightModal(false);
            setIsOpenNightModaltarotista(false);
            setIsOpenNightTieBreak(false);

            transitionTimeoutRef.current = setTimeout(() => {
                console.log(" Mostrando resultado de la noche...");

                transitionTimeoutRef.current = setTimeout(() => {
                    console.log("Mostrando transición a día...");
                    setShowDayTransition(true);

                    transitionTimeoutRef.current = setTimeout(() => {
                        console.log("Llamando a startDay...");
                        setShowDayTransition(false);

                        if (startDay && typeof startDay === 'function') {
                            startDay();
                        } else {
                            console.error(" startDay no es una función válida");
                            setIsNight(false);
                        }
                    }, 2000);
                }, 3000);
            }, 500);
        }

        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, [nightVictim, isNight, startDay, setIsNight, setIsOpenNightModal, setIsOpenNightModaltarotista, setIsOpenNightTieBreak]);

    useEffect(() => {
        if (!isNight) {
            console.log(" Limpiando estados de Night - Día activo");
            setShowDayTransition(false);
            setIsOpenNightModal(false);
            setIsOpenNightModaltarotista(false);
            setIsOpenNightTieBreak(false);
            setShowTarotistaResultLocal(false);

            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        }
    }, [isNight, setIsOpenNightModaltarotista]);

    const getAttackablePlayers = () => {
        return alivePlayers.filter(player => {
            const isOtherPlayer = player.username !== username;
            const isNotLobizon = player.role !== 'Lobizón';
            return isOtherPlayer && isNotLobizon && player.isAlive;
        });
    };

    if (!isNight) {
        console.log("Night component - isNight es false, no renderizar");
        return null;
    }

    console.log("Night Render - estado actual:", {
        isOpenNightModal,
        isOpenNightModaltarotista,
        isLobizon,
        isTarotista,
        canVote,
        role,
        username,
        alivePlayersCount: alivePlayers.length,
        nightVictim,
        showDayTransition,
        attackablePlayers: getAttackablePlayers().length
    });

    const handleCloseTarotistaResult = () => {
        setShowTarotistaResultLocal(false);
        if (handleShowTarotistaResult && typeof handleShowTarotistaResult === 'function') {
            handleShowTarotistaResult(null);
        }
    };

    return (
        <>
            <div className={styles.nightOverlay}>
                {showDayTransition && (
                    <div className={styles.dayTransition}>
                        <h1>Amaneciendo...</h1>
                        <p>La noche ha terminado</p>
                        <div className={styles.sun}>☀️</div>
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
                            <div className={styles.loadingSpinner}></div>
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
                                ) : isTarotista ? (
                                    <>< div className={styles.tarotistaResult}>
                                        <p>Eres el tarotista. Puedes consultar el rol de un jugador.</p>
                                        <h3> Consulta de Tarotista</h3>
                                        <p>{tarotistaResult?.message || "El tarotista ha consultado las cartas..."}</p>
                                    </div></>
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

                        {isTarotista && canVote && (
                            <div className={styles.actionInfo}>
                                <p>Como tarotista, puedes consultar el rol de un jugador.</p>
                                {!isOpenNightModaltarotista && (
                                    <p className={styles.waitingModal}>El modal de consulta se abrirá automáticamente...</p>
                                )}
                            </div>
                        )}

                        {(isLobizon || isTarotista) && !canVote && (
                            <div className={styles.deadInfo}>
                                <p>Estás muerto. No puedes participar en las votaciones nocturnas.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isOpenNightModaltarotista && isTarotista && canVote && (
                <Modal
                    isOpen={isOpenNightModaltarotista}
                    onClose={() => { }}
                    type={"nightQuestion"}
                    players={alivePlayers}
                    voteNightQuestion={voteNightQuestion}
                    nightVictim={nightVictim}
                    hasVotedQuestion={hasVotedQuestion}
                />
            )}

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