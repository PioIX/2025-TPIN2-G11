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
  const [isOpen, setOpen] = useState(true);
  const [rol, setRol] = useState("");
  const [isOpenMayor, setOpenMayor] = useState(false);
  const socketObj = useSocket();
  const socket = socketObj?.socket;
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomCode = searchParams.get("code");
  const isHost = searchParams.get("host") === "true";
  const playersAmount = searchParams.get("playersAmount") || 6;
  const usernameFromParams = searchParams.get("username"); 

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
        console.log("Juego iniciado recibido AAAAAAAAAAAA:", data);
        setGameStarted(true);
        localStorage.setItem('roomCode', roomCode);
        localStorage.setItem('isHost', isHost.toString());
        setLobby(false);
        setGame(true);
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
          anfitrion: userToUse, // Usar userToUse en lugar de savedUsername
          maxPlayers: parseInt(playersAmount)
        });
      } else {
        console.log(" Jugador uniéndose a sala...");
        socket.emit("joinRoom", {
          code: roomCode,
          username: userToUse // Usar userToUse en lugar de savedUsername
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

  function onClose() {
    setOpen(false);
    setOpenMayor(true)
  }

  function onCloseMayor() {
    setOpen(false);
    setOpenMayor(false)
  }

  useEffect(() => {
    console.log("Estado actual:", {
      lobby,
      game,
      gameStarted,
      playersCount: players.length
    });
  }, [lobby, game, gameStarted, players]);



  return (
    <>
      {isOpen == true && lobby == false ?
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          type={"startGame"}
          rol={rol}
        ></Modal>
        : <></>}

      {lobby === true ? <>

        <Lobby
          players={players}
          username={username}
          createdRoom={createdRoom}
          gameStarted={gameStarted}
          errorMessage={errorMessage}
          lobby={lobby}
          game={game}
          setCreatedRoom={setCreatedRoom}
          setPlayers={setPlayers}
          setUsername={setUsername}
          setGameStarted={setGameStarted}
          setErrorMessage={setErrorMessage}
          setLobby={setLobby}
          setGame={setGame}
          roomCode={roomCode}
          closeRoom={closeRoom}
          leaveRoom={leaveRoom}
        ></Lobby>

      </> : <>
        <Day
          players={players}
          username={username}
          setUsername={setUsername}
          isOpenMayor={isOpenMayor}
          onCloseMayor={onCloseMayor}
        ></Day>

      </>}
    </>
  );
}