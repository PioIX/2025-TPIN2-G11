"use client";
import { useSocket } from "../../hooks/useSocket.js";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button.js";
import Lobby from "@/components/lobby.js";
import Day from "@/components/day.js";
import Modal from "@/components/modal.js";
import Night from "@/components/night.js";

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
      usernameFromParams: usernameFromParams
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
        setPlayers(playersList);
        setCreatedRoom(true);
      });

      socket.on("roomError", (message) => {
        console.error(" Error de sala recibido:", message);
        setErrorMessage(message);

        // SOLO redirigir para errores realmente críticos
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
          console.log(" Error crítico - redirigiendo a home");
          alert("Error: " + message);
          setTimeout(() => router.push("/"), 3000);
        } else {
          // Para errores de juego normales, solo mostrar alerta
          console.log(" Error no crítico - mostrando alerta:", message);
          alert("Error: " + message);
          // NO redirigir
        }
      });

      // AGREGAR manejo específico para errores de votación
      socket.on("voteError", (message) => {
        console.log(" Error de votación:", message);
        alert("Votación: " + message);
        // Nunca redirigir por errores de votación
      });

      socket.on("gameStarted", (data) => {
        console.log("Juego iniciado recibido:", data);
        setGameStarted(true);
        localStorage.setItem('roomCode', roomCode);
        localStorage.setItem('isHost', isHost.toString());
        setLobby(false);
        setGame(true);

        if (data.players) {
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

        Object.entries(data.votes).forEach(([candidate, votes]) => {
          if (votes > 0) {
            console.log(` ${candidate} tiene ${votes} voto(s)`);
          }
        });
      });

      socket.on("mayorElected", (data) => {
        console.log(" Intendente electo:", data);
        setMayor(data.mayor);
        setPlayers(prevPlayers =>
          prevPlayers.map(player => ({
            ...player,
            isMayor: player.username === data.mayor
          }))
        );

        setIsOpenTieBreak(false);
        setTieBreakData(null);
        setTimeout(() => {
          console.log(" Iniciando la primera noche...");
          socket.emit("startNight", { code: roomCode });
        }, 2000);

        setTimeout(() => {
          alert(`¡${data.mayor} ha sido electo como intendente con ${data.votes} votos!`);
        }, 500);
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
        console.log(" EMPATE en linchamiento - Se requiere desempate del intendente:", data);
        if (mayor === username) {
          setLynchTieBreakData(data);
          setIsOpenLynchTieBreak(true);
          alert("¡Hay un empate en el linchamiento! Debes elegir a quién linchar.");
        }
      });

      // En el useEffect de sockets, modificar el evento "lynchResult"
      socket.on("lynchResult", (data) => {
        console.log(" 🔨 Resultado del linchamiento:", data);
        setLynchedPlayer(data.lynched);
        setIsOpenLynchTieBreak(false);
        setLynchTieBreakData(null);
        setHasVotedForLynch(false);

        setPlayers(prevPlayers =>
          prevPlayers.map(player => ({
            ...player,
            lynchVotes: 0
          }))
        );

        if (data.lynched) {
          alert(`¡${data.lynched} ha sido linchado!`);

          // NUEVO: Esperar y luego iniciar la noche automáticamente
          setTimeout(() => {
            setIsOpenLynchModal(false);
            setLynchedPlayer(null);

            console.log(" Linchamiento completado - Iniciando noche...");
            if (socket && roomCode) {
              socket.emit("startNight", { code: roomCode });
            }
          }, 3000);
        } else {
          alert("No se linchó a nadie.");

          setTimeout(() => {
            setIsOpenLynchModal(false);
            console.log("Sin linchamiento - Iniciando noche...");
            if (socket && roomCode) {
              socket.emit("startNight", { code: roomCode });
            }
          }, 3000);
        }
      });

      socket.on("alreadyVotedLynch", (data) => {
        console.log(" Ya habías votado para linchamiento:", data);
        alert("Ya has votado para linchamiento");
      });

      socket.on("startLynchVote", () => {
        console.log(" Iniciando votación de linchamiento...");
        setIsOpenLynchModal(true);
      });

      socket.on("alreadyVoted", (data) => {
        console.log(" Ya habías votado:", data);
        alert("Ya has votado por el intendente");
      });

      socket.onAny((eventName, ...args) => {
        console.log(" Evento socket recibido:", eventName, args);
      });

      socket.on("nightStarted", (data) => {
        console.log(" Comienza la noche:", data);
        setIsNight(true);
        setNightVictim(null);
        setHasVotedNight(false);
      });

      socket.on("openNightModal", () => {
        console.log(" Abriendo modal de votación nocturna desde backend");
        setIsOpenNightModal(true);
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
        console.log(" 🐺 EMPATE NOCTURNO - Se requiere revotación:", data);
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
          const updatedPlayers = prevPlayers.map(player => {
            const updatedPlayer = {
              ...player,
              nightVotes: 0,
              lynchVotes: 0
            };

            if (player.username === data.victim) {
              console.log(` Marcando como muerto a: ${player.username}`);
              updatedPlayer.isAlive = false;
            }

            return updatedPlayer;
          });

          console.log(" Estado después de noche - Vivos:",
            updatedPlayers.filter(p => p.isAlive).map(p => p.username));
          console.log(" Estado después de noche - Muertos:",
            updatedPlayers.filter(p => !p.isAlive).map(p => p.username));

          return updatedPlayers;
        });

      });

      socket.on("alreadyVotedNight", (data) => {
        console.log(" Ya habías votado en la noche:", data);
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
          anfitrion: userToUse,
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


  }, [socket, roomCode, isHost, playersAmount, router, usernameFromParams]); // Agregar usernameFromParams a las dependencias

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

  useEffect(() => {
    console.log("Estado actual:", {
      lobby,
      game,
      gameStarted,
      playersCount: players.length
    });
  }, [lobby, game, gameStarted, players]);

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

    console.log("  Intentando votar por:", candidateUsername);
    console.log(" Estado actual del jugador:", {
      username,
      isAlive: players.find(p => p.username === username)?.isAlive,
      hasVoted: hasVotedForLynch
    });

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
    } else {
      console.log("  Condiciones no cumplidas para votar:", {
        socket: !!socket,
        roomCode: !!roomCode,
        hasVoted: hasVotedForLynch
      });
    }
  };

  const decideLynchTieBreak = (chosenCandidate) => {
    if (socket && roomCode && lynchTieBreakData) {
      console.log(` Intendente decide desempate de linchamiento: ${chosenCandidate}`);
      socket.emit("lynchTieBreakDecision", {
        code: roomCode,
        chosenCandidate: chosenCandidate,
        tieCandidates: lynchTieBreakData.tieCandidates
      });
      setIsOpenLynchTieBreak(false);
      setLynchTieBreakData(null);
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

  const startDay = () => {
    console.log(" 🌅 startDay ejecutándose - Cambiando a día");

    setIsNight(false);

    setNightVictim(null);
    setHasVotedNight(false);
    setNightTieBreakData(null);
    setIsOpenNightTieBreak(false);
    setIsOpenNightModal(false);

    setTimeout(() => {
      console.log(" Abriendo modal de linchamiento desde startDay");
      setIsOpenLynchModal(true);
    }, 500);
  };

  const assignRandomRoles = (players) => {

    const playersArray = [...players];
    let currentIndex = playersArray.length;

    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [playersArray[currentIndex], playersArray[randomIndex]] = [
        playersArray[randomIndex],
        playersArray[currentIndex],
      ];
    }

    // Definir los roles base según la cantidad de jugadores
    const getRolesForPlayerCount = (count) => {
      const baseRoles = {
        6: ["Palermitano", "Conurbanense", "Conurbanense", "Medium", "Tarotista", "Lobizón"],
        7: ["Palermitano", "Conurbanense", "Conurbanense", "Medium", "Tarotista", "Lobizón", "Lobizón"],
        8: ["Palermitano", "Conurbanense", "Conurbanense", "Medium", "Tarotista", "Lobizón", "Lobizón", "Viuda negra"],
        // Puedes agregar más configuraciones para diferentes cantidades de jugadores
      };

      return baseRoles[count] || baseRoles[6]; // Default a 6 jugadores
    };

    const roles = getRolesForPlayerCount(players.length);
    const randomPool = ["Pombero", "Jubilado", "Chamán"];

    // Si hay más de 13 jugadores, agregar Colectivero al pool random
    if (players.length > 13) {
      randomPool.push("Colectivero");
    }

    const usedRandomRoles = [];

    // Asignar roles a los jugadores mezclados
    const playersWithRoles = playersArray.map((player, i) => {
      let role = roles[i] || "Palermitano"; // Rol por defecto si no hay suficiente

      // Manejar roles random
      if (role === "Random1" || role === "Random2") {
        if (randomPool.length === 0) {
          // Si no hay roles en el pool, asignar uno por defecto
          role = "Palermitano";
        } else {
          // Seleccionar rol aleatorio del pool
          const randomIndex = Math.floor(Math.random() * randomPool.length);
          role = randomPool[randomIndex];
          usedRandomRoles.push(role);
          randomPool.splice(randomIndex, 1);
        }
      }

      return {
        ...player,
        role: role.toLowerCase(), // Convertir a minúsculas para consistencia
        isAlive: true,
        votesReceived: 0,
        wasProtected: false
      };
    });

    console.log("Roles asignados con sistema random:", playersWithRoles.map(p => ({
      username: p.username,
      role: p.role
    })));

    return playersWithRoles;
  };

  // Función assignRoles modificada para frontend
  const assignRoles = (players) => {
    const updatedPlayers = assignRandomRoles(players);

    console.log("Roles asignados:", updatedPlayers.map(p => ({
      username: p.username,
      role: p.role
    })));

    return updatedPlayers;
  };

  return (
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
        />
      ) : (
        <>
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
              isOpenLynchModal={isOpenLynchModal}
              setIsOpenLynchModal={setIsOpenLynchModal}
              closeLynchModal={closeLynchModal}
            />
          )}
        </>
      )}
    </>
  );
}