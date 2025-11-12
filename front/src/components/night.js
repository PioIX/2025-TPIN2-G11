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
    voteNightTieBreak,
    startDay
}) {
    const [showDayTransition, setShowDayTransition] = useState(false);

    useEffect(() => {
        if (nightVictim && isNight) {
            const timer = setTimeout(() => {
                setShowDayTransition(true);
               
                setTimeout(() => {
                    setIsNight(false);
                    setShowDayTransition(false);
                    startDay();
                }, 2000);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [nightVictim, isNight, setIsNight, startDay]);

    if (!isNight) return null;

    return (
        <>
            <div className={styles.nightOverlay}>
                
                {showDayTransition && (
                    <div className={styles.dayTransition}>
                        <h1>🌅 Amaneciendo...</h1>
                        <p>La noche ha terminado</p>
                    </div>
                )}

                {nightVictim && !showDayTransition && (
                    <div className={styles.nightResult}>
                        <h1> Noche Completa</h1>
                        <p>Los lobizones han elegido a su víctima...</p>
                        <div className={styles.victimAnnouncement}>
                            <h2>🔪 ¡{nightVictim} fue atacado!</h2>
                            <p>Los lobizones han devorado a {nightVictim} durante la noche</p>
                        </div>
                    </div>
                )}

                {!nightVictim && !showDayTransition && (
                    <div className={styles.nightContainer}>
                        <div className={styles.nightHeader}>
                            <h1>🌙 Es de noche en Castro Barros</h1>
                            <p>Los lobizones deambulan por las calles...</p>
                        </div>

                        <section className={styles.playersSection}>
                            <div className={styles.playersGrid}>
                                {players.map((player, index) => (
                                    <div
                                        key={player.id || player.socketId || index}
                                        className={`${styles.playerCard} 
                                            ${player.username === username ? styles.currentPlayer : ""}
                                            ${player.isHost ? styles.hostPlayer : ""}
                                            ${player.isMayor ? styles.mayorPlayer : ""}
                                            ${!player.isAlive ? styles.deadPlayer : ""}
                                            ${styles.nightPlayer}`}
                                    >
                                        <div className={styles.playerAvatar}>
                                            {!player.isAlive ? "💀" :
                                             player.username === username ? "👤" :
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
                                            {!player.isAlive && (
                                                <span className={styles.deadBadge}>Muerto</span>
                                            )}
                                        </div>
                                        {index === 0 && <div className={styles.crown}>👑</div>}
                                    </div>
                                ))}
                            </div>
                        </section>

 
                        {role === 'lobizon' && (
                            <div className={styles.lobizonInfo}>
                                <p>Eres un lobizón. Debes elegir a quién atacar esta noche.</p>
                            </div>
                        )}

                        {role !== 'lobizon' && (
                            <div className={styles.villagerInfo}>
                                <p>Eres un aldeano. Descansa mientras los lobizones toman su decisión.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isOpenNightModal && role === 'lobizon' && (
                <Modal
                    isOpen={isOpenNightModal}
                    onClose={() => {}}
                    type={"nightKill"}
                    players={players.filter(player => player.isAlive && player.role !== 'lobizon')} 
                    voteNightKill={voteNightKill}
                    hasVotedNight={hasVotedNight}
                    nightVictim={nightVictim}
                />
            )}

 
            {isOpenNightTieBreak && nightTieBreakData && role === 'lobizon' && (
                <Modal
                    isOpen={isOpenNightTieBreak}
                    onClose={() => {}}
                    type={"nightTieBreak"}
                    nightTieBreakData={nightTieBreakData}
                    voteNightTieBreak={voteNightTieBreak}
                />
            )}
        </>
    );
}