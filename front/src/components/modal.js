import React from "react";
import styles from "./modal.module.css";
import Button from "./button";

export default function Modal({
  isOpen,
  onClose,
  title,
  tipo,
  codigoSala,
  onChangeCodigoSala,
  onSubmitUnirse,
  ranking,
  nuevoCodigoSala,
  funcionCodigoSala,
  cantidadJugadores,
  funcionCantidadJugadores,
  onSubmitCreate,
  onSubmitModalSignin,
  onSubmitModifyAcount,
  onSubmitCloseSession,
  registered,
  username,
  setusername,
  password,
  setpassword,
  onSubmitlogin,
  manageRegistered
}) {
  if (!isOpen) return null;

  return (
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <Button className={styles.close} onClick={onClose} title="✕" />
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        {tipo === "unirme" && (
          <>
            <h2>Ingrese el código de sala</h2>
            <input
              type="text"
              placeholder="Ej: 12345"
              value={codigoSala}
              onChange={onChangeCodigoSala}
            />
            <br />
            <br />
            <Button className={styles.btn} onClick={onSubmitUnirse} title={title} />
          </>
        )}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        {tipo === "crearSala" && (
          <>
            <h2>Crear nueva sala</h2>
            <label>Código personalizado:</label>
            <input
              type="text"
              value={nuevoCodigoSala}
              onChange={funcionCodigoSala}
              placeholder="amigos2025"
            />
            <label>Cantidad de jugadores:</label>
            <input
              type="number"
              min="6"
              max="10"
              value={cantidadJugadores}
              onChange={funcionCantidadJugadores}
            />
            <br /><br />
            <Button
              className={styles.btn}
              onClick={onSubmitCreate}
              title="Crear sala"
            />
          </>
        )}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        {tipo == "settings" && (
          <div className={styles.settings}>
            <li>
              <ul> <Button title="INICIAR SESIÓN" onClick={onSubmitModalSignin} /></ul>
              <br></br>
              <ul> <Button className={styles.btn} onClick={onSubmitModifyAcount} title="modificar cuenta" /></ul>
              <br></br>
              <ul> <Button className={styles.btn} onClick={onSubmitCloseSession} title="cerrar sesion" /></ul>
            </li>
          </div>
        )}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        {tipo === "login" && (
          <div className={styles.loginContainer}>
            <h2>{registered ? "Iniciar sesión" : "Registrarse"}</h2>

            <input
              placeholder="Nombre de usuario"
              value={username}
              onChange={setusername}
            />
            <br />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={setpassword}
            />
            <br />
            <Button
              className={styles.btn}
              onClick={onSubmitlogin}
              title={registered ? "Iniciar sesión" : "Registrarse"}
            />
            <p>{registered ? "no tienes cuenta?" : "ya tienes cuenta?"}</p>
            <a onClick={manageRegistered}>
              {registered ? "registrate!" : "inicia sesión"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
