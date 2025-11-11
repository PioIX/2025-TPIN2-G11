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
    voteLynch,
    hasVotedForLynch,
    lynchedPlayer,
    isOpenLynch,
    setIsOpenLynch
}) {
    const [isOpenMayor, setIsOpenMayor] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (mayor) {
            setIsOpenMayor(false);
            console.log(" Modal de votación cerrado - Intendente electo:", mayor);
        }
    }, [mayor]);

    function onClose() {
        setIsOpen(false);
        setIsOpenMayor(true);
        console.log("🔄 Abriendo modal de votación");
    }

    useEffect(() => {
        console.log('Estado de modales:', { isOpen, isOpenMayor, isOpenLynch });
    }, [isOpen, isOpenMayor, isOpenLynch]);

    function onCloseMayor() {
        setIsOpen(false);
        setIsOpenMayor(false);
        console.log(" Votación cancelada");
    }

    function onCloseLynch() {
        setIsOpenLynch(false);
        console.log(" Votación de linchamiento cancelada");
    }

    return (
        <>
            {isOpen && (
                <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    type={"startGame"}
                    role={role}
                />
            )}

            {isOpenMayor && (
                <Modal
                    isOpenMayor={isOpenMayor}
                    onCloseMayor={onCloseMayor}
                    type={"mayor"}
                    players={players}
                    voteMayor={voteMayor}
                    hasVotedForMayor={hasVotedForMayor}
                    mayor={mayor}
                />
            )}

            {isOpenLynch && (
                <Modal
                    isOpenLynch={isOpenLynch}
                    onCloseLynch={onCloseLynch}
                    type={"lynch"}
                    players={players.filter(player => player.isAlive)} 
                    voteLynch={voteLynch}
                    hasVotedForLynch={hasVotedForLynch}
                    lynchedPlayer={lynchedPlayer}
                />
            )}

            {mayor && (
                <div className={styles.mayorInfo}>
                    <h2>👑 Intendente Electo: {mayor}</h2>
                    {mayor === username && (
                        <p>¡Eres el intendente! Tienes el poder del Plan Platita.</p>
                    )}
                </div>
            )}

            {lynchedPlayer && (
                <div className={styles.lynchInfo}>
                    <h2>💀 Jugador Linchado: {lynchedPlayer}</h2>
                    <p>El pueblo ha decidido su destino...</p>
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
                                {!player.isAlive ? "💀" :
                                 player.isMayor ? "👑" :
                                 player.username === username ? "👤" :
                                 player.isHost ? "👑" : "🎯"}
                            </div>
                            <div className={styles.playerInfo}>
                                <span className={styles.playerName}>
                                    {player.username}
                                    {player.username === username && " (Tú)"}
                                    {player.isMayor && " 👑"}
                                    {!player.isAlive && " 💀"}
                                </span>
                                {player.isHost && (
                                    <span className={styles.hostBadge}>Anfitrión</span>
                                )}
                                {player.mayorVotes > 0 && !player.isMayor && (
                                    <span className={styles.voteBadge}>Votos: {player.mayorVotes}</span>
                                )}
                                {player.lynchVotes > 0 && player.isAlive && (
                                    <span className={styles.lynchVoteBadge}>Linchamiento: {player.lynchVotes}</span>
                                )}
                                {player.isMayor && (
                                    <span className={styles.mayorBadge}>Intendente</span>
                                )}
                                {!player.isAlive && (
                                    <span className={styles.deadBadge}>Muerto</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}