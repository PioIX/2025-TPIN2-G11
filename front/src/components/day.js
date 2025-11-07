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
    voteMayor
}) {
    const [isOpenMayor, setIsOpenMayor]= useState(false);
    const [isOpen, setIsOpen]= useState(true);

    function onClose() {
        setIsOpen(false);
        setIsOpenMayor(true);
        console.log(isOpenMayor)
    }

        useEffect(() => {
        console.log('Después:', { isOpen, isOpenMayor });
    }, [isOpen, isOpenMayor]);

    function onCloseMayor(){
        setIsOpen(false);
        setIsOpenMayor(false);
    }

    return (
        <>
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
            ></Modal> : <></>}
           

            <section className={styles.playersSection}>
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
                </div>
            </section>

        </>
    );
}