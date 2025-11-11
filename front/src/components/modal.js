import React, { useRef } from "react";
import styles from "./modal.module.css";
import Button from "./button";

export default function Modal({
  isOpen,
  onClose,
  title,
  type,
  // Props para unirse
  joinCode,
  onChangeJoinCode,
  onSubmitJoinning,
  // Props para crear sala
  roomCode,
  onChangeRoomCode,
  playersAmount,
  onChangePlayersAmount,
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
  onToggleRegister,
  rol,
  players,
  isOpenMayor,
  onCloseMayor,
  voteMayor,
  mayor,
  hasVotedForMayor,
  isOpenLynch,
  onCloseLynch,
  voteLynch,
  hasVotedForLynch,
  lynchedPlayer
}) {
  const mouseDownTarget = useRef(null);

  const handleOverlayMouseDown = (e) => {
    mouseDownTarget.current = e.target;
  };

  const handleOverlayClick = (e) => {
    if (mouseDownTarget.current === e.currentTarget && e.target === e.currentTarget) {
      onClose();

    }
    mouseDownTarget.current = null;
  };

  if (type === "mayor") {
    if (!isOpenMayor) return null;
  } else {
    if (!isOpen) return null;
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <Button className={styles.close} onClick={onClose} title="✕" />


        {/* Modal para unirse a sala */}
        {type === "join" && (
          <>
            <h2>Ingrese el código de sala</h2>
            <input
              type="text"
              placeholder="Ej: 12345"
              value={joinCode}
              onChange={onChangeJoinCode}
            />
            <br />
            <br />
            <Button className={styles.btn} onClick={onSubmitJoinning} title="Unirse" />
          </>
        )}

        {/* Modal para ranking */}
        {type === "ranking" && (
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
        {type === "createRoom" && (
          <>
            <h2>Crear nueva sala</h2>
            <label>Código personalizado:</label>
            <input
              type="text"
              value={roomCode}
              onChange={onChangeRoomCode}
              placeholder="amigos2025"
            />
            <label>Cantidad de jugadores:</label>
            <input
              type="number"
              min="6"
              max="16"
              value={playersAmount}
              onChange={onChangePlayersAmount}
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
        {type === "settings" && (
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
        {type === "login" && (
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

        {type === "startGame" && (
          <div className={styles.startGame}>
            <>
              <h2>Bienvenido a Castro Barros</h2>
              <p>usted vino en busca de la paz que la ciudad no puede darte. Pero hnay un problema...¡Una invasion de lobizones! Encuentrenlos y linchenlos antes que se deboren todo el pueblo</p>
              <br />
              <br />
              <p>tu rol es {rol}</p>
            </>
          </div>
        )}

        {type === "mayor" && (
          <div className={styles.mayor}>
            <Button className={styles.close} onClick={onCloseMayor} title="✕" />
            <>
              <h2>Lo primero que tenemos que hacer es votar un <strong>intendente</strong></h2>
              <p>quien sea intendente desempatará en los linchamientos y tendra una gran habilidad especial...<strong>el "Plan Platita"</strong></p>
              <br />
              <br />

              {mayor ? (
                <div className={styles.electionResult}>
                  <h3>🎉 ¡Intendente Electo!</h3>
                  <p><strong>{mayor}</strong> ha sido elegido como intendente.</p>
                  <p>El modal se cerrará automáticamente...</p>
                </div>
              ) : (
                <>
                  <p>¿A quién votas para intendente?</p>
                  {hasVotedForMayor && (
                    <p className={styles.voteConfirmed}> Ya votaste. Esperando a los demás jugadores...</p>
                  )}
                  <section className={styles.playersSection}>
                    <ul>
                      {players.map((player, index) => (
                        <li className={styles.playerItem} key={index}>
                          <Button
                            onClick={() => voteMayor(player.username)}
                            title={`${player.username} ${player.mayorVotes ? `(${player.mayorVotes} votos)` : ''}`}
                            disabled={hasVotedForMayor || mayor} 
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                  <div className={styles.voteStatus}>
                    <p>Jugadores que ya votaron: {players.filter(p => p.mayorVotes > 0).length} de {players.length}</p>
                  </div>
                </>
              )}
            </>
          </div>
        )}

                {type === "lynch" && (
          <div className={styles.lynch}>
            <Button className={styles.close} onClick={onCloseLynch} title="✕" />
            <>
              <h2>Votación para <strong>linchamiento</strong></h2>
              <p>El pueblo debe decidir a quién linchar. ¡Cuidado, podrían estar matando a un inocente!</p>
              <br />
              <br />

              {lynchedPlayer ? (
                <div className={styles.lynchResult}>
                  <h3> ¡Jugador Linchado!</h3>
                  <p><strong>{lynchedPlayer}</strong> ha sido linchado por el pueblo.</p>
                  <p>El modal se cerrará automáticamente...</p>
                </div>
              ) : (
                <>
                  <p>¿A quién votas para linchar?</p>
                  {hasVotedForLynch && (
                    <p className={styles.voteConfirmed}> Ya votaste. Esperando a los demás jugadores...</p>
                  )}
                  <section className={styles.playersSection}>
                    <ul>
                      {players.map((player, index) => (
                        <li className={styles.playerItem} key={index}>
                          <Button
                            onClick={() => voteLynch(player.username)}
                            title={`${player.username} ${player.lynchVotes ? `(${player.lynchVotes} votos)` : ''}`}
                            disabled={hasVotedForLynch || lynchedPlayer || !player.isAlive}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                  <div className={styles.voteStatus}>
                    <p>Jugadores que ya votaron: {players.filter(p => p.lynchVotes > 0).length} de {players.length}</p>
                  </div>
                </>
              )}
            </>
          </div>
        )}
        
      </div>
    </div>
  );
}