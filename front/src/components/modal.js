import React from "react";
import styles from "./modal.module.css";
import Button from "./button";

export default function Modal({
  isOpen,
  onClose,
  title,
  tipo,
  // Props para unirse
  codigoUnirse,
  onChangeCodigoUnirse,
  onSubmitUnirse,
  // Props para crear sala
  codigoCrearSala,
  onChangeCodigoCrearSala,
  cantidadJugadores,
  onChangeCantidadJugadores,
  onSubmitCreate,
  // Props para ranking
  ranking,
  // Props para settings
  onOpenLogin,
  onSubmitModifyAccount,
  onSubmitCloseSession,
  // Props para login/registro
  registered,
  username,
  onChangeUsername,
  password,
  onChangePassword,
  onSubmitLogin,
  onToggleRegister
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <Button className={styles.close} onClick={onClose} title="✕" />
        
        {/* Modal para unirse a sala */}
        {tipo === "unirse" && (
          <>
            <h2>Ingrese el código de sala</h2>
            <input
              type="text"
              placeholder="Ej: 12345"
              value={codigoUnirse}
              onChange={onChangeCodigoUnirse}
            />
            <br />
            <br />
            <Button className={styles.btn} onClick={onSubmitUnirse} title="Unirse" />
          </>
        )}

        {/* Modal para ranking */}
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

        {/* Modal para crear sala */}
        {tipo === "crearSala" && (
          <>
            <h2>Crear nueva sala</h2>
            <label>Código personalizado:</label>
            <input
              type="text"
              value={codigoCrearSala}
              onChange={onChangeCodigoCrearSala}
              placeholder="amigos2025"
            />
            <label>Cantidad de jugadores:</label>
            <input
              type="number"
              min="6"
              max="16"
              value={cantidadJugadores}
              onChange={onChangeCantidadJugadores}
            />
            <br /><br />
            <Button
              className={styles.btn}
              onClick={onSubmitCreate}
              title="Crear sala"
            />
          </>
        )}

        {/* Modal para configuraciones */}
        {tipo === "settings" && (
          <div className={styles.settings}>
            <ul className={styles.settingsList}>
              <li>
                <Button title="INICIAR SESIÓN" onClick={onOpenLogin} />
              </li>
              <li>
                <Button className={styles.btn} onClick={onSubmitModifyAccount} title="Modificar cuenta" />
              </li>
              <li>
                <Button className={styles.btn} onClick={onSubmitCloseSession} title="Cerrar sesión" />
              </li>
            </ul>
          </div>
        )}

        {/* Modal para login/registro */}
        {tipo === "login" && (
          <div className={styles.loginContainer}>
            <h2>{registered ? "Iniciar sesión" : "Registrarse"}</h2>

            <input
              placeholder="Nombre de usuario"
              value={username}
              onChange={onChangeUsername}
            />
            <br />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={onChangePassword}
            />
            <br />
            <Button
              className={styles.btn}
              onClick={onSubmitLogin}
              title={registered ? "Iniciar sesión" : "Registrarse"}
            />
            <p>{registered ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}</p>
            <a onClick={onToggleRegister} className={styles.toggleLink}>
              {registered ? "¡Regístrate!" : "¡Inicia sesión!"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}