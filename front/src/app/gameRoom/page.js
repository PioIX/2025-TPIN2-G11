
"use client";
import { useSocket } from "../../hooks/useSocket";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../gameRoom/gameRoom.module.css";


export default function GameRoom() {
    const { socket } = useSocket();
    const router = useRouter();
    const [code, setCode] = useState("");
    const [username, setUsername] = useState("");


    useEffect(() => {
        if (!socket) {
            return
        }
        setCode(localStorage.getItem("roomCode"));
        setUsername(localStorage.getItem("username") || "invitado")

        socket.on("joinGameRoom", (code) => {
            console.log("Juego iniciado recibido:", code);
        },);
    }, [socket])

    return(
        (socket ? <p>esta conectado</p> : <p>no esta conectado</p>)
    );
}

// character: voteLynch
// character: voteMayor
// character: death
// character: consecrate
// chaman: useLifePotion
// chaman: useDeathPotion
// chaman: potionsState
// colectivero: seeNightlyOwls
// colectivero: cleanObservations
// lobizon: comerGente
// jubilado: activateRevenge
// jubilado: selectRandomLobizon
// medium: contactDeath
// medium: votarLinchar
// medium: obtainJointDeathVotes
// pombero: protectConsecrateds
// pombero: registerConsecration
// pombero: selectNightProtected
// tarotista: leerAura
// tarotista: obtainHistory
// viuda negra: votarLincharPostMortem
// viuda negra: death