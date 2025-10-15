"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "../components/button";
import Configuraciones from "../components/configuraciones";
import Modal from "../components/modal";

export default function Home() {

  const [codigo, setCodigo] = useState("");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tipoModal, setTipoModal] = useState("unirme");
  const [ranking, setRanking] = useState([]);

  function abrirModal() {
    setTipoModal("unirme");
    setOpen(true);
  }

  async function verRanking() {
    const players = await fetch()
    setRanking(jugadoresMock);
    setTipoModal("ranking");
    setOpen(true);
  }


  function crearSala() {
    // TODO: lógica para crear sala
  }

  function confirmarUnion() {
    if (!codigo) return alert("Ingresá un código de sala");
    router.push(`/salaJuego?codigo=${codigo}`);
    setOpen(false);
  }

  return (
    <>
      <div className={styles.page}>
        <Configuraciones />
      </div>

      <main className={styles.hero}>
        {/* el contenido central está en la imagen de fondo */}
      </main>

      <div className={styles.actions}>
        <Button title="CREAR SALA" onClick={crearSala} />
        <Button title="UNIRME A SALA" onClick={abrirModal} />
        <Button title="VER RANKING" onClick={verRanking} />
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={confirmarUnion}
        titulo={tipoModal}
        valorInput={codigo}
        onChangeInput={(e) => setCodigo(e.target.value)}
        tipo={tipoModal}
        ranking={ranking}
      />



    </>
  );
}

