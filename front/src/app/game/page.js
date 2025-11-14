"use client";
import { useSocket } from "../../hooks/useSocket.js";
import { useGameLogic } from "../../hooks/useGameLogic.js";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Lobby from "@/components/lobby.js";
import Day from "@/components/day.js";
import Modal from "@/components/modal.js";
import Night from "@/components/night.js";
import FindeJuego from "@/components/finDeJuego.js";

export default function Game() {
  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState("");
  const [createdRoom, setCreatedRoom] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lobby, setLobby] = useState(true);
  const [game, setGame] = useState(false);
  const [role, setRole] = useState("");
  const [mayor, setMayor] = useState(null);
  const [hasVotedForMayor, setHasVotedForMayor] = useState(false);
  const socketObj = useSocket();
  const socket = socketObj?.socket;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tieBreakData, setTieBreakData] = useState(null);
  const [isOpenTieBreak, setIsOpenTieBreak] = useState(false);
  const roomCode = searchParams.get("code");
  const isHost = searchParams.get("host") === "true";
  const playersAmount = searchParams.get("PlayersAmount") || 6;
  const usernameFromParams = searchParams.get("username");
  const [hasVotedForLynch, setHasVotedForLynch] = useState(false);
  const [lynchTieBreakData, setLynchTieBreakData] = useState(null);
  const [isOpenLynchTieBreak, setIsOpenLynchTieBreak] = useState(false);
  const [lynchedPlayer, setLynchedPlayer] = useState(null);
  const [isOpenLynchModal, setIsOpenLynchModal] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [nightVictim, setNightVictim] = useState(null);
  const [isOpenNightModal, setIsOpenNightModal] = useState(false);
  const [hasVotedNight, setHasVotedNight] = useState(false);
  const [nightTieBreakData, setNightTieBreakData] = useState(null);
  const [isOpenNightTieBreak, setIsOpenNightTieBreak] = useState(false);
  const [winner, setWinner] = useState([]);
  const [finishGame, setFinishGame] = useState(false);
  const [isOpenSuccessorModal, setIsOpenSuccessorModal] = useState(false);
  const [successorCandidates, setSuccessorCandidates] = useState([]);
  const [deadMayor, setDeadMayor] = useState(null);
  const [successorTimeout, setSuccessorTimeout] = useState(null);
  const [blockOtherModals, setBlockOtherModals] = useState(false);



  useEffect(() => {
    if (!socket) return;

    socket.on("chooseMayorSuccessor", (data) => {
      console.log(" Debes elegir un sucesor como intendente muerto:", data);

      setBlockOtherModals(true);
      setIsOpenLynchModal(false);
      setIsOpenLynchTieBreak(false);
      setIsOpenNightModal(false);
      setIsOpenNightTieBreak(false);
      setIsOpenTieBreak(false);

      setSuccessorCandidates(data.alivePlayers);
      setDeadMayor(data.deadMayor);
      setIsOpenSuccessorModal(true);

      const timeout = setTimeout(() => {
        if (isOpenSuccessorModal) {
          console.log("Timeout alcanzado, eligiendo sucesor automáticamente");
          socket.emit("requestAutoSuccessor", {
            code: roomCode,
            deadMayor: data.deadMayor
          });
          setIsOpenSuccessorModal(false);
          setBlockOtherModals(false);
        }
      }, 30000);

      setSuccessorTimeout(timeout);
    });

    socket.on("mayorSuccessorChosen", (data) => {
      console.log("Nuevo intendente elegido:", data);

      setMayor(data.newMayor);


      setPlayers(prevPlayers =>
        prevPlayers.map(player => ({
          ...player,
          isMayor: player.username === data.newMayor
        }))
      );

      setIsOpenSuccessorModal(false);
      setBlockOtherModals(false);

      if (successorTimeout) {
        clearTimeout(successorTimeout);
        setSuccessorTimeout(null);
      }

      if (data.wasAutomatic) {
        alert(`El intendente ${data.previousMayor} no eligió sucesor. ${data.newMayor} es el nuevo intendente por elección automática.`);
      } else {
        alert(`${data.newMayor} es el nuevo intendente, elegido por ${data.chosenBy}.`);
      }
    });

    return () => {
      if (successorTimeout) {
        clearTimeout(successorTimeout);
      }
    };
  }, [socket, roomCode, isOpenSuccessorModal, successorTimeout]);

  const chooseSuccessor = (successorUsername) => {
    if (socket && roomCode && deadMayor) {
      console.log(`Eligiendo sucesor: ${successorUsername}`);

      socket.emit("chooseSuccessor", {
        code: roomCode,
        successor: successorUsername,
        deadMayor: deadMayor
      });

      setIsOpenSuccessorModal(false);
      setDeadMayor(null);
      setSuccessorCandidates([]);

      if (successorTimeout) {
        clearTimeout(successorTimeout);
        setSuccessorTimeout(null);
      }
    }
  };


  const closeSuccessorModal = () => {
    setIsOpenSuccessorModal(false);
    setDeadMayor(null);
    setSuccessorCandidates([]);

    if (socket && roomCode && deadMayor) {
      socket.emit("requestAutoSuccessor", {
        code: roomCode,
        deadMayor: deadMayor
      });
    }
  };

  // Debug específico para la elección del intendente
  useEffect(() => {
    console.log("🎯 ELECCIÓN DE INTENDENTE - Estado actual:", {
      mayor,
      username,
      soyIntendente: mayor === username,
      playersCount: players.length,
      playersMayors: players.filter(p => p.isMayor).map(p => p.username)
    });
  }, [mayor, username, players]);

  useEffect(() => {
    console.log("🔍 Estados actuales:", {
      mayor,
      username,
      isOpenLynchTieBreak,
      lynchTieBreakData: lynchTieBreakData ? "Presente" : "null",
      soyIntendente: mayor === username
    });
  }, [mayor, username, isOpenLynchTieBreak, lynchTieBreakData]);


  function checkWinner(playersToCheck = players) {
    if (!playersToCheck || playersToCheck.length === 0) {
      console.log(" No hay jugadores para verificar");
      return null;
    }

    const alivePlayers = playersToCheck.filter(p => p.isAlive);
    console.log("Jugadores vivos:", alivePlayers.map(p => ({ username: p.username, role: p.role, isAlive: p.isAlive })));

    const aliveLobizones = alivePlayers.filter(p => p.role === 'Lobizón');
    console.log("lobizones vivos:", aliveLobizones.map(p => p.username));

    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Lobizón');
    console.log("aldeanos vivos:", aliveVillagers.map(p => p.username));

    console.log("  Verificando ganador:", {
      totalJugadores: playersToCheck.length,
      jugadoresVivos: alivePlayers.length,
      lobizonesVivos: aliveLobizones.length,
      aldeanosVivos: aliveVillagers.length,
      lobizones: aliveLobizones.map(p => p.username),
      aldeanos: aliveVillagers.map(p => p.username)
    });

    if (aliveLobizones.length === 0 && aliveVillagers.length > 0) {
      console.log(" ¡Ganan los aldeanos! No quedan lobizones");
      return {
        winner: "Aldeanos",
        message: "¡Los aldeanos han eliminado a todos los lobizones!",
        details: {
          lobizonesRestantes: 0,
          aldeanosRestantes: aliveVillagers.length
        }
      };
    }

    if (aliveLobizones.length >= aliveVillagers.length && aliveLobizones.length > 0) {
      console.log("¡Ganan los lobizones! Superan a los aldeanos");
      return {
        winner: "Lobizones",
        message: "¡Los lobizones han devorado a la aldea!",
        details: {
          lobizonesRestantes: aliveLobizones.length,
          aldeanosRestantes: aliveVillagers.length
        }
      };
    }

    if (alivePlayers.length === 1) {
      const lastPlayer = alivePlayers[0];
      const isLobizon = lastPlayer.role === 'Lobizón';
      console.log(`¡Solo queda 1 jugador! ${lastPlayer.username} (${isLobizon ? 'Lobizón' : 'Aldeano'})`);

      return {
        winner: isLobizon ? "Lobizones" : "Aldeanos",
        message: isLobizon
          ? `¡${lastPlayer.username} como Lobizón ha devorado a la aldea!`
          : `¡${lastPlayer.username} ha sobrevivido como aldeano!`,
        details: {
          jugadorFinal: lastPlayer.username,
          rolFinal: lastPlayer.role
        }
      };
    }

    console.log(" El juego continúa...");
    return null;
  }

  const joinedARoom = useRef(false);


  useEffect(() => {
    const userToUse = usernameFromParams || localStorage.getItem("username") || "Invitado";
    setUsername(userToUse);

    console.log(" Estado del socket:", {
      socketDisponible: !!socket,
      socketId: socket?.id,
      roomCode,
      isHost,
      username: userToUse,
    });

    if (!socket) {
      console.log(" Esperando conexión socket...");
      return;
    }

    if (joinedARoom.current) {
      console.log(" Ya se unió a la sala, evitando duplicado");
      return;
    }

    const setupSocketListeners = () => {
      socket.on("usersInRoom", (playersList) => {
        console.log("Jugadores en sala recibidos:", playersList);
        if (gameStarted && players.length > 0) {
          const playersWithRoles = playersList.map(newPlayer => {
            const existingPlayer = players.find(p => p.username === newPlayer.username);
            return {
              ...newPlayer,
              role: existingPlayer ? existingPlayer.role : newPlayer.role
            };
          });
          setPlayers(playersWithRoles);
        } else {
          setPlayers(playersList);
        }

        setCreatedRoom(true);
      });

      socket.on("roomError", (message) => {
        console.error(" Error de sala recibido:", message);
        setErrorMessage(message);
        alert("Error: " + message);

        const criticalErrors = [
          "La sala no existe",
          "cerró la sala",
          "anfitrión abandonó",
          "anfitrión se desconectó",
          "sala está llena",
          "No existe una sala activa"
        ];

        const isCritical = criticalErrors.some(error => message.includes(error));
        if (isCritical) {
          setTimeout(() => router.push("/"), 3000);
        }
      });

      socket.on("openNightModal", () => {
        console.log(" Abriendo modal de votación nocturna desde backend");
        console.log(" Estado del jugador:", {
          username,
          role,
          isLobizon: role === 'Lobizón',
          isAlive: players.find(p => p.username === username)?.isAlive
        });
        setIsOpenNightModal(true);
      });

      socket.on("gameStarted", (data) => {
        console.log("Juego iniciado recibido:", data);
        setGameStarted(true);
        localStorage.setItem('roomCode', roomCode);
        localStorage.setItem('isHost', isHost.toString());
        setLobby(false);
        setGame(true);

        if (data.players) {
          setPlayers(data.players);

          console.log("roles recibidos:", data.players.map(p => ({
            username: p.username,
            role: p.role
          })));

          const currentPlayer = data.players.find(p => p.username === userToUse);
          if (currentPlayer) {
            setRole(currentPlayer.role);
            alert(`Tu rol es: ${currentPlayer.role}`);
          }
        }
      });

      socket.on("mayorVoteRegistered", (data) => {
        console.log(` ${data.voter} votó por ${data.candidate} como intendente`);
        setHasVotedForMayor(true);
      });

      socket.on("mayorVoteUpdate", (data) => {
        console.log(" Actualización de votos para intendente:", data);
        setPlayers(prevPlayers =>
          prevPlayers.map(player => ({
            ...player,
            mayorVotes: data.votes[player.username] || 0
          }))
        );
      });

      socket.on("mayorElected", (data) => {
        console.log("INTENDENTE ELECTO - Actualizando estado:", data);

        // Actualizar el estado mayor INMEDIATAMENTE
        setMayor(data.mayor);

        // Actualizar players para que isMayor sea correcto
        setPlayers(prevPlayers => {
          const updatedPlayers = prevPlayers.map(player => ({
            ...player,
            isMayor: player.username === data.mayor,
            mayorVotes: 0
          }));

          console.log("🔄 Players actualizados con intendente:",
            updatedPlayers.filter(p => p.isMayor).map(p => p.username)
          );

          return updatedPlayers;
        });

        setIsOpenTieBreak(false);
        setTieBreakData(null);

        setTimeout(() => {
          alert(`¡${data.mayor} ha sido electo como intendente con ${data.votes} votos!`);
        }, 500);

        setTimeout(() => {
          console.log("🌙 Iniciando la primera noche...");
          socket.emit("startNight", { code: roomCode });
        }, 2000);
      });

      socket.on("mayorTieBreak", (data) => {
        console.log("EMPATE - Se requiere desempate del anfitrión:", data);
        if (isHost) {
          setTieBreakData(data);
          setIsOpenTieBreak(true);
          alert("¡Hay un empate! Debes elegir al intendente.");
        }
      });

      socket.on("lynchVoteRegistered", (data) => {
        console.log(` ${data.voter} votó por linchar a ${data.candidate}`);
        setHasVotedForLynch(true);
      });

      socket.on("lynchVoteUpdate", (data) => {
        console.log(" Actualización de votos para linchamiento:", data);
        setPlayers(prevPlayers =>
          prevPlayers.map(player => ({
            ...player,
            lynchVotes: data.votes[player.username] || 0
          }))
        );
      });

      socket.on("lynchTieBreak", (data) => {
        console.log("🔨 EMPATE en linchamiento - Se requiere desempate:", data);

        // VERIFICACIÓN DIRECTA POR SOCKET ID - método más confiable
        const amIMayorBySocket = data.mayorSocketId === socket.id;
        const amIMayorByUsername = data.mayorUsername === username;

        console.log("🔍 VERIFICACIÓN POR SOCKET:", {
          socketIdLocal: socket.id,
          socketIdBackend: data.mayorSocketId,
          coincide: amIMayorBySocket
        });

        console.log("🔍 VERIFICACIÓN POR USERNAME:", {
          usernameLocal: username,
          usernameBackend: data.mayorUsername,
          coincide: amIMayorByUsername
        });

        // FORZAR la actualización del estado mayor si es necesario
        if (data.mayorUsername && mayor !== data.mayorUsername) {
          console.log("🔄 Actualizando estado mayor desde backend:", data.mayorUsername);
          setMayor(data.mayorUsername);
        }

        // USAR cualquiera de las verificaciones
        const amIMayor = amIMayorBySocket || amIMayorByUsername;

        if (amIMayor) {
          console.log("✅ VERIFICADO COMO INTENDENTE - Abriendo modal");

          // Actualizar el estado de players para asegurar que isMayor esté correcto
          setPlayers(prevPlayers =>
            prevPlayers.map(player => ({
              ...player,
              isMayor: player.username === data.mayorUsername
            }))
          );

          setLynchTieBreakData(data);
          setIsOpenLynchTieBreak(true);
          setIsOpenLynchModal(false);

          // Forzar un doble renderizado para asegurar que el modal se abra
          setTimeout(() => {
            setIsOpenLynchTieBreak(true);
          }, 50);

        } else {
          console.log("❌ NO SOY EL INTENDENTE - Cerrando modal");
          console.log("📊 Datos completos:", {
            mayorEstado: mayor,
            username,
            socketId: socket.id,
            dataFromBackend: data
          });
          setIsOpenLynchModal(false);
        }
      });

      socket.on("lynchResult", (data) => {
        console.log(" Resultado del linchamiento:", data);
        setLynchedPlayer(data.lynched);
        setIsOpenLynchTieBreak(false);
        setLynchTieBreakData(null);
        setHasVotedForLynch(false);

        // Actualizar players y verificar ganador con los datos actualizados
        setPlayers(prevPlayers => {
          const updatedPlayers = prevPlayers.map(player => ({
            ...player,
            lynchVotes: 0,
            ...(player.username === data.lynched && { isAlive: false })
          }));
          const winner = checkWinner(updatedPlayers);

          if (winner) {
            setIsNight(false);
            setNightVictim(null);
            setHasVotedNight(false);
            setNightTieBreakData(null);
            setIsOpenNightTieBreak(false);
            setIsOpenNightModal(false);
            console.log("¡Hay un ganador!", winner);
            setWinner(winner);
            setFinishGame(true);
          } else {
            setTimeout(() => {
              setIsOpenLynchModal(false);
              setLynchedPlayer(null);
              console.log("Iniciando noche después del linchamiento...");
              socket.emit("startNight", { code: roomCode });
            }, 3000);
          }

          return updatedPlayers;
        });

        if (data.lynched) {
          alert(`¡${data.lynched} ha sido linchado!`);
        } else {
          alert("No se linchó a nadie.");
        }
      });

      socket.on("alreadyVotedLynch", (data) => {
        alert("Ya has votado para linchamiento");
      });

      socket.on("startLynchVote", () => {
        if (!blockOtherModals && !isOpenSuccessorModal) {
          console.log(" Iniciando votación de linchamiento...");
          setIsOpenLynchModal(true);
        } else {
          console.log("Linchamiento bloqueado - Hay herencia pendiente o modal de sucesor abierto");
        }
      });

      socket.on("alreadyVoted", (data) => {
        alert("Ya has votado por el intendente");
      });

      socket.on("nightStarted", (data) => {
        console.log(" Comienza la noche:", data);
        setIsNight(true);
        setNightVictim(null);
        setHasVotedNight(false);
      });

      socket.on("nightVoteRegistered", (data) => {
        console.log(`  ${data.voter} votó por atacar a ${data.candidate}`);
        setHasVotedNight(true);
      });

      socket.on("nightVoteUpdate", (data) => {
        console.log(" Actualización de votos nocturnos:", data);
        setPlayers(prevPlayers =>
          prevPlayers.map(player => ({
            ...player,
            nightVotes: data.votes[player.username] || 0
          }))
        );
      });

      socket.on("nightTieBreak", (data) => {
        console.log("  EMPATE NOCTURNO - Se requiere revotación:", data);
        setNightTieBreakData(data);
        setIsOpenNightTieBreak(true);
        setIsOpenNightModal(false);
      });

      socket.on("nightTieBreakUpdate", (data) => {
        console.log(" Actualización de votos de desempate nocturno:", data);
      });

      socket.on("nightResult", (data) => {
        console.log(" Resultado de la noche recibido:", data);
        setNightVictim(data.victim);
        setHasVotedNight(false);
        setNightTieBreakData(null);

        setPlayers(prevPlayers => {
          const updatedPlayers = prevPlayers.map(player => ({
            ...player,
            nightVotes: 0,
            lynchVotes: 0,
            // Marcar víctima nocturna como muerta
            ...(player.username === data.victim && { isAlive: false })
          }));

          console.log(" Estado después de noche - Vivos:",
            updatedPlayers.filter(p => p.isAlive).map(p => p.username));

          return updatedPlayers;
        });
      });

      socket.on("alreadyVotedNight", (data) => {
        alert("Ya has votado en la noche");
      });
    };

    setupSocketListeners();

    const timeoutId = setTimeout(() => {
      console.log(" Uniéndose a sala:", roomCode);
      console.log(" Username a usar:", userToUse);

      if (isHost) {
        console.log(" Anfitrión creando sala...");
        socket.emit("crearSala", {
          code: roomCode,
          host: userToUse,
          maxPlayers: parseInt(playersAmount)
        });
      } else {
        console.log(" Jugador uniéndose a sala...");
        socket.emit("joinRoom", {
          code: roomCode,
          username: userToUse
        });
      }
      joinedARoom.current = true;
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [socket, roomCode, isHost, playersAmount, router, usernameFromParams, checkWinner, mayor, username]);

  const startGame = () => {
    if (socket && isHost) {
      console.log(" Emitiendo iniciar juego...");
      socket.emit("startGame", { code: roomCode });
      localStorage.setItem('roomCode', roomCode);
      localStorage.setItem('isHost', 'true');
      setLobby(false);
      setGame(true);
    }
  };

  const closeRoom = () => {
    if (socket && isHost) {
      console.log("Cerrando sala...");
      socket.emit("closeRoom", { code: roomCode });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      console.log("Abandonando sala...");
      socket.emit("leaveRoom", { code: roomCode });
      router.push("/");
    }
  };

  const decideTieBreak = (chosenCandidate) => {
    if (socket && roomCode && tieBreakData) {
      console.log(`👑 Anfitrión decide desempate: ${chosenCandidate}`);
      socket.emit("mayorTieBreakDecision", {
        code: roomCode,
        chosenCandidate: chosenCandidate,
        tieCandidates: tieBreakData.tieCandidates
      });
      setIsOpenTieBreak(false);
      setTieBreakData(null);
    }
  };

  const voteMayor = (candidateUsername) => {
    if (socket && roomCode && !hasVotedForMayor) {
      console.log(`🗳️ ${username} votando por ${candidateUsername} como intendente`);
      socket.emit("voteMayor", {
        code: roomCode,
        voter: username,
        candidate: candidateUsername
      });
      setHasVotedForMayor(true);
    }
  };

  const voteLynch = (candidateUsername) => {
    const currentPlayer = players.find(p => p.username === username);
    if (!currentPlayer) {
      alert("Error: No se encontró tu usuario en el juego");
      return;
    }

    if (!currentPlayer.isAlive) {
      alert("Error: No puedes votar porque estás muerto");
      return;
    }

    const candidatePlayer = players.find(p => p.username === candidateUsername);
    if (!candidatePlayer) {
      alert("Error: El jugador seleccionado no existe");
      return;
    }

    if (!candidatePlayer.isAlive) {
      alert("Error: No puedes votar por un jugador muerto");
      return;
    }

    if (socket && roomCode && !hasVotedForLynch) {
      console.log(`  ${username} votando por linchar a ${candidateUsername}`);
      socket.emit("voteLynch", {
        code: roomCode,
        voter: username,
        candidate: candidateUsername
      });
      setHasVotedForLynch(true);
    }
  };

  const decideLynchTieBreak = (chosenCandidate) => {
    if (socket && roomCode && lynchTieBreakData) {
      console.log(`🔨 Intendente ${username} decide desempate de linchamiento: ${chosenCandidate}`);
      console.log("📤 Enviando lynchTieBreakDecision al backend con:", {
        code: roomCode,
        chosenCandidate: chosenCandidate,
        tieCandidates: lynchTieBreakData.tieCandidates
      });

      socket.emit("lynchTieBreakDecision", {
        code: roomCode,
        chosenCandidate: chosenCandidate,
        tieCandidates: lynchTieBreakData.tieCandidates
      });

      // Cerrar el modal después de enviar
      setIsOpenLynchTieBreak(false);
      setLynchTieBreakData(null);
    } else {
      console.error("❌ Error: Faltan datos para decidir desempate:", {
        socket: !!socket,
        roomCode: !!roomCode,
        lynchTieBreakData: !!lynchTieBreakData
      });
    }
  };


  const closeLynchModal = () => {
    setIsOpenLynchModal(false);
  };

  const voteNightKill = (candidateUsername) => {
    if (socket && roomCode && !hasVotedNight) {
      console.log(` 🐺 ${username} votando por atacar a ${candidateUsername}`);
      socket.emit("voteNightKill", {
        code: roomCode,
        voter: username,
        candidate: candidateUsername
      });
      setHasVotedNight(true);
    }
  };

  const voteNightTieBreak = (candidateUsername) => {
    if (socket && roomCode && nightTieBreakData) {
      console.log(` 🐺 ${username} votando en desempate nocturno por ${candidateUsername}`);
      socket.emit("voteNightTieBreak", {
        code: roomCode,
        voter: username,
        candidate: candidateUsername
      });
      setIsOpenNightTieBreak(false);
      setNightTieBreakData(null);
    }
  };

  function startDay() {
    console.log("startDay ejecutándose - Verificando estado del juego...");

    const winner = checkWinner();

    if (winner) {
      setIsNight(false);
      setNightVictim(null);
      setHasVotedNight(false);
      setNightTieBreakData(null);
      setIsOpenNightTieBreak(false);
      setIsOpenNightModal(false);
      console.log("¡Hay un ganador!", winner);
      setWinner(winner);
      setFinishGame(true);
    } else {
      console.log("El juego continúa - Cambiando a día");

      setIsNight(false);
      setNightVictim(null);
      setHasVotedNight(false);
      setNightTieBreakData(null);
      setIsOpenNightTieBreak(false);
      setIsOpenNightModal(false);

      setTimeout(() => {


        if (blockOtherModals || isOpenSuccessorModal) {
          console.log(" Evitando abrir linchamiento porque hay sucesión en curso");
          return;
        }

        console.log("Abriendo modal de linchamiento desde startDay");
        setIsOpenLynchModal(true);

      }, 500);
    }
  }


 
  const playAgain = () => {
    console.log("Reiniciando juego...");

    if (socket && isHost) {
  
      socket.emit("resetGame", {
        code: roomCode,
        host: username
      });
    } else {
      console.log("Esperando a que el anfitrión reinicie el juego...");
      setFinishGame(false);
      setLobby(true);
      setGame(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("gameReset", (data) => {
      console.log("🔄 Juego reiniciado recibido:", data);

      setPlayers(data.players);
      setGameStarted(false);
      setLobby(true);
      setGame(false);
      setRole("");
      setMayor(null);
      setHasVotedForMayor(false);
      setHasVotedForLynch(false);
      setLynchTieBreakData(null);
      setIsOpenLynchTieBreak(false);
      setLynchedPlayer(null);
      setIsOpenLynchModal(false);
      setIsNight(false);
      setNightVictim(null);
      setIsOpenNightModal(false);
      setHasVotedNight(false);
      setNightTieBreakData(null);
      setIsOpenNightTieBreak(false);
      setWinner([]);
      setFinishGame(false);
      setIsOpenSuccessorModal(false);
      setSuccessorCandidates([]);
      setDeadMayor(null);
      setBlockOtherModals(false);
      if (successorTimeout) {
        clearTimeout(successorTimeout);
        setSuccessorTimeout(null);
      }

      console.log("✅ Estados del juego reseteados completamente");
    });

    return () => {
      socket.off("gameReset");
    };
  }, [socket, successorTimeout]);


  return (
    <>
      {finishGame ? (<FindeJuego winner={winner} players={players} playAgain={playAgain} />) : (
        <>
          {lobby === true ? (
            <Lobby
              players={players}
              username={username}
              createdRoom={createdRoom}
              errorMessage={errorMessage}
              setLobby={setLobby}
              setGame={setGame}
              roomCode={roomCode}
              closeRoom={closeRoom}
              leaveRoom={leaveRoom}
              socketGame={startGame}
              isHost={isHost}
              playersAmount={playersAmount}
            />
          ) : (
            <>
              {isOpenSuccessorModal && (
                <Modal
                  isOpen={isOpenSuccessorModal}
                  onClose={closeSuccessorModal}
                  type={"successor"}
                  successorCandidates={successorCandidates}
                  chooseSuccessor={chooseSuccessor}
                />
              )}

              {isNight ? (
                <Night
                  players={players}
                  username={username}
                  role={role}
                  isNight={isNight}
                  setIsNight={setIsNight}
                  nightVictim={nightVictim}
                  isOpenNightModal={isOpenNightModal}
                  setIsOpenNightModal={setIsOpenNightModal}
                  voteNightKill={voteNightKill}
                  hasVotedNight={hasVotedNight}
                  nightTieBreakData={nightTieBreakData}
                  isOpenNightTieBreak={isOpenNightTieBreak}
                  setIsOpenNightTieBreak={setIsOpenNightTieBreak}
                  voteNightTieBreak={voteNightTieBreak}
                  startDay={startDay}
                />
              ) : (
                <Day
                  role={role}
                  players={players}
                  username={username}
                  setUsername={setUsername}
                  voteMayor={voteMayor}
                  hasVotedForMayor={hasVotedForMayor}
                  mayor={mayor}
                  tieBreakData={tieBreakData}
                  isOpenTieBreak={isOpenTieBreak}
                  decideTieBreak={decideTieBreak}
                  voteLynch={voteLynch}
                  hasVotedForLynch={hasVotedForLynch}
                  lynchTieBreakData={lynchTieBreakData}
                  isOpenLynchTieBreak={isOpenLynchTieBreak}
                  decideLynchTieBreak={decideLynchTieBreak}
                  lynchedPlayer={lynchedPlayer}
                  setLynchedPlayer={setLynchedPlayer}
                  isOpenLynchModal={isOpenLynchModal}
                  setIsOpenLynchModal={setIsOpenLynchModal}
                  closeLynchModal={closeLynchModal}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
}