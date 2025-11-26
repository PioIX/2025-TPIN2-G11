"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "../components/button";
import Modal from "../components/modal";
import BackgroundVideo from "../components/video";
import Image from "next/image";


export default function Home() {
  const router = useRouter();
  // Estados para manejar el modal y sus diferentes tipos
  const [open, setOpen] = useState(false);
  const [typeModal, setTypeModal] = useState("");
  // Estados para manejar los formularios
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registered, setRegistered] = useState(true);
  const [playersAmount, setPlayersAmount] = useState(6);
  // Estado para manejar el ranking
  const [ranking, setRanking] = useState([]);

  // Funciones para manejar autenticación
  async function SignUp() {
    if (!username || !password) {
      alert("Por favor complete todos los campos");
      return;
    }

    try {
      // fetch post para registrar usuario
      const response = await fetch("http://localhost:4000/regUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      console.log(result);

      // manejo de respuesta del back
      if (result.message === "ok") {
        alert("Registrado correctamente");
        localStorage.setItem("username", username);
        localStorage.setItem("id", result.id);
        setRegistered(true);
      } else {
        alert(result.message || "Error al registrarse");
      }
    } catch (error) {
      console.log("Error en la consulta SQL:", error);
    }
  }

  async function SignIn() {
    if (!username || !password) {
      alert("Por favor complete todos los campos");
      return;
    }

    let alreadyLogged = false;

    // verificar si ya hay una sesión iniciada en localStorage
    if (localStorage.getItem("username") != null) {
      alert("Ya hay una sesión iniciada. Por favor cierre sesión primero.");
      alreadyLogged = true;
      return;
    } else {
      alreadyLogged = false;
    }

    // verificar usuario y contraseña en el back con un get
    try {
      const response = await fetch(`http://localhost:4000/verifyUser?username=${username}&password=${password}&alreadyLogged=${alreadyLogged}`);
      const result = await response.json();
      console.log(result);

      // manejo de respuesta del back
      if (result.message === "ok") {
        alert("Inicio de sesión exitoso");
        localStorage.setItem("username", username);
        localStorage.setItem("id", result.id);
        setOpen(false);
      } else {
        alert(result.message || "Usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("Error en SignIn:", error);
    }
  }

  function openJoin() {
    setTypeModal("join");
    setOpen(true);
  }

  function openLogin() {
    setTypeModal("login");
    setRegistered(true);
    setOpen(true);
  }

  function createRoom() {
    setTypeModal("createRoom");
    setOpen(true);
  }

  async function confirmCreateRoom() {
    if (!roomCode || !playersAmount) {
      alert("Completá todos los campos para crear la sala");
      return;
    } else if (playersAmount > 16 || playersAmount < 6) {
      alert("Solo se aceptan desde 6 hasta 16 jugadores");
      return;
    }

    try {
      const user = localStorage.getItem("username") || "Anfitrión";
      console.log(" Enviando datos para crear sala:", {
        code: roomCode,
        host: user,
        maxPlayers: playersAmount
      });

      const response = await fetch("http://localhost:4000/crearSalaBD", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          code: roomCode,
          host: user,
          maxPlayers: playersAmount
        })
      });

      console.log("Respuesta del servidor - Status:", response.status);

      const result = await response.json();
      console.log("Respuesta del servidor - Data:", result);

      if (result.success) {
        console.log("Sala creada en BD, redirigiendo...");
        router.push(`/game?code=${roomCode}&host=true&PlayersAmount=${playersAmount}`);
        setOpen(false);
      } else {
        alert(`Error: ${result.message || result.error || "Error desconocido"}`);
      }
    } catch (error) {
      console.error(" Error creando sala:", error);
      alert(`Error de conexión: ${error.message}`);
    }
  }

  async function seeRanking() {
    try {
      const players = await fetch("http://localhost:4000/getRanking");
      const result = await players.json();
      setRanking(result.response || []);
      setTypeModal("ranking");
      setOpen(true);
    } catch (error) {
      console.error("Error al obtener ranking:", error);
    }
  }

  async function joinConfirm() {
    let user = localStorage.getItem("username");
    if (!user) {
      const guestId = Math.random().toString(36).substring(2, 8);
      user = `Invitado-${guestId}`;
    }

    if (!joinCode) {
      alert("Por favor ingresa un código de sala");
      return;
    }
    console.log(joinCode);

    try {
      const response = await fetch(`http://localhost:4000/verifyRoom/${joinCode}`);
      const result = await response.json();
      console.log(result)
      if (result.success && result.exists) {
        console.log(" Sala verificada en BD, redirigiendo...");
        router.push(`/game?code=${joinCode}&host=false&username=${encodeURIComponent(user)}&PlayersAmount=${playersAmount}`);
        setOpen(false);
      } else {
        alert(result.message || "No existe una sala con ese código");
      }
    } catch (error) {
      console.error(" Error al verificar sala:", error);
      alert("Error al conectar con el servidor");
    }
  }


  function openSettings() {
    setTypeModal("settings");
    setOpen(true);
  }

  function changeRegistered() {
    setRegistered(prev => !prev);
  }

  function handleModifyAccount() {
    alert("Funcionalidad de modificar cuenta en desarrollo");
  }

  function handleCloseSession() {
    localStorage.removeItem("username");
    localStorage.removeItem("id");
    alert("Sesión cerrada");
    setOpen(false);
  }

  const handleCloseModal = () => {
    setOpen(false);
    setJoinCode("");
    setRoomCode("");
    setUsername("");
    setPassword("");
    setPlayersAmount(6);
  };

  function handleAuth() {
    if (registered) {
      SignIn();
    } else {
      SignUp();
    }
  }

  return (
    <>
      <BackgroundVideo title="VIDEO DE FONDO" className={styles.backgroundVideo} />

      <Image
        src="/top-frame.svg"
        alt="top frame"
        width={650}
        height={470}
        className={styles.topFrame}
      />

      <Image
        src="/logo.png"
        alt="logo"
        width={480}
        height={450}
        className={styles.logo}
      />
      <button className={styles.btnSettings} onClick={openSettings}>
        Configuraciones
      </button>

      <main className={styles.hero}></main>

      <div className={styles.actions}>
        <Button title="CREAR SALA" onClick={createRoom} />
        <Button title="UNIRME A SALA" onClick={openJoin} />
        <Button title="VER RANKING" onClick={seeRanking} />
      </div>

      <Image
        src="/bottom-frame.svg"
        alt="Bottom frame"
        width={500}
        height={500}
        className={styles.bottomFrame}
      />

      <Modal
        // general props
        isOpen={open}
        onClose={handleCloseModal}
        title={typeModal}
        type={typeModal}
        // join room props
        joinCode={joinCode}
        onChangeJoinCode={(e) => setJoinCode(e.target.value)}
        onSubmitJoinning={joinConfirm}
        // create room props
        roomCode={roomCode}
        onChangeRoomCode={(e) => setRoomCode(e.target.value)}
        playersAmount={playersAmount}
        onChangePlayersAmount={(e) => setPlayersAmount(e.target.value)}
        onSubmitCreate={confirmCreateRoom}
        // ranking props
        ranking={ranking}
        onOpenLogin={openLogin}
        // mnodify account props
        onSubmitModifyAccount={handleModifyAccount}
        // close session props
        onSubmitCloseSession={handleCloseSession}
        // login/register props
        registered={registered}
        username={username}
        onChangeUsername={(e) => setUsername(e.target.value)}
        password={password}
        onChangePassword={(e) => setPassword(e.target.value)}
        onSubmitLogin={handleAuth}
        onToggleRegister={changeRegistered}
      />
    </>
  );
}