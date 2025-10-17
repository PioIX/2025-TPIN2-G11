"use client";
import useSocket from "@/hooks/useSocket";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "../components/button";
import Modal from "../components/modal";

export default function Home() {
  const socket = useSocket();
  const router = useRouter();
  const [funcion, setFuncion] = useState(() => confirmarUnion);
  const [codigo, setCodigo] = useState("");
  const [open, setOpen] = useState(false);
  const [tipoModal, setTipoModal] = useState("unirme");
  const [ranking, setRanking] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registered, setRegistered] = useState(true);
  const [codigoSala, setCodigoSala] = useState("");
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
        localStorage.setItem("username", result.username);
        localStorage.setItem("id", result.id);
        setRegistered(true);
      } else {
        alert(result.message || "Error al registrarse");
      }
    } catch (error) {
      console.log("Error en la consulta SQL:", err);
      return [];
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
        localStorage.setItem("username", result.username);
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
    setTipoModal("unirme");
    setOpen(true);
    setFuncion(() => confirmarUnion);
  }

  function abrirLogin() {
    setTipoModal("login");
    setRegistered(true);
    setOpen(true);
    setFuncion(() => SignIn);
  }

  function crearSala() {
    setTipoModal("crearSala");
    setFuncion(() => confirmarCreacionSala);
    setOpen(true);
  }

  function confirmarCreacionSala() {
    console.log("codigoSala:", codigoSala, "cantidad:", cantidadJugadores);
    const user = localStorage.getItem("username") || "Anfitrión";

    if (!codigoSala || !cantidadJugadores) {
      alert("Completá todos los campos para crear la sala");
      return;
    }

    socket.emit("crearSala", {
      codigo: codigoSala,
      anfitrion: user,
      maxJugadores: cantidadJugadores,
    });

    router.push(`/gameRoom?codigo=${codigoSala}&host=true`);
    setOpen(false);
  }


  async function verRanking() {
    const players = await fetch("http://localhost:4000/getRanking");
    const result = await players.json();
    setRanking(result.response || []);
    setTipoModal("ranking");
    setOpen(true);
  }

  function confirmarUnion() {
    const user = localStorage.getItem("username") || "Invitado";
    if (!codigo) return alert("Ingresá un código de sala");
    socket.emit("joinRoom", { codigo, username: user });
    router.push(`/gameRoom?codigo=${codigo}`);
    setOpen(false);
  }

  function openSettings() {
    setTipoModal("settings");
    setOpen(true);
  }

  function changeRegistered() {
    if (registered == true) {
      setRegistered(false)
    } else if (registered == false) {
      setRegistered(true)
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
        onSubmit={funcion}
        title={tipoModal}
        valorInput={codigo}
        onChangeInput={(e) => setCodigo(e.target.value)}
        tipo={tipoModal}
        ranking={ranking}
        registered={registered}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        toggleRegistered={() => setRegistered(!registered)}
        onSubmitSettings={funcion}
        onSubmitModalSignin={abrirLogin}
        onSubmitlogin={registered == true ? SignIn : SignUp}
        setusername={(e) => setUsername(e.target.value)}
        setpassword={(e) => setPassword(e.target.value)}
        manageRegistered={changeRegistered}
        codigoSala={codigoSala}
        setCodigoSala={setCodigoSala}
        funcionCodigoSala={(e) => setCodigoSala(e.target.value)}
        funcionCantidadJugadores={(e) => setCantidadJugadores(e.target.value)}
        onSubmitCreate={confirmarCreacionSala}
      />

    </>
  );
}
