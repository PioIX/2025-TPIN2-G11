"use client";
import { useSocket } from "../hooks/useSocket.js";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../components/day.module.css";
import Button from "../components/button.js";
import Modal from "./modal.js";

export default function Day({
    players,
    username,
    role,
    voteMayor,
    mayor,
    hasVotedForMayor,
    tieBreakData,
    isOpenTieBreak,
    decideTieBreak,
    voteLynch,
    hasVotedForLynch,
    lynchTieBreakData,
    isOpenLynchTieBreak,
    decideLynchTieBreak,
    lynchedPlayer,
    isOpenLynchModal,
    setIsOpenLynchModal,
    closeLynchModal,
    setLynchedPlayer
}) {
    const [isOpenMayor, setIsOpenMayor] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [hasShownWelcome, setHasShownWelcome] = useState(false);
    const [showNightTransition, setShowNightTransition] = useState(false);
    const isInitialMount = useRef(true);


    
    useEffect(() => {
        console.log('Estado de modales:', {
            isOpen,
            isOpenMayor,
            isOpenTieBreak,
            tieBreakCandidates: tieBreakData?.tieCandidates
        });
    }, [isOpen, isOpenMayor, isOpenTieBreak, tieBreakData]);

    
    useEffect(() => {
        if (lynchedPlayer && !isOpenLynchModal) {
            console.log("🌙 Linchamiento completado - Mostrando transición a noche...");
            
           
            setShowNightTransition(true);

            const timer = setTimeout(() => {
                setShowNightTransition(false);
                setLynchedPlayer(null);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [lynchedPlayer, isOpenLynchModal]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            if (role && !hasShownWelcome && !mayor) {
                console.log("Mostrando modal de bienvenida inicial");
                setIsOpen(true);
                setHasShownWelcome(true);
            }
        }
    }, [role, hasShownWelcome, mayor]);

    function onClose() {
        setIsOpen(false);
        setIsOpenMayor(true);
        console.log(isOpenMayor)
    }

    useEffect(() => {
        console.log('Después:', { isOpen, isOpenMayor });
    }, [isOpen, isOpenMayor]);

    function onCloseMayor() {
        setIsOpen(false);
        setIsOpenMayor(false);
    }

    if (mayor && isOpen) {
        setIsOpen(false);
    }

    return (
        <>
            {/* Transición de Anochecer */}
            {showNightTransition && (
                <div className={styles.nightTransition}>
                    <div className={styles.nightTransitionContent}>
                        <h1>Anocheciendo...</h1>
                        <p>El día ha terminado</p>
                        <div className={styles.moon}>🌙</div>
                    </div>
                </div>
            )}

            {isOpen == true ?
                <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    type={"startGame"}
                    role={role}
                ></Modal>
                : <></>}

            {isOpenMayor == true ? <Modal
                isOpenMayor={isOpenMayor}
                onCloseMayor={onCloseMayor}
                type={"mayor"}
                players={players}
                voteMayor={voteMayor}
                hasVotedForMayor={hasVotedForMayor}
                mayor={mayor}
            ></Modal> : <></>}

            {mayor && (
                <div className={styles.mayorInfo}>
                    <h2> Intendente Electo: {mayor}</h2>
                    {mayor === username && (
                        <p>¡Eres el intendente! Tienes el poder del Plan Platita.</p>
                    )}
                </div>
            )}

            {isOpenTieBreak && tieBreakData && (
                <Modal
                    isOpen={isOpenTieBreak}
                    onClose={() => { }}
                    type={"tieBreak"}
                    tieBreakData={tieBreakData}
                    decideTieBreak={decideTieBreak}
                />
            )}

            {isOpenLynchModal && (
                <Modal
                    isOpen={isOpenLynchModal}
                    onClose={closeLynchModal}
                    type={"lynch"}
                    players={players} 
                    voteLynch={voteLynch}
                    hasVotedForLynch={hasVotedForLynch}
                    lynchedPlayer={lynchedPlayer}
                />
            )}

            {isOpenLynchTieBreak && lynchTieBreakData && (
                <Modal
                    isOpen={isOpenLynchTieBreak}
                    onClose={() => { }}
                    type={"lynchTieBreak"}
                    lynchTieBreakData={lynchTieBreakData}
                    decideLynchTieBreak={decideLynchTieBreak}
                />
            )}

            {lynchedPlayer && !showNightTransition && (
                <div className={styles.lynchInfo}>
                    <h2>🔨 ¡{lynchedPlayer} ha sido linchado!</h2>
                    <p>Preparando la noche...</p>
                </div>
            )}

            <section className={styles.playersSection}>
                <div className={styles.playersGrid}>
                    {players.map((player, index) => (
                        <div
                            key={player.id || player.socketId || index}
                            className={`${styles.playerCard} 
                                ${player.username === username ? styles.currentPlayer : ""}
                                ${player.isHost ? styles.hostPlayer : ""}
                                ${player.isMayor ? styles.mayorPlayer : ""}
                                ${!player.isAlive ? styles.deadPlayer : ""}`}
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
                                {!player.isAlive && (
                                    <span className={styles.deadBadge}>💀 Muerto</span>
                                )}
                            </div>
                            {index === 0 && <div className={styles.crown}>👑</div>}
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}