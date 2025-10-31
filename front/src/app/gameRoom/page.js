
"use client";
import { useSocket } from "../../hooks/useSocket";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./gameRoom.module.css";

export default function GameRoom() {
    const { socket, isConnected } = useSocket();
    const router = useRouter();

    const [gameState, setGameState] = useState(null);
    const [playerRole, setPlayerRole] = useState(null);
    const [currentPhase, setCurrentPhase] = useState("assignment");
    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [gameLog, setGameLog] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [chatMessage, setChatMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("initializing");
    const [roomCode, setRoomCode] = useState("");
    const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
    const [joinAttempts, setJoinAttempts] = useState(0);

    // Effect para cargar datos del localStorage solo en el cliente
    useEffect(() => {
        const storedRoomCode = localStorage.getItem('roomCode');
        const storedIsHost = localStorage.getItem('isHost');

        console.log("Loaded from localStorage:", {
            roomCode: storedRoomCode,
            isHost: storedIsHost
        });

        if (storedRoomCode) {
            setRoomCode(storedRoomCode);
            setConnectionStatus("room_code_loaded");
        } else {
            console.log("No roomCode found, redirecting to home");
            router.push("/");
        }
    }, [router]);

    // Effect principal que maneja la conexión y unión a la sala
    useEffect(() => {
        console.log("Connection status update:", {
            socketAvailable: !!socket,
            isConnected: isConnected,
            roomCode: roomCode,
            hasJoinedRoom: hasJoinedRoom,
            joinAttempts: joinAttempts
        });

        if (!socket) {
            console.log("Waiting for socket initialization...");
            setConnectionStatus("waiting_for_socket");
            return;
        }

        if (!roomCode) {
            console.log("Waiting for room code...");
            setConnectionStatus("waiting_for_room_code");
            return;
        }

        if (!isConnected) {
            console.log("Socket not connected yet...");
            setConnectionStatus("socket_connecting");
            return;
        }

        console.log("All conditions met, setting up listeners...");
        setConnectionStatus("setting_up_listeners");

        // Configurar listeners
        const setupListeners = () => {
            // Listen for game state updates
            socket.on("gameStateUpdate", (state) => {
                console.log("✅ Game state updated:", state);
                setGameState(state);
                setCurrentPhase(state.phase);
                setPlayers(state.players);
                setConnectionStatus("game_loaded");

                // Find current player's role
                const currentPlayer = state.players.find(p => p.socketId === socket.id);
                if (currentPlayer) {
                    setPlayerRole(currentPlayer.role);
                }
            });

            // Receive assigned role
            socket.on("roleAssigned", (roleData) => {
                console.log("✅ Role assigned:", roleData);
                setPlayerRole(roleData);
                setShowRoleModal(true);
                addToGameLog(`You have been assigned the role: ${roleData.nombre}`);
            });

            // Listen to game logs
            socket.on("gameLog", (log) => {
                console.log("✅ Game log received:", log);
                setGameLog(prev => [...prev, log]);
            });

            // Listen to chat messages
            socket.on("chatMessage", (message) => {
                console.log("✅ Chat message received:", message);
                setChatMessages(prev => [...prev, message]);
            });

            // Listen to game over
            socket.on("gameOver", (result) => {
                console.log("✅ Game over received:", result);
                alert(`Game over! Winners: ${result.winners}`);
                setTimeout(() => router.push("/"), 5000);
            });

            // Listen to room join confirmation
            socket.on("roomJoined", (data) => {
                console.log("✅ Room joined confirmation:", data);
                setConnectionStatus("room_joined_waiting_for_game");
            });

            // Handle connection errors
            socket.on("connect_error", (error) => {
                console.error("❌ Socket connection error:", error);
                setConnectionStatus("connection_error");
            });

            socket.on("disconnect", (reason) => {
                console.log("❌ Socket disconnected:", reason);
                setConnectionStatus("disconnected");
            });

            socket.on("error", (error) => {
                console.error("❌ Socket error:", error);
                setConnectionStatus("socket_error");
            });
        };

        // Clean up previous listeners
        if (socket) {
            socket.off("gameStateUpdate");
            socket.off("roleAssigned");
            socket.off("gameLog");
            socket.off("chatMessage");
            socket.off("gameOver");
            socket.off("roomJoined");
            socket.off("connect_error");
            socket.off("disconnect");
            socket.off("error");
        }

        setupListeners();

        // Unirse a la sala si aún no lo hemos hecho
        if (!hasJoinedRoom || joinAttempts === 0) {
            console.log("🎯 Emitting joinGameRoom event for room:", roomCode);
            const username = localStorage.getItem('username') || "Player";
            const isHost = localStorage.getItem('isHost') === 'true';

            socket.emit("joinGameRoom", {
                roomCode: roomCode,
                isHost: isHost,
                username: username,
                socketId: socket.id
            });

            setHasJoinedRoom(true);
            setJoinAttempts(prev => prev + 1);
            setConnectionStatus("join_emitted");
        }

        // Timeout para reintentar si no recibimos gameState
        const timeoutId = setTimeout(() => {
            if (!gameState && connectionStatus !== "game_loaded") {
                console.log("⏰ Timeout - no gameState received, retrying join...");
                setHasJoinedRoom(false);
            }
        }, 10000);

        return () => {
            clearTimeout(timeoutId);
            if (socket) {
                socket.off("gameStateUpdate");
                socket.off("roleAssigned");
                socket.off("gameLog");
                socket.off("chatMessage");
                socket.off("gameOver");
                socket.off("roomJoined");
                socket.off("connect_error");
                socket.off("disconnect");
                socket.off("error");
            }
        };
    }, [socket, isConnected, roomCode, hasJoinedRoom, joinAttempts, router, gameState, connectionStatus]);

    // useEffect para reintentar la conexión periódicamente
    useEffect(() => {
        if (connectionStatus === "join_emitted" && !gameState) {
            const retryInterval = setInterval(() => {
                if (socket && isConnected && roomCode && !gameState) {
                    console.log("🔄 Retrying to get game state...");
                    socket.emit("getGameState", { roomCode });
                }
            }, 5000);

            return () => clearInterval(retryInterval);
        }
    }, [connectionStatus, gameState, socket, isConnected, roomCode]);

    const addToGameLog = (message) => {
        setGameLog(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            message: message
        }]);
    };

    const sendChatMessage = () => {
        if (!chatMessage.trim() || !socket) return;

        socket.emit("sendChatMessage", {
            roomCode: roomCode,
            message: chatMessage,
            playerId: socket.id
        });
        setChatMessage("");
    };

    const castVote = (type, targetId) => {
        if (!socket) return;

        socket.emit("castVote", {
            roomCode: roomCode,
            playerId: socket.id,
            voteType: type,
            targetId: targetId
        });
    };

    const useSpecialAbility = (ability, targetId) => {
        if (!socket) return;

        socket.emit("useAbility", {
            roomCode: roomCode,
            playerId: socket.id,
            ability: ability,
            targetId: targetId
        });
        setShowAbilityModal(false);
    };

    const handlePhaseAction = () => {
        switch (currentPhase) {
            case "night_werewolves":
                if (playerRole?.esLobizon && selectedPlayer) {
                    useSpecialAbility("eatPerson", selectedPlayer);
                }
                break;
            case "night_specials":
                if (selectedPlayer) {
                    if (playerRole?.nombre === "Tarotista") {
                        useSpecialAbility("readAura", selectedPlayer);
                    } else if (playerRole?.nombre === "Chamán") {
                        // For Shaman, we'll show the ability modal
                    } else if (playerRole?.nombre === "Pombero") {
                        useSpecialAbility("protect", selectedPlayer);
                    }
                }
                break;
            case "lynch_vote":
                if (selectedPlayer) {
                    castVote("lynching", selectedPlayer);
                }
                break;
            default:
                break;
        }
        setSelectedPlayer(null);
    };

    const renderPhaseDescription = () => {
        const phases = {
            "assignment": "Role Assignment",
            "night_werewolves": "Night - Werewolves choose victim",
            "night_specials": "Night - Special roles act",
            "day_debate": "Day - Public debate",
            "lynch_vote": "Lynch voting",
            "mayor_vote": "Mayor election"
        };
        return phases[currentPhase] || currentPhase;
    };

    const renderPlayerList = () => {
        return players.map(player => (
            <div
                key={player.id}
                className={`${styles.playerCard} ${!player.estaVivo ? styles.deadPlayer : ""
                    } ${selectedPlayer === player.id ? styles.selectedPlayer : ""
                    }`}
                onClick={() => player.estaVivo && setSelectedPlayer(player.id)}
            >
                <div className={styles.playerAvatar}>
                    {!player.estaVivo ? "💀" : "👤"}
                </div>
                <div className={styles.playerInfo}>
                    <span className={styles.playerName}>
                        {player.username}
                        {player.socketId === socket?.id && " (You)"}
                    </span>
                    {!player.estaVivo && (
                        <span className={styles.deadBadge}>Dead</span>
                    )}
                    {player.role?.nombre && player.estaVivo === false && (
                        <span className={styles.roleReveal}>
                            Was: {player.role.nombre}
                        </span>
                    )}
                </div>
            </div>
        ));
    };

    const renderActionPanel = () => {
        if (!playerRole) return null;

        switch (currentPhase) {
            case "night_werewolves":
                if (playerRole.esLobizon) {
                    return (
                        <div className={styles.actionPanel}>
                            <h3>Choose your victim</h3>
                            <p>Select a player to attack tonight</p>
                            <button
                                onClick={handlePhaseAction}
                                disabled={!selectedPlayer}
                                className={styles.actionButton}
                            >
                                Attack {players.find(p => p.id === selectedPlayer)?.username || "..."}
                            </button>
                        </div>
                    );
                }
                break;

            case "night_specials":
                if (playerRole.nombre === "Tarotista") {
                    return (
                        <div className={styles.actionPanel}>
                            <h3>Read Aura</h3>
                            <p>Select a player to investigate</p>
                            <button
                                onClick={handlePhaseAction}
                                disabled={!selectedPlayer}
                                className={styles.actionButton}
                            >
                                Investigate {players.find(p => p.id === selectedPlayer)?.username || "..."}
                            </button>
                        </div>
                    );
                } else if (playerRole.nombre === "Chamán") {
                    return (
                        <div className={styles.actionPanel}>
                            <h3>Use Potion</h3>
                            <p>You have life and death potions available</p>
                            <button
                                onClick={() => setShowAbilityModal(true)}
                                className={styles.actionButton}
                            >
                                Use Potion
                            </button>
                        </div>
                    );
                } else if (playerRole.nombre === "Pombero") {
                    return (
                        <div className={styles.actionPanel}>
                            <h3>Protect Devotee</h3>
                            <p>Choose a devotee to protect</p>
                            <button
                                onClick={handlePhaseAction}
                                disabled={!selectedPlayer}
                                className={styles.actionButton}
                            >
                                Protect {players.find(p => p.id === selectedPlayer)?.username || "..."}
                            </button>
                        </div>
                    );
                }
                break;

            case "lynch_vote":
                return (
                    <div className={styles.actionPanel}>
                        <h3>Vote for Lynch</h3>
                        <p>Select who you want to lynch</p>
                        <button
                            onClick={handlePhaseAction}
                            disabled={!selectedPlayer}
                            className={styles.actionButton}
                        >
                            Vote for {players.find(p => p.id === selectedPlayer)?.username || "..."}
                        </button>
                    </div>
                );

            default:
                return (
                    <div className={styles.actionPanel}>
                        <h3>Waiting...</h3>
                        <p>Wait for this phase to end</p>
                    </div>
                );
        }

        return (
            <div className={styles.actionPanel}>
                <h3>Observing</h3>
                <p>No actions available in this phase</p>
            </div>
        );
    };

    const retryConnection = () => {
        console.log("🔄 Manual retry connection");
        setHasJoinedRoom(false);
        setJoinAttempts(0);
        setGameState(null);
        setConnectionStatus("retrying");
    };

    if (!gameState) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <h2>Loading game...</h2>
                    <p>Preparing Lobizones de Castro Barros game</p>
                    <div className={styles.connectionStatus}>
                        <p><strong>Status:</strong> {connectionStatus}</p>
                        <p><strong>Socket:</strong> {socket ? (isConnected ? "✅ Connected" : "🔄 Connecting...") : "❌ Not available"}</p>
                        <p><strong>Socket ID:</strong> {socket?.id || "No ID"}</p>
                        <p><strong>Room Code:</strong> {roomCode || "Not loaded"}</p>
                        <p><strong>Has Joined Room:</strong> {hasJoinedRoom ? "✅ Yes" : "❌ No"}</p>
                        <p><strong>Join Attempts:</strong> {joinAttempts}</p>
                        <p><strong>Game State Received:</strong> {gameState ? "✅ Yes" : "❌ No"}</p>
                    </div>

                    {(connectionStatus === "connection_error" || connectionStatus === "disconnected" || connectionStatus === "socket_error") && (
                        <div className={styles.retrySection}>
                            <p>Connection issues detected. Please try again.</p>
                            <button
                                onClick={retryConnection}
                                className={styles.retryButton}
                            >
                                Retry Connection
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className={styles.retryButton}
                            >
                                Reload Page
                            </button>
                        </div>
                    )}

                    {connectionStatus === "join_emitted" && (
                        <div className={styles.waitingSection}>
                            <p>✅ Connected to room. Waiting for game to start...</p>
                            <p>If the game doesn't start soon, ask the host to check if all players have joined.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.gameInfo}>
                    <h1>Lobizones de Castro Barros</h1>
                    <div className={styles.phaseIndicator}>
                        <span className={styles.phaseBadge}>
                            {renderPhaseDescription()}
                        </span>
                    </div>
                </div>
                <div className={styles.playerRole}>
                    {playerRole && (
                        <>
                            <span>Your role: <strong>{playerRole.nombre}</strong></span>
                            <span>Objective: {playerRole.objetivo}</span>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                {/* Players Panel */}
                <section className={styles.playersSection}>
                    <h2>Players ({players.filter(p => p.estaVivo).length} alive)</h2>
                    <div className={styles.playersGrid}>
                        {renderPlayerList()}
                    </div>
                </section>

                {/* Center Panel - Actions and Chat */}
                <section className={styles.centerPanel}>
                    {/* Actions Panel */}
                    <div className={styles.actionsSection}>
                        {renderActionPanel()}
                    </div>

                    {/* Game Chat */}
                    <div className={styles.chatSection}>
                        <h3>Game Chat</h3>
                        <div className={styles.chatMessages}>
                            {chatMessages.map((msg, index) => (
                                <div key={index} className={styles.chatMessage}>
                                    <strong>{msg.player}:</strong> {msg.message}
                                </div>
                            ))}
                        </div>
                        <div className={styles.chatInput}>
                            <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Type your message..."
                                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                            />
                            <button onClick={sendChatMessage}>Send</button>
                        </div>
                    </div>
                </section>

                {/* Game Log */}
                <section className={styles.logSection}>
                    <h3>Game History</h3>
                    <div className={styles.gameLog}>
                        {gameLog.map((log, index) => (
                            <div key={index} className={styles.logEntry}>
                                <span className={styles.logTime}>[{log.timestamp}]</span>
                                <span>{log.message}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Role Modal */}
            {showRoleModal && playerRole && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Your Role has been Assigned!</h2>
                        <div className={styles.roleReveal}>
                            <h3>{playerRole.nombre}</h3>
                            <p>{playerRole.objetivo}</p>
                        </div>
                        <button
                            onClick={() => setShowRoleModal(false)}
                            className={styles.modalButton}
                        >
                            Start Game
                        </button>
                    </div>
                </div>
            )}

            {/* Shaman Abilities Modal */}
            {showAbilityModal && playerRole?.nombre === "Chamán" && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Use Shaman Potion</h2>
                        <div className={styles.abilityOptions}>
                            <button
                                onClick={() => useSpecialAbility("lifePotion", selectedPlayer)}
                                className={styles.abilityButton}
                                disabled={playerRole.pocionVidaUsada}
                            >
                                Life Potion {playerRole.pocionVidaUsada && "(Used)"}
                            </button>
                            <button
                                onClick={() => useSpecialAbility("deathPotion", selectedPlayer)}
                                className={styles.abilityButton}
                                disabled={playerRole.pocionMuerteUsada}
                            >
                                Death Potion {playerRole.pocionMuerteUsada && "(Used)"}
                            </button>
                        </div>
                        <button
                            onClick={() => setShowAbilityModal(false)}
                            className={styles.modalButtonSecondary}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
