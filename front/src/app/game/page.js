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

  function checkWinner() {
    if (!players || players.length === 0) {
      console.log(" No hay jugadores para verificar");
      return null;
    }

    const alivePlayers = players.filter(p => p.isAlive);
    console.log("Jugadores vivos:", alivePlayers.map(p => ({ username: p.username, role: p.role, isAlive: p.isAlive })));

    const aliveLobizones = alivePlayers.filter(p => p.role === 'Lobizón');
    console.log("lobizones vivos:", aliveLobizones.map(p => p.username));

    const aliveVillagers = alivePlayers.filter(p => p.role !== 'Lobizón');
    console.log("aldeanos vivos:", aliveVillagers.map(p => p.username));

    console.log("  Verificando ganador:", {
      totalJugadores: players.length,
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
        console.log(" Intendente electo:", data);
        setMayor(data.mayor);
        setPlayers(prevPlayers =>
          prevPlayers.map(player => ({
            ...player,
            isMayor: player.username === data.mayor,
            mayorVotes: 0
          }))
        );

        setIsOpenTieBreak(false);
        setTieBreakData(null);

        setTimeout(() => {
          alert(`¡${data.mayor} ha sido electo como intendente con ${data.votes} votos!`);
        }, 500);

        setTimeout(() => {
          console.log(" Iniciando la primera noche...");
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
        console.log(" EMPATE en linchamiento - Se requiere desempate del intendente:", data);
        if (mayor === username) {
          setLynchTieBreakData(data);
          setIsOpenLynchTieBreak(true);
          alert("¡Hay un empate en el linchamiento! Debes elegir a quién linchar.");
        }
      });

      socket.on("lynchResult", (data) => {
        console.log(" 🔨 Resultado del linchamiento:", data);
        setLynchedPlayer(data.lynched);
        setIsOpenLynchTieBreak(false);
        setLynchTieBreakData(null);
        setHasVotedForLynch(false);

        setPlayers(prevPlayers =>
          prevPlayers.map(player => ({
            ...player,
            lynchVotes: 0,
            ...(player.username === data.lynched && { isAlive: false })
          }))
        );

        if (data.lynched) {
          alert(`¡${data.lynched} ha sido linchado!`);
        } else {
          alert("No se linchó a nadie.");
        }

        const winner = checkWinner(players, role);
        if (winner) {
          setGameWinner(winner);
        } else {
          setTimeout(() => {
            setIsOpenLynchModal(false);
            setLynchedPlayer(null);
            console.log("Iniciando noche después del linchamiento...");
            socket.emit("startNight", { code: roomCode });
          }, 3000);
        }
      });

      socket.on("alreadyVotedLynch", (data) => {
        alert("Ya has votado para linchamiento");
      });

      socket.on("startLynchVote", () => {
        console.log(" Iniciando votación de linchamiento...");
        setIsOpenLynchModal(true);
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

  function startDay() {
    console.log("startDay ejecutándose - Verificando estado del juego...");

    const winner = checkWinner();

    if (winner) {
      console.log("¡Hay un ganador!", winner);
      setWinner(winner);
      return;
    } else {
      console.log("El juego continúa - Cambiando a día");
      setIsNight(false);
      setNightVictim(null);
      setHasVotedNight(false);
      setNightTieBreakData(null);
      setIsOpenNightTieBreak(false);
      setIsOpenNightModal(false);

      setTimeout(() => {
        console.log("Abriendo modal de linchamiento desde startDay");
        setIsOpenLynchModal(true);
      }, 500);
    }
  }



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
              setLynchedPlayer={setLynchedPlayer}
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