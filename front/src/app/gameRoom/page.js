"use client"
import { useSocket } from '../../hooks/useSocket';
import { useEffect, useState } from 'react';
import styles from '../gameRoom/gameRoom.module.css';

export default function GameRoom() {
    const { socket } = useSocket();
    const [sala, setSala] = useState(null);
    const [jugadores, setJugadores] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!socket) return;
        socket.on("iniciarJuego", (data) => {
            console.log("Redirigiendo a sala de juego:", data);
            localStorage.setItem('codigoSala', data.codigo);
        });

        return () => {
            socket.off("iniciarJuego");
        };
    }, [socket]);


    if (cargando) {
        return (
            <div className={styles.gameRoom}>
                <div className={styles.loading}>
                    <h2>🔄 Cargando sala...</h2>
                    <p>Conectando con el servidor</p>
                </div>
            </div>
        );
    }

    if (!sala) {
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
    const estadosJuego = {
        INICIO: "inicio",
        NOCHE_LOBIZONES: "noche_lobizones",
        NOCHE_ESPECIALES: "noche_especiales",
        DIA_DEBATE: "dia_debate",
        DIA_VOTACION: "dia_votacion",
        FINALIZADO: "finalizado"
    };

    function asignarRoles(sala) {
        const rolesDisponibles = [
            'lobizon', 'lobizon', 'lobizon',
            'conurbanense', 'conurbanense', 'conurbanense',
            'palermitano', 'palermitano', 'palermitano'
        ].slice(0, sala.jugadores.length);

        rolesDisponibles.sort(() => Math.random() - 0.5);

        const jugadoresActualizados = sala.jugadores.map((jugador, index) => ({
            ...jugador,
            rol: rolesDisponibles[index],
            estaVivo: true,
            votosRecibidos: 0,
            fueProtegido: false
        }));

        console.log("Roles asignados:", jugadoresActualizados.map(j => ({ username: j.username, rol: j.rol })));
        return {
            ...sala,
            jugadores: jugadoresActualizados,
            rolesAsignados: true
        };
    }

    function verificarGanador(sala) {
        const lobizonesVivos = sala.jugadores.filter(j =>
            j.rol === 'lobizon' && j.estaVivo
        );
        const aldeanosVivos = sala.jugadores.filter(j =>
            j.rol !== 'lobizon' && j.estaVivo
        );

        if (lobizonesVivos.length === 0) {
            return {
                ...sala,
                ganador: 'aldeanos',
                estado: estadosJuego.FINALIZADO
            };
        } else if (lobizonesVivos.length >= aldeanosVivos.length) {
            return {
                ...sala,
                ganador: 'lobizones',
                estado: estadosJuego.FINALIZADO
            };
        }
        return sala;
    }

    useEffect(() => {
        if (!socket) return;

        setCargando(true);

        const codigo = localStorage.getItem('codigoSala');
        const username = localStorage.getItem('username');

        console.log(" Uniéndose a GameRoom:", { codigo, username });

        if (!codigo) {
            alert("No se encontró código de sala. Redirigiendo...");
            router.push("/");
            return;
        }

        // Solicitar datos de la sala
        socket.emit("unirseGameRoom", { codigo });

        // Escuchar datos de la sala
        socket.on("salaActualizada", (salaData) => {
            console.log("Sala recibida en GameRoom:", salaData);
            setSala(salaData);
            setJugadores(salaData.jugadores);
            setCargando(false);
        });

        // Manejar errores
        socket.on("errorSala", (mensaje) => {
            console.error(" Error en GameRoom:", mensaje);
            alert(`Error: ${mensaje}`);
            setCargando(false);
        });

        // Si no llegan datos después de 5 segundos, mostrar error
        const timeout = setTimeout(() => {
            if (cargando) {
                console.warn("Timeout cargando sala");
                setCargando(false);
            }
        }, 5000);

        return () => {
            clearTimeout(timeout);
            socket.off("salaActualizada");
            socket.off("errorSala");
        };
    }, [socket]);

    // Función para iniciar el juego (solo anfitrión)
    const iniciarJuego = () => {
        if (!socket) return;

        const codigo = localStorage.getItem('codigoSala');
        if (!codigo) {
            alert("No se encontró el código de sala");
            return;
        }

        socket.emit("iniciarJuego", { codigo });
    };

    // Función para votar intendente
    const votarIntendente = (candidatoSocketId) => {
        if (!socket) return;

        const codigo = localStorage.getItem('codigoSala');
        socket.emit("votarIntendente", { codigo, candidatoSocketId });
    };

    // Función para votar víctima (lobizones)
    const votarVictima = (victimaSocketId) => {
        if (!socket) return;

        const codigo = localStorage.getItem('codigoSala');
        socket.emit("votarVictima", { codigo, victimaSocketId });
    };

    // Renderizar interfaz según el estado del juego
    const renderizarInterfaz = () => {
        if (!sala) {
            return <div className={styles.loading}>Cargando sala...</div>;
        }

        switch (sala.estado) {
            case estadosJuego.INICIO:
                return (
                    <div className={styles.phase}>
                        <h2> Elección del Intendente</h2>
                        <p>Vota por el intendente:</p>
                        <div className={styles.votingSection}>
                            {jugadores.map(jugador => (
                                <button
                                    key={jugador.socketId}
                                    onClick={() => votarIntendente(jugador.socketId)}
                                    className={styles.playerButton}
                                >
                                    👤 {jugador.username}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case estadosJuego.NOCHE_LOBIZONES:
                const miJugador = jugadores.find(j => j.socketId === socket.id);
                return (
                    <div className={styles.phase}>
                        <h2>Noche - Turno de Lobizones</h2>
                        {miJugador && miJugador.rol === 'lobizon' && miJugador.estaVivo ? (
                            <div className={styles.votingSection}>
                                <p>Selecciona a tu víctima:</p>
                                {jugadores
                                    .filter(j => j.rol !== 'lobizon' && j.estaVivo)
                                    .map(jugador => (
                                        <button
                                            key={jugador.socketId}
                                            onClick={() => votarVictima(jugador.socketId)}
                                            className={`${styles.playerButton} ${styles.dangerButton}`}
                                        >
                                            {jugador.username}
                                        </button>
                                    ))
                                }
                            </div>
                        ) : (
                            <p className={styles.waiting}> Esperando a que los lobizones decidan...</p>
                        )}
                    </div>
                );

            case estadosJuego.NOCHE_ESPECIALES:
                return (
                    <div className={styles.phase}>
                        <h2> Noche - Roles Especiales</h2>
                        <p>Los roles especiales están actuando...</p>
                    </div>
                );

            case estadosJuego.FINALIZADO:
                return (
                    <div className={styles.phase}>
                        <h2> Juego Terminado</h2>
                        <p className={styles.winnerMessage}>
                            ¡{sala.ganador === 'aldeanos' ? 'Los aldeanos' : 'Los lobizones'} han ganado!
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
            {sala && (
                <div className={styles.salaInfo}>
                    <p><strong>Estado:</strong> {sala.estado}</p>
                    {sala.intendente && <p><strong>Intendente:</strong> {sala.intendente}</p>}
                    {sala.ultimaVictima && <p><strong>Última víctima:</strong> {sala.ultimaVictima}</p>}
                </div>
            )}

            {/* Contenido principal del juego */}
            <main className={styles.main}>
                {renderizarInterfaz()}
            </main>

            {/* Panel de jugadores */}
            <div className={styles.playersPanel}>
                <h3>Jugadores:</h3>
                {jugadores.map(jugador => (
                    <div
                        key={jugador.socketId}
                        className={`${styles.player} ${!jugador.estaVivo ? styles.dead : ''}`}
                    >
                        <span className={styles.playerName}>{jugador.username}</span>
                        <span className={styles.role}>
                            {!jugador.estaVivo ? '💀' :
                                jugador.rol === 'lobizon' ? '🐺' : '👤'}
                        </span>
                        {!jugador.estaVivo && <span className={styles.deadText}>(Muerto)</span>}
                    </div>
                ))}
            </div>

            {/* Botón para iniciar juego (solo visible para anfitrión) */}
            {sala && !sala.rolesAsignados && (
                <div className={styles.startSection}>
                    <button onClick={iniciarJuego} className={styles.startButton}>
                        Iniciar Juego
                    </button>
                </div>
            )}
        </div>
    );
}