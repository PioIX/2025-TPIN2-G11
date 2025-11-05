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
  const [isOpen, setOpen]= useState(true);
  const [rol, setRol] = useState("");
  const [isOpenMayor,setOpenMayor]=useState(false);

  function onClose(){
    setOpen(false);
    setOpenMayor(true)
  }

  function onCloseMayor(){
    setOpen(false);
    setOpenMayor(false)
  }


  return (
    <>
      {isOpen == true && lobby == false ?
        <Modal
        isOpen={isOpen}
        onClose={onClose}
        type={"startGame"}
        rol={rol}
      ></Modal>
      : <></> } 
    
      { lobby === true ? <>

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
        ></Lobby>

      </> :  <>
        <Day
          players={players}
          username={username}
          isOpenMayor={isOpenMayor}
          setOpenMayor={setOpenMayor}
          onClose={onCloseMayor}
        ></Day>

      </>}

    </>
  );
}