import React from "react";
import styles from "./modal.module.css";
import Button from "./button";

export default function Modal({ isOpen, onClose, onSubmit, titulo, valorInput, onChangeInput }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <Button className={styles.close} onClick={onClose} title="✕" />
        <h2>Ingrese el código de sala</h2>
        <input
          type="text"
          placeholder="Ej: 12345"
          value={valorInput}
          onChange={onChangeInput}
        />
        <br></br>
        <br></br>
        <Button className={styles.btn} onClick={onSubmit} title={titulo} />
      </div>
    </div>
  );
}
