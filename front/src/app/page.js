"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "./components/button";
import Configuraciones from "./components/configuraciones";
import Modal from "./components/modal";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const router = useRouter();

  function abrirModal() {
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

  function verRanking() {
    // TODO: lógica para ver ranking
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
        titulo="Unirme"
        valorInput={codigo}
        onChangeInput={(e) => setCodigo(e.target.value)}
      />
      
    </>
  );
}

