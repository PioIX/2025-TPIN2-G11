"use client";
import { useSocket } from "../hooks/useSocket.js";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "../components/button";
import Modal from "../components/modal";


export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [open, setOpen] = useState(false);
  const [typeModal, setTypeModal] = useState("");
  const [ranking, setRanking] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registered, setRegistered] = useState(true);
  const [playersAmount, setPlayersAmount] = useState(6);

  async function SignUp() {
    if (!username || !password) {
      alert("Por favor complete todos los campos");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/regUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      console.log(result);

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

    if (localStorage.getItem("username") != null) {
      alert("Ya hay una sesión iniciada. Por favor cierre sesión primero.");
       alreadyLogged = true;
      return;
    } else {
       alreadyLogged = false;
    }

    try {
      const response = await fetch(`http://localhost:4000/verifyUser?username=${username}&password=${password}&alreadyLogged=${alreadyLogged}`);
      const result = await response.json();
      console.log(result);

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

  function abrirModal() {
    setTypeModal("join");
    setOpen(true);
  }

  function abrirLogin() {
    setTypeModal("login");
    setRegistered(true);
    setOpen(true);
  }

  function crearSala() {
    setTypeModal("crearSala");
    setOpen(true);
  }

  async function confirmarCreacionSala() {
    if (!roomCode || !playersAmount) {
      alert("Completá todos los campos para crear la sala");
      return;
    }

    try {
      const user = localStorage.getItem("username") || "Anfitrión";
      console.log(" Enviando datos para crear sala:", {
        code: roomCode,
        anfitrion: user,
        maxJugadores: playersAmount
      });

      const response = await fetch("http://localhost:4000/crearSalaBD", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          code: roomCode,
          anfitrion: user,
          maxJugadores: playersAmount
        })
      });

      console.log("Respuesta del servidor - Status:", response.status);

      const result = await response.json();
      console.log(" Respuesta del servidor - Data:", result);

      if (result.success) {
        console.log("Sala creada en BD, redirigiendo...");
        router.push(`/lobby?code=${roomCode}&host=true&PlayersAmount=${playersAmount}`);
        setOpen(false);
      } else {
        alert(`Error: ${result.message || result.error || "Error desconocido"}`);
      }
    } catch (error) {
      console.error(" Error creando sala:", error);
      alert(`Error de conexión: ${error.message}`);
    }
  }

  async function verRanking() {
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

async function confirmarUnion() {
  // Generar un ID único para invitados
  let user = localStorage.getItem("username");
  if (!user) {
    const guestId = Math.random().toString(36).substring(2, 8); // ID único de 6 caracteres
    user = `Invitado-${guestId}`;
  }

  if (!joinCode) {
    alert("Por favor ingresa un código de sala");
    return;
  }

  try {
    const response = await fetch(`http://localhost:4000/verificarSala/${joinCode}`);
    const result = await response.json();

    if (result.success && result.exists) {
      console.log(" Sala verificada en BD, redirigiendo...");
      router.push(`/lobby?code=${joinCode}&host=false&username=${encodeURIComponent(user)}`);
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

  function handleAuth() {
    if (registered) {
      SignIn();
    } else {
      SignUp();
    }
  }

  return (
    <>
      <div className={styles.page}>
        <Button
          title="Configuraciones"
          onClick={openSettings}
          className={styles.btnSettings}
        />
      </div>

      <main className={styles.hero}></main>

      <div className={styles.actions}>
        <Button title="CREAR SALA" onClick={crearSala} />
        <Button title="UNIRME A SALA" onClick={abrirModal} />
        <Button title="VER RANKING" onClick={verRanking} />
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={typeModal}
        tipo={typeModal}

        // Props para unirse a sala
        joinCode={joinCode}
        onChangeJoinCode={(e) => setJoinCode(e.target.value)}
        onSubmitUnirse={confirmarUnion}

        // Props para crear sala
        roomCode={roomCode}
        onChangeRoomCode={(e) => setRoomCode(e.target.value)}
        playersAmount={playersAmount}
        onChangePlayersAmount={(e) => setPlayersAmount(e.target.value)}
        onSubmitCreate={confirmarCreacionSala}

        // Props para ranking
        ranking={ranking}

        // Props para settings
        onOpenLogin={abrirLogin}
        onSubmitModifyAccount={handleModifyAccount}
        onSubmitCloseSession={handleCloseSession}

        // Props para login/registro
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