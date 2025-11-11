const express = require('express');
const session = require('express-session');
var bodyParser = require('body-parser');
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');
const http = require('http');
const { Server } = require('socket.io');

var app = express();
var port = process.env.PORT || 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006", "http://localhost:3007"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

const sessionMiddleware = session({
  secret: "clave-secreta",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
});

app.use(sessionMiddleware);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006", "http://localhost:3007"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

const gameStates = {
  INICIO: "inicio",
  NOCHE_LOBIZONES: "noche_lobizones",
  NOCHE_ESPECIALES: "noche_especiales",
  DIA_DEBATE: "dia_debate",
  DIA_VOTACION: "dia_votacion",
  FINALIZADO: "finalizado"
};

// Array para almacenar salas en memoria
const rooms = [];

// Helper functions
function assignRoles(room) {
  const availableRoles = [
    'lobizon', 'lobizon', 'lobizon',
    'conurbanense', 'conurbanense', 'conurbanense',
    'palermitano', 'palermitano', 'palermitano'
  ].slice(0, room.players.length);

  availableRoles.sort(() => Math.random() - 0.5);

  const updatedPlayers = room.players.map((player, index) => ({
    ...player,
    role: availableRoles[index],
    isAlive: true,
    votesReceived: 0,
    wasProtected: false
  }));

  console.log("Roles asignados:", updatedPlayers.map(j => ({ username: j.username, role: j.role })));
  return {
    ...room,
    players: updatedPlayers,
    assignedRoles: true
  };
}

function checkWinner(room) {
  const lobizonesAlive = room.players.filter(j =>
    j.role === 'lobizon' && j.isAlive
  );
  const aliveVillagers = room.players.filter(j =>
    j.role !== 'lobizon' && j.isAlive
  );

  if (lobizonesAlive.length === 0) {
    return {
      winner: 'aldeanos',
      message: '¡Los aldeanos han ganado!'
    };
  } else if (lobizonesAlive.length >= aliveVillagers.length) {
    return {
      winner: 'lobizones',
      message: '¡Los lobizones han ganado!'
    };
  }
  return null;
}

function countVotes(votes) {
  const count = {};
  Object.values(votes).forEach(socketId => {
    count[socketId] = (count[socketId] || 0) + 1;
  });
  return count;
}

app.get('/', function (req, res) {
  res.status(200).send({
    message: 'GET Home route working fine!'
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/verifyUser", async (req, res) => {
  try {
    const { username, password, alreadyLogged } = req.query;

    if (alreadyLogged === 'true') {
      return res.send({
        message: "Ya hay una sesión iniciada con este usuario"
      });
    } else {
      const check = await realizarQuery(
        `SELECT * FROM Users WHERE username = ? AND password = ? `, [username, password]);

      if (check.length > 0) {
        req.session.username = username;

        return res.send({
          message: "ok",
          username,
          id: check[0].id
        });
      } else {
        return res.send({
          message: "Usuario o contraseña incorrectos"
        });
      }
    }
  } catch (error) {
    res.send(error);
  }
});

// Obtener salas activas
app.get("/getSalas", async (req, res) => {
  try {
    const salas = await realizarQuery(
      `SELECT id, code, status, village_won FROM Games WHERE status = true`
    );
    console.log("Salas activas desde BD:", salas);
    res.json({ success: true, salas: salas });
  } catch (error) {
    console.error(" Error en /getSalas:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de prueba para verificar la BD
app.get("/test-db", async (req, res) => {
  try {
    const test = await realizarQuery("SELECT 1 as test");
    console.log(" Test BD exitoso:", test);
    res.json({ success: true, message: "Conexión a BD OK", data: test });
  } catch (error) {
    console.error("Test BD falló:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/debug-tabla", async (req, res) => {
  try {
    const estructura = await realizarQuery("DESCRIBE Games");
    console.log("Estructura de tabla Games:", estructura);
    res.json({ success: true, estructura: estructura });
  } catch (error) {
    console.error("Error obteniendo estructura:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear sala en la BD
app.post("/crearSalaBD", async (req, res) => {
  try {
    const { code, host, maxPlayers } = req.body;

    console.log(" Creando sala en BD - Datos recibidos:", {
      code,
      host,
      maxPlayers
    });

    // Obtener el ID del usuario desde la base de datos
    const usuario = await realizarQuery(
      `SELECT id FROM Users WHERE username = ?`,
      [host]
    );

    if (usuario.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const userId = usuario[0].id;

    // Verificar si ya existe una sala ACTIVA con ese código
    const salaExistente = await realizarQuery(
      `SELECT code FROM Games WHERE code = ? AND status = true`,
      [code]
    );

    if (salaExistente.length > 0) {
      return res.status(409).json({
        success: false,
        message: "El código de sala ya está en uso"
      });
    }

    // Insertar nueva sala SIN max_players
    const result = await realizarQuery(
      `INSERT INTO Games (code, village_won, status) 
       VALUES (?, ?, true)`,
      [code, userId]
    );

    console.log(" Sala creada exitosamente en BD, ID:", result.insertId);

    res.json({
      success: true,
      message: "Sala creada exitosamente",
      salaId: result.insertId
    });

  } catch (error) {
    console.error(" Error en /crearSalaBD:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: "Error interno del servidor al crear la sala"
    });
  }
});

// Verificar si una sala existe
app.get("/verifyRoom/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const sala = await realizarQuery(
      `SELECT id, code, village_won, status FROM Games 
       WHERE code = ? AND status = true`,
      [code]
    );

    if (sala.length === 0) {
      return res.json({
        success: false,
        exists: false,
        message: "No existe una sala activa con ese código"
      });
    }

    res.json({
      success: true,
      exists: true,
      sala: sala[0]
    });

  } catch (error) {
    console.error(" Error en /verifyRoom:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cerrar sala
app.post("/cerrarSala", async (req, res) => {
  try {
    const { code } = req.body;

    await realizarQuery(
      `UPDATE Games SET status = false WHERE code = ?`,
      [code]
    );

    console.log("Sala cerrada en BD:", code);
    res.json({ success: true, message: "Sala cerrada exitosamente" });

  } catch (error) {
    console.error(" Error en /cerrarSala:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/regUser", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(" Datos recibidos:", username, password);

    if (!username || !password) {
      return res.status(400).send({ message: "Por favor complete todos los campos" });
    }

    console.log(" Verificando si el usuario existe...");
    const check = await realizarQuery("SELECT * FROM Users WHERE username = ?", [username]);
    console.log(" Resultado del SELECT:", check);

    if (check.length > 0) {
      return res.status(409).send({ message: "El nombre de usuario ya está registrado" });
    }

    console.log("Insertando nuevo usuario...");
    const insertResult = await realizarQuery("INSERT INTO Users (username, password, photo, score) VALUES (?, ?,?,?)", [username, password, null, 0]);
    console.log("Resultado del INSERT:", insertResult);

    const nuevo = await realizarQuery("SELECT * FROM Users WHERE username = ?", [username]);
    req.session.username = username;
    return res.send({
      message: "ok",
      username,
      id: nuevo[0].id
    });

  } catch (error) {
    console.error("Error en /regUser:", error);
    return res.status(500).send({
      message: "Error al registrar usuario",
      error: error.message || error
    });
  }
});

app.get('/getRanking', async function (req, res) {
  try {
    let response = await realizarQuery(`SELECT username, score FROM Users `)
    res.send({
      response
    });
  } catch (error) {
    res.send({ mensaje: "Tuviste un error", error: error.message });
  }
})

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Error al cerrar sesión");
    }
    res.send("Sesión cerrada exitosamente");
  });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(" Nuevo usuario conectado:", socket.id);

  // Crear sala - Mantener compatibilidad con frontend
  socket.on("crearSala", async ({ code, host, maxPlayers }) => {
    try {
      console.log(" Socket: Intentando crear sala:", { code, host, maxPlayers });

      // Verificar si ya existe en memoria
      const existingRoom = rooms.find(r => r.code === code && r.active);

      if (existingRoom) {
        socket.emit("roomError", "El código ya está en uso en este momento");
        return;
      }

      // Buscar la sala en BD para verificar que fue creada por HTTP
      const roomDB = await realizarQuery(
        `SELECT id, code, village_won FROM Games WHERE code = ? AND status = true`,
        [code]
      );

      if (roomDB.length === 0) {
        socket.emit("roomError", "Primero debes crear la sala desde el formulario");
        return;
      }

      // Obtener el username del anfitrión desde la BD
      const hostUser = await realizarQuery(
        `SELECT username FROM Users WHERE id = ?`,
        [roomDB[0].village_won]
      );

      const hostUsername = hostUser.length > 0 ? hostUser[0].username : host;

      const newRoom = {
        code: code,
        host: hostUsername,
        hostSocketId: socket.id,
        maxPlayers: parseInt(maxPlayers) || 6,
        players: [{
          id: socket.id,
          username: hostUsername,
          socketId: socket.id,
          isHost: true,
          role: null,
          isAlive: true,
          votesReceived: 0,
          wasProtected: false
        }],
        state: gameStates.INICIO,
        round: 1,
        assignedRoles: false,
        lobizonesVotes: {},
        lynchVotes: {},
        mayor: null,
        lastVictim: null,
        winner: null,
        active: true,
        createdInDB: true
      };

      rooms.push(newRoom);
      socket.join(code);

      socket.currentRoom = code;
      socket.isHost = true;
      socket.username = hostUsername;

      console.log("Sala activada en memoria para:", hostUsername);
      console.log("Jugadores en sala:", newRoom.players);

      // Enviar la lista de jugadores a TODOS en la sala
      io.to(code).emit("usersInRoom", newRoom.players);

    } catch (error) {
      console.error(" Error creando sala en socket:", error);
      socket.emit("roomError", "Error interno del servidor");
    }
  });

  // Unirse a sala
  socket.on("joinRoom", async ({ code, username }) => {
    try {
      console.log(" Socket: Intentando unirse a sala:", { code, username });

      // Verificar en BD si la sala existe y está activa
      const roomDB = await realizarQuery(
        `SELECT id, code, village_won FROM Games WHERE code = ? AND status = true`,
        [code]
      );

      if (roomDB.length === 0) {
        socket.emit("roomError", "No existe una sala activa con ese código");
        return;
      }

      // Buscar en memoria
      let room = rooms.find(r => r.code === code && r.active); // Cambiado de "sala" a "room"

      if (!room) {
        // Si no está en memoria pero sí en BD, crear en memoria
        const hostUser = await realizarQuery(
          `SELECT username FROM Users WHERE id = ?`,
          [roomDB[0].village_won]
        );

        const hostUsername = hostUser.length > 0 ? hostUser[0].username : "Anfitrión";

        room = {
          code: code,
          host: hostUsername,
          hostSocketId: null,
          maxPlayers: 6,
          players: [],
          state: gameStates.INICIO,
          round: 1,
          assignedRoles: false,
          lobizonesVotes: {},
          lynchVotes: {},
          mayor: null,
          lastVictim: null,
          winner: null,
          active: true,
          createdInDB: true
        };
        rooms.push(room);
      }

      // Verificar si el jugador ya está en la sala
      if (room.players.find(p => p.username === username)) {
        socket.emit("roomError", "Ya estás en esta sala");
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit("roomError", "La sala está llena");
        return;
      }

      // Unir al jugador
      const newPlayer = {
        id: socket.id,
        username: username,
        socketId: socket.id,
        isHost: (username === room.host && !room.hostSocketId),
        role: null,
        isAlive: true,
        votesReceived: 0,
        wasProtected: false
      };

      room.players.push(newPlayer);

      // Si es el anfitrión reconectándose, actualizar su socket ID
      if (username === room.host && !room.hostSocketId) {
        room.hostSocketId = socket.id;
        newPlayer.isHost = true;
        console.log("Anfitrión reconectado:", username);
      }

      socket.join(code);
      socket.currentRoom = code;
      socket.isHost = newPlayer.isHost;
      socket.username = username;

      console.log("Usuario unido exitosamente:", username);
      io.to(code).emit("usersInRoom", room.players);

    } catch (error) {
      console.error(" Error uniéndose a sala:", error);
      socket.emit("roomError", "Error interno del servidor");
    }
  });

  // Iniciar juego - VERSIÓN CORREGIDA
  socket.on("startGame", ({ code }) => {
    try {
      console.log(" INTENTANDO INICIAR JUEGO EN SALA:", code);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      // Verificar que el que inicia es el anfitrión
      if (socket.id !== room.hostSocketId) {
        socket.emit("roomError", "Solo el anfitrión puede iniciar el juego");
        return;
      }

      // Verificar cantidad mínima de jugadores
      if (room.players.length < 2) {
        socket.emit("roomError", "Se necesitan al menos 2 jugadores para iniciar");
        return;
      }

      console.log(" ASIGNANDO ROLES...");
      // Asignar roles
      const roomWithRoles = assignRoles(room);

      // Actualizar la sala en memoria
      Object.assign(room, roomWithRoles);
      room.assignedRoles = true;
      room.state = gameStates.INICIO;

      console.log(" JUEGO INICIADO - Emitiendo gameStarted a todos los jugadores");
      console.log(" Jugadores en la sala:", room.players.map(p => p.username));

      // ¡ESTA ES LA LÍNEA CRÍTICA QUE FALTABA!
      // Emitir a TODOS los jugadores de la sala
      io.to(code).emit("gameStarted", {
        message: "El juego ha comenzado",
        players: room.players,
        roomState: room.state,
        roomCode: code
      });

      console.log(" EVENTO gameStarted ENVIADO A TODOS LOS JUGADORES");

    } catch (error) {
      console.error(" Error iniciando juego:", error);
      socket.emit("roomError", "Error al iniciar el juego");
    }
  });

  // Unirse a GameRoom 
  socket.on("joinGameRoom", ({ code }) => {
    try {
      console.log("Jugador uniéndose a GameRoom:", socket.username, code);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe o el juego terminó");
        return;
      }

      // Unir al socket a la sala
      socket.join(code);
      socket.currentRoom = code;

      // Enviar el estado actual de la sala
      socket.emit("updatedRoom", room);

    } catch (error) {
      console.error("Error en joinGameRoom:", error);
      socket.emit("roomError", "Error al unirse a la sala de juego");
    }
  });

  socket.on("getRoomState", ({ code }) => {
    try {
      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      // Enviar el estado actual de la sala
      socket.emit("updatedRoom", room);

    } catch (error) {
      console.error("Error en getRoomState:", error);
      socket.emit("roomError", "Error al obtener el estado de la sala");
    }
  });

  // Cerrar sala
  socket.on("closeRoom", async ({ code }) => {
    try {
      console.log(" Cerrando sala:", code);

      // Marcar como inactiva en BD
      await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [code]);

      // Eliminar de memoria
      const index = rooms.findIndex(r => r.code === code);
      if (index !== -1) {
        rooms.splice(index, 1);
      }

      // Notificar a todos los jugadores
      io.to(code).emit("closedRoom", "El anfitrión cerró la sala");
      io.in(code).socketsLeave(code);

      console.log("Sala cerrada completamente:", code);

    } catch (error) {
      console.error(" Error cerrando sala:", error);
    }
  });

  // Abandonar sala 
  socket.on("leaveRoom", async ({ code }) => {
    try {
      const room = rooms.find(r => r.code === code && r.active);
      if (!room) return;

      // Remover jugador de la sala en memoria
      room.players = room.players.filter(p => p.socketId !== socket.id);

      // Si el anfitrión abandona, cerrar la sala
      if (socket.isHost && socket.username === room.host) {
        console.log("Anfitrión abandonó la sala, cerrando...");

        // Marcar como inactiva en BD
        await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [code]);

        // Notificar a otros jugadores
        io.to(code).emit("closedRoom", "El anfitrión abandonó la sala");
        io.in(code).socketsLeave(code);

        // Eliminar de memoria
        const index = rooms.findIndex(r => r.code === code);
        if (index !== -1) {
          rooms.splice(index, 1);
        }
      } else {
        // Solo actualizar lista de jugadores
        io.to(code).emit("usersInRoom", room.players);
      }

      socket.leave(code);
      console.log("Usuario abandonó sala:", socket.username);

    } catch (error) {
      console.error(" Error abandonando sala:", error);
    }
  });

  // Disconnect
  socket.on("disconnect", async () => {
    console.log("Usuario desconectado:", socket.id, socket.username);

    if (socket.currentRoom && socket.isHost) {
      try {
        const room = rooms.find(r => r.code === socket.currentRoom && r.active);
        if (room) {
          console.log("Anfitrión desconectado, cerrando sala:", socket.currentRoom);

          await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [socket.currentRoom]);

          io.to(socket.currentRoom).emit("closedRoom", "El anfitrión se desconectó");
          io.in(socket.currentRoom).socketsLeave(socket.currentRoom);

          const index = rooms.findIndex(r => r.code === socket.currentRoom);
          if (index !== -1) {
            rooms.splice(index, 1);
          }
        }
      } catch (error) {
        console.error(" Error cerrando sala en desconexión:", error);
      }
    } else if (socket.currentRoom) {
      const room = rooms.find(r => r.code === socket.currentRoom && r.active);
      if (room) {
        room.players = room.players.filter(p => p.socketId !== socket.id);
        io.to(socket.currentRoom).emit("usersInRoom", room.players);
      }
    }
  });

  socket.on("voteMayor", ({ code, voter, candidate }) => {
    try {
      console.log(`🗳️ Voto para intendente recibido: ${voter} -> ${candidate}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      // Verificar que el votante esté en la sala
      const voterPlayer = room.players.find(p => p.username === voter);
      if (!voterPlayer) {
        socket.emit("roomError", "Jugador no encontrado");
        return;
      }

      // Verificar que el candidato esté en la sala
      const candidatePlayer = room.players.find(p => p.username === candidate);
      if (!candidatePlayer) {
        socket.emit("roomError", "Candidato no encontrado");
        return;
      }

      // Inicializar contador de votos si no existe
      if (!room.mayorVotes) {
        room.mayorVotes = {};
      }

      // Verificar si el usuario ya votó
      if (room.mayorVotes[voter]) {
        console.log(`❌ ${voter} intentó votar nuevamente`);
        socket.emit("alreadyVoted", { voter, previousVote: room.mayorVotes[voter] });
        return;
      }

      // Registrar el voto
      room.mayorVotes[voter] = candidate;
      console.log(`✅ Voto registrado: ${voter} votó por ${candidate}`);

      // Confirmar el voto individualmente
      socket.emit("mayorVoteRegistered", {
        voter: voter,
        candidate: candidate
      });

      // Contar votos
      const voteCount = {};
      Object.values(room.mayorVotes).forEach(candidate => {
        voteCount[candidate] = (voteCount[candidate] || 0) + 1;
      });

      console.log("📊 Conteo actual de votos para intendente:", voteCount);

      // Actualizar contadores de votos en los jugadores
      room.players.forEach(player => {
        player.mayorVotes = voteCount[player.username] || 0;
      });

      // Notificar a todos los jugadores sobre la actualización de votos
      io.to(code).emit("mayorVoteUpdate", {
        votes: voteCount,
        totalVotes: Object.keys(room.mayorVotes).length,
        totalPlayers: room.players.length,
        recentVote: { voter, candidate }
      });

      // Mostrar en consola del servidor cada voto individual
      console.log("--- VOTOS INDIVIDUALES REGISTRADOS ---");
      Object.entries(room.mayorVotes).forEach(([voter, candidate]) => {
        console.log(`   ${voter} -> ${candidate}`);
      });
      console.log("--------------------------------------");

      // Verificar si todos han votado
      if (Object.keys(room.mayorVotes).length === room.players.length) {
        console.log("🎯 Todos han votado, eligiendo intendente...");

        // Encontrar al candidato con más votos
        let maxVotes = 0;
        let electedMayor = null;
        let tieCandidates = [];

        Object.entries(voteCount).forEach(([candidate, votes]) => {
          if (votes > maxVotes) {
            maxVotes = votes;
            electedMayor = candidate;
            tieCandidates = [candidate];
          } else if (votes === maxVotes) {
            tieCandidates.push(candidate);
          }
        });

        // Manejar empate: el anfitrión decide
        if (tieCandidates.length > 1) {
          console.log(`🤝 Empate entre: ${tieCandidates.join(', ')}`);
          console.log(`👑 El anfitrión ${room.host} decide el desempate`);
          // Por simplicidad, elegimos al primero de la lista
          electedMayor = tieCandidates[0];
          console.log(`✅ Desempate: ${electedMayor} es el intendente`);
        }

        if (electedMayor) {
          room.mayor = electedMayor;

          // Marcar al jugador como intendente
          room.players.forEach(player => {
            player.isMayor = player.username === electedMayor;
          });

          console.log(`🎉 INTENDENTE ELECTO: ${electedMayor} con ${maxVotes} votos`);

          // Notificar a todos
          io.to(code).emit("mayorElected", {
            mayor: electedMayor,
            votes: maxVotes,
            totalVoters: room.players.length
          });

          // Crear instancia de Intendente
          const mayorPlayer = room.players.find(p => p.username === electedMayor);
          if (mayorPlayer) {
            console.log(`🎊 ${electedMayor} (${mayorPlayer.role}) es ahora el Intendente`);
            console.log("💡 Habilidades disponibles: Plan Platita y romper empates");
          }
        }
      }

    } catch (error) {
      console.error("❌ Error en voteMayor:", error);
      socket.emit("roomError", "Error al procesar el voto");
    }
  });

  socket.on("voteLynch", ({ code, voter, candidate }) => {
    try {
        console.log(`🔪 Voto para linchamiento recibido: ${voter} -> ${candidate}`);

        const room = rooms.find(r => r.code === code && r.active);
        if (!room) {
            socket.emit("roomError", "La sala no existe");
            return;
        }

        // Verificar que el votante esté en la sala
        const voterPlayer = room.players.find(p => p.username === voter);
        if (!voterPlayer) {
            socket.emit("roomError", "Jugador no encontrado");
            return;
        }

        // Verificar que el votante esté vivo
        if (!voterPlayer.isAlive) {
            socket.emit("roomError", "No puedes votar si estás muerto");
            return;
        }

        // Verificar que el candidato esté en la sala
        const candidatePlayer = room.players.find(p => p.username === candidate);
        if (!candidatePlayer) {
            socket.emit("roomError", "Candidato no encontrado");
            return;
        }

        // Verificar que el candidato esté vivo
        if (!candidatePlayer.isAlive) {
            socket.emit("roomError", "No puedes votar por alguien que ya está muerto");
            return;
        }

        // Inicializar contador de votos si no existe
        if (!room.lynchVotes) {
            room.lynchVotes = {};
        }

        // Verificar si el usuario ya votó
        if (room.lynchVotes[voter]) {
            console.log(`❌ ${voter} intentó votar nuevamente para linchar`);
            socket.emit("alreadyVotedLynch", { 
                voter: voter, 
                previousVote: room.lynchVotes[voter] 
            });
            return;
        }

        // Registrar el voto
        room.lynchVotes[voter] = candidate;
        console.log(`✅ Voto de linchamiento registrado: ${voter} -> ${candidate}`);

        // Confirmar el voto individualmente
        socket.emit("lynchVoteRegistered", {
            voter: voter,
            candidate: candidate
        });

        // Contar votos
        const voteCount = {};
        Object.values(room.lynchVotes).forEach(votedCandidate => {
            voteCount[votedCandidate] = (voteCount[votedCandidate] || 0) + 1;
        });

        console.log("📊 Conteo actual de votos para linchamiento:", voteCount);

        // Actualizar contadores de votos en los jugadores
        room.players.forEach(player => {
            player.lynchVotes = voteCount[player.username] || 0;
        });

        // Notificar a todos los jugadores sobre la actualización de votos
        io.to(code).emit("lynchVoteUpdate", {
            votes: voteCount,
            totalVotes: Object.keys(room.lynchVotes).length,
            totalPlayers: room.players.filter(p => p.isAlive).length,
            recentVote: { voter, candidate }
        });

        // Mostrar en consola del servidor cada voto individual
        console.log("--- VOTOS DE LINCHAMIENTO REGISTRADOS ---");
        Object.entries(room.lynchVotes).forEach(([voterName, candidateName]) => {
            console.log(`   ${voterName} -> ${candidateName}`);
        });
        console.log("--------------------------------------");

        // Verificar si todos los vivos han votado
        const alivePlayers = room.players.filter(p => p.isAlive);
        const votersCount = Object.keys(room.lynchVotes).length;
        
        console.log(`Jugadores vivos: ${alivePlayers.length}, Votantes: ${votersCount}`);

        if (votersCount === alivePlayers.length) {
            console.log("🎯 Todos los jugadores vivos han votado, determinando linchamiento...");
            
            // Encontrar al candidato con más votos
            let maxVotes = 0;
            let electedLynch = null;
            let tieCandidates = [];
            
            Object.entries(voteCount).forEach(([candidateName, votes]) => {
                if (votes > maxVotes) {
                    maxVotes = votes;
                    electedLynch = candidateName;
                    tieCandidates = [candidateName];
                } else if (votes === maxVotes) {
                    tieCandidates.push(candidateName);
                }
            });

            // Manejar empate: el intendente decide
            if (tieCandidates.length > 1) {
                console.log(`🤝 Empate en linchamiento entre: ${tieCandidates.join(', ')}`);
                if (room.mayor) {
                    console.log(`👑 El intendente ${room.mayor} decide el desempate`);
                    // Por simplicidad, elegimos al primero de la lista
                    electedLynch = tieCandidates[0];
                    console.log(`✅ Desempate: ${electedLynch} será linchado`);
                } else {
                    // Si no hay intendente, no hay linchamiento
                    console.log("❌ Empate sin intendente, no hay linchamiento");
                    electedLynch = null;
                }
            }

            if (electedLynch) {
                // Marcar al jugador como muerto
                const playerToLynch = room.players.find(p => p.username === electedLynch);
                if (playerToLynch) {
                    playerToLynch.isAlive = false;
                    playerToLynch.wasLynched = true;
                    console.log(`💀 JUGADOR LINCHADO: ${electedLynch} con ${maxVotes} votos`);

                    // Notificar a todos
                    io.to(code).emit("playerLynched", {
                        lynchedPlayer: electedLynch,
                        votes: maxVotes,
                        totalVoters: alivePlayers.length
                    });

                    // Verificar si hay un ganador después del linchamiento
                    const winner = checkWinner(room);
                    if (winner) {
                        console.log(`🏆 ${winner.winner} ganan: ${winner.message}`);
                        io.to(code).emit("gameEnded", winner);
                    }
                }
            } else {
                console.log("❌ No se pudo determinar un jugador para linchar");
            }

            // Limpiar votos para la próxima ronda
            room.lynchVotes = {};
        }

    } catch (error) {
        console.error("❌ Error en voteLynch:", error);
        socket.emit("roomError", "Error al procesar el voto de linchamiento: " + error.message);
    }
});
});



// Limpiar salas sin anfitrión
setInterval(async () => {
  try {
    const activeRoomsDB = await realizarQuery(`SELECT code FROM Games WHERE status = true`);

    for (const roomDB of activeRoomsDB) {
      const roomInMemory = rooms.find(r => r.code === roomDB.code && r.active);
      if (!roomInMemory) {
        await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [roomDB.code]);
        console.log("Sala huérfana limpiada:", roomDB.code);
      }
    }
  } catch (error) {
    console.error(" Error en limpieza automática:", error);
  }
}, 5 * 60 * 1000);

server.listen(port, function () {
  console.log(` Server running at http://localhost:${port}`);
});