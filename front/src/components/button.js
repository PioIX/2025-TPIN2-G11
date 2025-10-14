
import React from "react";
import styles from "./button.module.css";

export default function Button({ title, onClick, className = "" }) {
  return (
    <button className={`${styles.btn} ${className}`} onClick={onClick}>
      {title}
    </button>
  );
}
