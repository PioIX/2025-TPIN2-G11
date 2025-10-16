import React from "react";
import styles from "./modal.module.css";
import Button from "./button";

export default function Modal({
  isOpen,
  onClose,
  onSubmit,
  title,
  valorInput,
  onChangeInput,
  tipo,
  ranking = [],
  registered = true
}) {
  if (!isOpen) return null;

  return (

    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <Button className={styles.close} onClick={onClose} title="✕" />

        {tipo === "unirme" && (
          <>
            <h2>Ingrese el código de sala</h2>
            <input
              type="text"
              placeholder="Ej: 12345"
              value={valorInput}
              onChange={onChangeInput}
            />
            <br />
            <br />
            <Button className={styles.btn} onClick={onSubmit} title={title} />
          </>
        )}

        {tipo === "ranking" && (
          <>
            <h2>🏆 Ranking de jugadores</h2>
            <ul className={styles.rankingList}>
              {ranking.length > 0 ? (
                ranking.map((user, i) => (
                  <li key={i}>
                    <strong>{i + 1}. {user.username}</strong> — {user.score} pts
                  </li>
                ))
              ) : (
                <p>No hay jugadores aún</p>
              )}
            </ul>
          </>
        )}

        {tipo === "crearSala" && (
          <>
            <input placeholder="ingrese cantidad de usuarios" className={styles.crearSala} type="number"></input>
            <br></br>
            <input placeholder="inmhrese codigo" className={styles.crearSala}></input>
            <br></br>
            <Button className={styles.btnCrearSala} onClick={onSubmit} title="crear sala"></Button>
          </>
        )}

        {tipo == "settings" && (
          <div className={styles.settings}>
            <li>
              <ul> <Button className={styles.btn} onClick={onSubmit} title="iniciar sesion" /></ul>
              <br></br>
              <ul> <Button className={styles.btn} onClick={onSubmit} title="modificar cuenta" /></ul>
              <br></br>
              <ul> <Button className={styles.btn} onClick={onSubmit} title="cambiar idioma" /></ul>
            </li>
          </div>
        )}

        {tipo == "login" && (
          <div>
            {registered == true ? (
              <><li>
              <ul><input placeholder="ingrese nombre de usuario" value={username}></input></ul>
              <br></br>
              <ul><input placeholder="ingrese contraseña" value={password}></input></ul>
              <br></br>
              <ul><Button className={styles.btn} onClick={onSubmit} title="iniciar sesion" /></ul>
              <br></br>
              <ul><p>no tienes cuenta?<a></a>Registrate</p></ul>
            </li></>
            ) : (
              <li>
              <ul><input placeholder="ingrese nombre de usuario"></input></ul>
              <br></br>
              <ul><input placeholder="ingrese contraseña"></input></ul>
              <br></br>
              <ul><Button className={styles.btn} onClick={onSubmit} title="registrarse" /></ul>
              <br></br>
              <ul><p>ya tienes cuenta?<a></a>Inicia sesion</p></ul>
            </li>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
