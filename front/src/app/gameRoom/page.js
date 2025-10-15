"use client"
import styles from "./GameRoom.module.css";
import { useState } from "react";

export default function GameRoom() {
    const [gameStart, setGameStart] = useState(false);
    const [user, setUser] = useState([]);



    return (
        <>
            {gameStart == false ?
                <>
                    <p>espere hasta que todos se hayan unido o el anfitrión inicie la partida</p>
                    <ul className={styles.user}>
                        {user.length > 0 ? (
                            ranking.map((user, i) => (
                                <li key={i}>
                                    {user.username}
                                </li>
                            ))
                        ) : (
                            <p>No hay jugadores aún...</p>
                        )}
                    </ul>

                </>
                :
                <>

                </>
            }
        </>
    );
}