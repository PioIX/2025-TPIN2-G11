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
      </div>

      {tipo === "crearSala" && (
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

      {tipo == "settings" && (
        <>
          <Button className={styles.btn} onClick={onSubmit} title="iniciar sesion" />
          <Button className={styles.btn} onClick={onSubmit} title="modificar cuenta" />
          <Button className={styles.btn} onClick={onSubmit} title="cambiar idioma" />

        </>

      )}
    </div>
  );
}
