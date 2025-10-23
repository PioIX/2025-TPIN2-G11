"use client";
import { useSocket } from "../hooks/useSocket.js";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "../components/button";
import Modal from "../components/modal";
import { Salsa } from "next/font/google/index.js";

export default function Home() {
  const router = useRouter();
  const [codigoUnirse, setCodigoUnirse] = useState(""); 
  const [codigoCrearSala, setCodigoCrearSala] = useState(""); 
  const [open, setOpen] = useState(false);
  const [tipoModal, setTipoModal] = useState("");
  const [ranking, setRanking] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registered, setRegistered] = useState(true);
  const [cantidadJugadores, setCantidadJugadores] = useState(6);

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

    try {
      const response = await fetch(`http://localhost:4000/verifyUser?username=${username}&password=${password}`);
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
    setTipoModal("unirse");
    setOpen(true);
  }

  function abrirLogin() {
    setTipoModal("login");
    setRegistered(true);
    setOpen(true);
  }

  function crearSala() {
    setTipoModal("crearSala");
    setOpen(true);
  }

  function confirmarCreacionSala() {
    console.log("codigoCrearSala:", codigoCrearSala, "cantidad:", cantidadJugadores);

    if (!codigoCrearSala || !cantidadJugadores) {
      alert("Completá todos los campos para crear la sala");
      return;
    }

    router.push(`/lobby?codigo=${codigoCrearSala}&host=true&cantidadJugadores=${cantidadJugadores}`);
    setOpen(false);
  }

  async function verRanking() {
    try {
      const players = await fetch("http://localhost:4000/getRanking");
      const result = await players.json();
      setRanking(result.response || []);
      setTipoModal("ranking");
      setOpen(true);
    } catch (error) {
      console.error("Error al obtener ranking:", error);
    }
  }

  async function confirmarUnion() {
    if (!codigoUnirse) {
      alert("Por favor ingresa un código de sala");
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/vectorSalas`);
      const salas = await response.json();
      console.log("Salas disponibles:", salas);

      const salaEncontrada = salas.find(sala => sala.codigo === codigoUnirse);

      if (salaEncontrada) {
        if (salaEncontrada.jugadores.length >= salaEncontrada.maxJugadores) {
          alert("La sala está llena");
          return;
        }

        router.push(`/lobby?codigo=${codigoUnirse}&host=false`);
        setOpen(false);
      } else {
        alert("No existe una sala con ese código");
      }
    } catch (error) {
      console.error("Error al verificar salas:", error);
      alert("Error al conectar con el servidor");
    }
  }

  function openSettings() {
    setTipoModal("settings");
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
        title={tipoModal}
        tipo={tipoModal}
        
        // Props para unirse a sala
        codigoUnirse={codigoUnirse}
        onChangeCodigoUnirse={(e) => setCodigoUnirse(e.target.value)}
        onSubmitUnirse={confirmarUnion}
        
        // Props para crear sala
        codigoCrearSala={codigoCrearSala}
        onChangeCodigoCrearSala={(e) => setCodigoCrearSala(e.target.value)}
        cantidadJugadores={cantidadJugadores}
        onChangeCantidadJugadores={(e) => setCantidadJugadores(e.target.value)}
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