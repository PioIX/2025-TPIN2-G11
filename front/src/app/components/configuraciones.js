// components/Configuraciones.jsx
import React from "react";
import styles from "./configuraciones.module.css";

export default function Configuraciones({ onClick }) {
  return (
    <div className={styles.wrap} onClick={onClick} aria-label="configuraciones">
      {/* SVG simple de engranaje */
      /* puedes reemplazar por una imagen si prefieres */}
      <svg className={styles.gear} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.14 12.936a7.997 7.997 0 000-1.872l2.036-1.583a.5.5 0 00.12-.632l-1.928-3.337a.5.5 0 00-.605-.22l-2.397.96a7.99 7.99 0 00-1.62-.94l-.36-2.54A.5.5 0 0013.95 1h-3.9a.5.5 0 00-.495.423l-.36 2.54a7.99 7.99 0 00-1.62.94l-2.397-.96a.5.5 0 00-.605.22L1.7 8.85a.5.5 0 00.12.632L3.856 11.07c-.05.31-.07.63-.07.95s.02.64.07.95L1.82 14.55a.5.5 0 00-.12.632l1.928 3.337c.14.246.436.349.68.254l2.397-.96c.5.39 1.05.72 1.62.94l.36 2.54c.05.265.28.423.495.423h3.9c.215 0 .445-.158.495-.423l.36-2.54c.57-.22 1.12-.55 1.62-.94l2.397.96c.244.095.54-.008.68-.254l1.928-3.337a.5.5 0 00-.12-.632l-2.036-1.583zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/>
      </svg>
    </div>
  );
}
