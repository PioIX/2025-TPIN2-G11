"use client"
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';
import styles from '../gameRoom/gameRoom.module.css';

export default function GameRoom() {
    const { socket } = useSocket();
    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!socket) return;
        socket.on("startGame", (data) => {
            console.log("Redirigiendo a sala de juego:", data);
            localStorage.setItem('roomCode', data.code);
        });

        return () => {
            socket.off("startGame");
        };
    }, [socket]);


    if (loading) {
        return (
            <div className={styles.gameRoom}>
                <div className={styles.loading}>
                    <h2>🔄 Cargando sala...</h2>
                    <p>Conectando con el servidor</p>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className={styles.gameRoom}>
                <div className={styles.error}>
                    <h2>❌ Error</h2>
                    <p>No se pudo cargar la sala</p>
                    <button
                        onClick={() => router.push("/")}
                        className={styles.restartButton}
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    // Definir estados del juego
    const gameStates = {
        INICIO: "inicio",
        NOCHE_LOBIZONES: "noche_lobizones",
        NOCHE_ESPECIALES: "noche_especiales",
        DIA_DEBATE: "dia_debate",
        DIA_VOTACION: "dia_votacion",
        FINALIZADO: "finalizado"
    };

    function assignRoles(room) {
        const availableRoles = [
            'lobizon', 'lobizon', 'lobizon',
            'conurbanense', 'conurbanense', 'conurbanense',
            'palermitano', 'palermitano', 'palermitano'
        ].slice(0, room.players.length);

        availableRoles.sort(() => Math.random() - 0.5);

        const updatedPlayers = room.players.map((player, index) => ({
            ...player,
            role: availableRoles[index],
            isAlive: true,
            votosRecibidos: 0,
            fueProtegido: false
        }));

        console.log("Roles asignados:", updatedPlayers.map(p => ({ username: p.username, role: p.role })));
        return {
            ...room,
            players: updatedPlayers,
            assignedRoles: true
        };
    }

    function winnerVerify(room) {
        const lobizonesAlive = room.players.filter(p =>
            p.role === 'lobizon' && p.isAlive
        );
        const villagersAlive = room.players.filter(p =>
            p.role !== 'lobizon' && p.isAlive
        );

        if (lobizonesAlive.length === 0) {
            return {
                ...room,
                winner: 'aldeanos',
                state: gameStates.FINALIZADO
            };
        } else if (lobizonesAlive.length >= villagersAlive.length) {
            return {
                ...room,
                winner: 'lobizones',
                state: gameStates.FINALIZADO
            };
        }
        return room;
    }

    useEffect(() => {
        if (!socket) return;

        setLoading(true);

        const code = localStorage.getItem('roomCode');
        const username = localStorage.getItem('username');

        console.log(" Uniéndose a GameRoom:", { code, username });

        if (!code) {
            alert("No se encontró código de sala. Redirigiendo...");
            router.push("/");
            return;
        }

        // Solicitar datos de la sala
        socket.emit("joinGameRoom", { code });

        // Escuchar datos de la sala
        socket.on("updatedRoom", (roomData) => {
            console.log("Sala recibida en GameRoom:", roomData);
            setRoom(roomData);
            setplayers(roomData.players);
            setLoading(false);
        });

        // Manejar errores
        socket.on("roomError", (message) => {
            console.error(" Error en GameRoom:", message);
            alert(`Error: ${message}`);
            setLoading(false);
        });

        // Si no llegan datos después de 5 segundos, mostrar error
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn("Timeout cargando sala");
                setLoading(false);
            }
        }, 5000);

        return () => {
            clearTimeout(timeout);
            socket.off("updatedRoom");
            socket.off("roomError");
        };
    }, [socket]);

    // Función para iniciar el juego (solo anfitrión)
    const startGame = () => {
        if (!socket) return;

        const code = localStorage.getItem('roomCode');
        if (!code) {
            alert("No se encontró el código de sala");
            return;
        }

        socket.emit("startGame", { code });
    };

    // Función para votar intendente
    const voteMayor = (candidateSocketId) => {
        if (!socket) return;

        const code = localStorage.getItem('roomCode');
        socket.emit("voteMayor", { code, candidateSocketId });
    };

    // Función para votar víctima (lobizones)
    const voteVictim = (victimSocketId) => {
        if (!socket) return;

        const code = localStorage.getItem('roomCode');
        socket.emit("voteVictim", { code, victimSocketId });
    };

    // Renderizar interfaz según el estado del juego
    const rederInterface = () => {
        if (!room) {
            return <div className={styles.loading}>Cargando sala...</div>;
        }

        switch (room.state) {
            case gameStates.INICIO:
                return (
                    <div className={styles.phase}>
                        <h2> Elección del Intendente</h2>
                        <p>Vota por el intendente:</p>
                        <div className={styles.votingSection}>
                            {players.map(player => (
                                <button
                                    key={player.socketId}
                                    onClick={() => voteMayor(player.socketId)}
                                    className={styles.playerButton}
                                >
                                    👤 {player.username}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case gameStates.NOCHE_LOBIZONES:
                const myPlayer = players.find(p => p.socketId === socket.id);
                return (
                    <div className={styles.phase}>
                        <h2>Noche - Turno de Lobizones</h2>
                        {myPlayer && myPlayer.role === 'lobizon' && myPlayer.isAlive ? (
                            <div className={styles.votingSection}>
                                <p>Selecciona a tu víctima:</p>
                                {players
                                    .filter(p => p.role !== 'lobizon' && p.isAlive)
                                    .map(player => (
                                        <button
                                            key={player.socketId}
                                            onClick={() => voteVictim(player.socketId)}
                                            className={`${styles.playerButton} ${styles.dangerButton}`}
                                        >
                                            {player.username}
                                        </button>
                                    ))
                                }
                            </div>
                        ) : (
                            <p className={styles.waiting}> Esperando a que los lobizones decidan...</p>
                        )}
                    </div>
                );

            case gameStates.NOCHE_ESPECIALES:
                return (
                    <div className={styles.phase}>
                        <h2> Noche - Roles Especiales</h2>
                        <p>Los roles especiales están actuando...</p>
                    </div>
                );

            case gameStates.FINALIZADO:
                return (
                    <div className={styles.phase}>
                        <h2> Juego Terminado</h2>
                        <p className={styles.winnerMessage}>
                            ¡{room.winner === 'aldeanos' ? 'Los aldeanos' : 'Los lobizones'} han ganado!
                        </p>
                        <button onClick={() => window.location.reload()} className={styles.restartButton}>
                            Jugar de nuevo
                        </button>
                    </div>
                );

            default:
                return <div className={styles.phase}>Estado desconocido</div>;
        }
    };

    return (
        <div className={styles.gameRoom}>
            <header className={styles.header}>
                <h1>Bienvenido a Castro Barros</h1>
            </header>

            {/* Información de la sala */}
            {room && (
                <div className={styles.salaInfo}>
                    <p><strong>Estado:</strong> {room.state}</p>
                    {room.mayor && <p><strong>Intendente:</strong> {room.mayor}</p>}
                    {room.ultimaVictima && <p><strong>Última víctima:</strong> {room.ultimaVictima}</p>}
                </div>
            )}

            {/* Contenido principal del juego */}
            <main className={styles.main}>
                {rederInterface()}
            </main>

            {/* Panel de players */}
            <div className={styles.playersPanel}>
                <h3>Jugadores:</h3>
                {players.map(player => (
                    <div
                        key={player.socketId}
                        className={`${styles.player} ${!player.isAlive ? styles.dead : ''}`}
                    >
                        <span className={styles.playerName}>{player.username}</span>
                        <span className={styles.role}>
                            {!player.isAlive ? '💀' :
                                player.role === 'lobizon' ? '🐺' : '👤'}
                        </span>
                        {!player.isAlive && <span className={styles.deadText}>(Muerto)</span>}
                    </div>
                ))}
            </div>

            {/* Botón para iniciar juego (solo visible para anfitrión) */}
            {room && !room.assignedRoles && (
                <div className={styles.startSection}>
                    <button onClick={startGame} className={styles.startButton}>
                        Iniciar Juego
                    </button>
                </div>
            )}
        </div>
    );
}