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
  tieBreakData,
  isOpenTieBreak,
  decideTieBreak,
  voteLynch,
  hasVotedForLynch,
  lynchTieBreakData,
  isOpenLynchTieBreak,
  decideLynchTieBreak,
  lynchedPlayer,
  isOpenLynchModal,
  closeLynchModal,
  voteNightKill,
  hasVotedNight,
  nightVictim,
  nightTieBreakData,
  voteNightTieBreak,
  successorCandidates,
  chooseSuccessor
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
        <button className={styles.close} onClick={onClose}>✕</button>


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
          <div className={styles.createRoom}>
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
          </div>
        )}

        {/* Modal para configuraciones */}
        {type === "settings" && (
          <div className={styles.settings}>
                <Button title="INICIAR SESIÓN" onClick={onOpenLogin} />
                <Button className={styles.btn} onClick={onSubmitModifyAccount} title="Modificar cuenta" />
                <Button className={styles.btn} onClick={onSubmitCloseSession} title="Cerrar sesión" />
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

        {type === "tieBreak" && (
          <div className={styles.tieBreak}>
            <div className={styles.tieBreakHeader}>
              <h2>¡EMPATE DETECTADO!</h2>
              <p>Como anfitrión, debes decidir quién será el intendente</p>
            </div>

            <div className={styles.tieBreakInfo}>
              <p>Los siguientes jugadores tienen la misma cantidad de votos:</p>
              <ul className={styles.tieCandidatesList}>
                {tieBreakData.tieCandidates.map((candidate, index) => (
                  <li key={index} className={styles.tieCandidate}>
                    <strong>{candidate}</strong> - {tieBreakData.votes[candidate]} votos
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.tieBreakDecision}>
              <h3>¿A quién eliges como intendente?</h3>
              <div className={styles.tieBreakButtons}>
                {tieBreakData.tieCandidates.map((candidate, index) => (
                  <Button
                    key={index}
                    className={styles.tieBreakBtn}
                    onClick={() => decideTieBreak(candidate)}
                    title={`Elegir a ${candidate}`}
                  />
                ))}
              </div>
            </div>

            <div className={styles.tieBreakNote}>
              <p>Tu decisión es final y determinará al intendente.</p>
            </div>
          </div>
        )}

        {type === "lynch" && (
          <div className={styles.lynch}>
            <Button className={styles.close} onClick={onClose} title="✕" />
            <>
              <h2>🔨 Votación de Linchamiento</h2>
              <p>¡El pueblo debe decidir a quién linchar! Analicen las pistas y voten democráticamente.</p>
              <br />

              {lynchedPlayer ? (
                <div className={styles.lynchResult}>
                  <h3>🔨 ¡Jugador Linchado!</h3>
                  <p><strong>{lynchedPlayer}</strong> ha sido linchado por el pueblo.</p>
                  <p>El modal se cerrará automáticamente...</p>
                </div>
              ) : (
                <>
                  <p>¿A quién votas para linchar?</p>
                  {hasVotedForLynch && (
                    <p className={styles.voteConfirmed}> ✅ Ya votaste. Esperando a los demás jugadores...</p>
                  )}

                  <section className={styles.playersSection}>
                    <h4>Jugadores Vivos ({players.filter(p => p.isAlive).length}):</h4>
                    <ul>
                      {players
                        .filter(player => player.isAlive)
                        .map((player, index) => (
                          <li className={styles.playerItem} key={index}>
                            <Button
                              onClick={() => voteLynch(player.username)}
                              title={`${player.username} ${player.lynchVotes ? `(${player.lynchVotes} votos)` : ''}`}
                              disabled={hasVotedForLynch || lynchedPlayer}
                            />
                          </li>
                        ))
                      }
                    </ul>
                  </section>

                  <div className={styles.voteStatus}>
                    <p>Jugadores vivos que ya votaron: {
                      players.filter(p => p.isAlive && p.lynchVotes > 0).length
                    } de {
                        players.filter(p => p.isAlive).length
                      }</p>
                  </div>
                </>
              )}
            </>
          </div>
        )}

        {type === "lynchTieBreak" && (
          <div className={styles.lynchTieBreak}>
            <div className={styles.lynchTieBreakHeader}>
              <h2>🔨 ¡EMPATE EN LINCHAMIENTO!</h2>
              <p>Como intendente, debes decidir a quién linchar</p>
            </div>

            <div className={styles.lynchTieBreakInfo}>
              <p>Los siguientes jugadores tienen la misma cantidad de votos:</p>
              <ul className={styles.lynchTieCandidatesList}>
                {lynchTieBreakData && lynchTieBreakData.tieCandidates &&
                  lynchTieBreakData.tieCandidates.map((candidate, index) => (
                    <li key={index} className={styles.lynchTieCandidate}>
                      <strong>{candidate}</strong> - {lynchTieBreakData.votes[candidate]} votos
                    </li>
                  ))
                }
              </ul>
            </div>

            <div className={styles.lynchTieBreakDecision}>
              <h3>¿A quién eliges linchar?</h3>
              <div className={styles.lynchTieBreakButtons}>
                {lynchTieBreakData && lynchTieBreakData.tieCandidates &&
                  lynchTieBreakData.tieCandidates.map((candidate, index) => (
                    <Button
                      key={index}
                      className={styles.lynchTieBreakBtn}
                      onClick={() => {
                        console.log(`🔨 Intendente decide linchar a: ${candidate}`);
                        decideLynchTieBreak(candidate);
                      }}
                      title={`Linchar a ${candidate}`}
                    />
                  ))
                }
              </div>
            </div>

            <div className={styles.lynchTieBreakNote}>
              <p>⚠️ Tu decisión es final y determinará a quién se lincha.</p>
            </div>
          </div>
        )}

        {type === "successor" && (
          <div
            className={styles.overlaySuccessor}
            style={{ zIndex: 10000 }}
            onMouseDown={handleOverlayMouseDown}
            onClick={handleOverlayClick}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.close} onClick={onClose}>✕</button>

              <div className={styles.successor}>
                <div className={styles.successorHeader}>
                  <h2>¡Has Muerto como Intendente!</h2>
                  <p>Tienes el honor de elegir a tu sucesor</p>
                </div>

                <div className={styles.successorInfo}>
                  <p>Como intendente caído en servicio, debes elegir quién tomará tu puesto:</p>
                  <div className={styles.timerInfo}>
                    <p>Tienes 30 segundos para elegir, o el sistema elegirá por ti</p>
                  </div>
                </div>

                <div className={styles.successorDecision}>
                  <h3>¿A quién eliges como nuevo intendente?</h3>
                  <div className={styles.successorButtons}>
                    {successorCandidates.map((candidate, index) => (
                      <Button
                        key={index}
                        className={styles.successorBtn}
                        onClick={() => chooseSuccessor(candidate)}
                        title={`Elegir a ${candidate}`}
                      />
                    ))}
                  </div>
                </div>

                <div className={styles.successorNote}>
                  <p>Tu elección es final. El nuevo intendente tendrá el poder del Plan Platita.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === "nightKill" && (
          <div className={styles.nightKill}>
            <h2>Votación Nocturna</h2>
            <p>Como lobizón, debes elegir a quién atacar esta noche.</p>
            <br />

            {nightVictim ? (
              <div className={styles.nightResult}>
                <h3>Víctima Elegida</h3>
                <p><strong>{nightVictim}</strong> será atacado.</p>
                <p>Esperando a que amanezca...</p>
              </div>
            ) : (
              <>
                <p>¿A quién quieres atacar?</p>
                {hasVotedNight && (
                  <p className={styles.voteConfirmed}>Ya votaste. Esperando a los demás lobizones...</p>
                )}
                <section className={styles.playersSection}>
                  <ul>
                    {players.map((player, index) => (
                      <li className={styles.playerItem} key={index}>
                        <Button
                          onClick={() => voteNightKill(player.username)}
                          title={`${player.username} ${player.nightVotes ? `(${player.nightVotes} votos)` : ''}`}
                          disabled={hasVotedNight || nightVictim || !player.isAlive}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
                <div className={styles.voteStatus}>
                  <p>Lobizones que ya votaron: {
                    players.filter(p => p.nightVotes > 0 && (p.role === 'lobizon' || p.role === 'lobizón') && p.isAlive).length
                  } de {
                      players.filter(p => (p.role === 'lobizon' || p.role === 'lobizón') && p.isAlive).length
                    }</p>
                </div>
              </>
            )}
          </div>
        )}

        {type === "nightTieBreak" && (
          <div className={styles.nightTieBreak}>
            <div className={styles.nightTieBreakHeader}>
              <h2>¡EMPATE NOCTURNO!</h2>
              <p>Debes revotar entre los jugadores empatados</p>
            </div>

            <div className={styles.nightTieBreakInfo}>
              <p>Los siguientes jugadores tienen la misma cantidad de votos:</p>
              <ul className={styles.nightTieCandidatesList}>
                {nightTieBreakData.tieCandidates.map((candidate, index) => (
                  <li key={index} className={styles.nightTieCandidate}>
                    <strong>{candidate}</strong> - {nightTieBreakData.votes[candidate]} votos
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.nightTieBreakDecision}>
              <h3>¿A quién eliges atacar?</h3>
              <div className={styles.nightTieBreakButtons}>
                {nightTieBreakData.tieCandidates.map((candidate, index) => (
                  <Button
                    key={index}
                    className={styles.nightTieBreakBtn}
                    onClick={() => voteNightTieBreak(candidate)}
                    title={`Atacar a ${candidate}`}
                  />
                ))}
              </div>
            </div>

            <div className={styles.nightTieBreakNote}>
              <p>En caso de nuevo empate, se elegirá al primero alfabéticamente.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );


}