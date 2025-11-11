"use client";
import { useSocket } from "../../hooks/useSocket.js";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button.js";
import Lobby from "@/components/lobby.js";
import Day from "@/components/day.js";
import Modal from "@/components/modal.js";

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
  const playersAmount = searchParams.get("playersAmount") || 6;
  const usernameFromParams = searchParams.get("username");
  const [hasVotedForLynch, setHasVotedForLynch] = useState(false);
  const [lynchTieBreakData, setLynchTieBreakData] = useState(null);
  const [isOpenLynchTieBreak, setIsOpenLynchTieBreak] = useState(false);
  const [lynchedPlayer, setLynchedPlayer] = useState(null);
  const [isOpenLynchModal, setIsOpenLynchModal] = useState(false);

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
        console.error(" Error de sala:", message);
        setErrorMessage(message);
        alert("Error: " + message);
        setTimeout(() => router.push("/"), 3000);
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

      socket.on("lynchResult", (data) => {
        console.log(" Resultado del linchamiento:", data);
        setLynchedPlayer(data.lynched);
        setIsOpenLynchTieBreak(false);
        setLynchTieBreakData(null);
        setHasVotedForLynch(false);

        if (data.lynched) {
          alert(`¡${data.lynched} ha sido linchado!`);
        } else {
          alert("No se linchó a nadie.");
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
    if (socket && roomCode && !hasVotedForLynch) {
      console.log(` ${username} votando por linchar a ${candidateUsername}`);
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

  return (
    <>

      {lobby === true ? <>

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
        ></Lobby>

      </> : <>
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
          closeLynchModal={closeLynchModal}
        />
        
      </>}
    </>
  );
}