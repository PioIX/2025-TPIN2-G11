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

  // Iniciar juego
  socket.on("startGame", ({ code }) => {
    try {
      console.log("Intentando iniciar juego en sala:", code);

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

      // Asignar roles
      const roomWithRoles = assignRoles(room); 
      roomWithRoles.assignedRoles = true; 
      roomWithRoles.state = gameStates.INICIO; 

      console.log("Juego iniciado en sala:", code);
      console.log("Roles asignados:", roomWithRoles.players.map(p => ({ username: p.username, role: p.role })));

      // Emitir a TODOS los jugadores de la sala
      io.to(code).emit("gameStarted", roomWithRoles); 
      io.to(code).emit("updatedRoom", roomWithRoles); 

    } catch (error) {
      console.error("Error iniciando juego:", error);
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

  // Votar intendente
  socket.on("voteMayor", ({ code, candidateSocketId }) => { 
    try {
      const room = rooms.find(r => r.code === code && r.active);
      if (!room) return;

      const candidate = room.players.find(p => p.socketId === candidateSocketId); 
      if (!candidate || !candidate.isAlive) return; 

      // Asignar intendente
      room.mayor = candidate.username; 
      room.state = gameStates.NOCHE_LOBIZONES; 

      console.log(`${candidate.username} elegido como intendente`);

      // Notificar a todos
      io.to(code).emit("changingState", { 
        state: room.state, 
        mayor: room.mayor 
      });
      io.to(code).emit("updatedRoom", room); 

    } catch (error) {
      console.error("Error en voteMayor:", error);
      socket.emit("roomError", "Error al votar intendente"); 
    }
  });

  // Votar víctima (lobizones) 
  socket.on("voteVictim", ({ code, victimSocketId }) => { 
    try {
      const room = rooms.find(r => r.code === code && r.active); 
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id); 
      if (!player || player.role !== 'lobizon' || !player.isAlive) return; 

      const victim = room.players.find(p => p.socketId === victimSocketId); 
      if (!victim || !victim.isAlive || victim.role === 'lobizon') return; 

      // Registrar voto
      room.lobizonesVotes[socket.id] = victimSocketId;

      console.log(`${player.username} votó por ${victim.username}`);

      // Verificar si todos los lobizones han votado
      const lobizonesAlive = room.players.filter(p =>
        p.role === 'lobizon' && p.isAlive 
      );
      const lobizonesWhoVoted = Object.keys(room.lobizonesVotes); 

      if (lobizonesWhoVoted.length === lobizonesAlive.length) {
        // Contar votos
        const voteCount = countVotes(room.lobizonesVotes); 
        let maxVotes = 0;
        let chosenVictimSocketId = null;

        Object.entries(voteCount).forEach(([socketId, votes]) => {
          if (votes > maxVotes) {
            maxVotes = votes;
            chosenVictimSocketId = socketId;
          }
        });

        if (chosenVictimSocketId) {
          const chosenVictim = room.players.find(p => p.socketId === chosenVictimSocketId); 
          if (chosenVictim && !chosenVictim.wasProtected) { 
            chosenVictim.isAlive = false; 
            room.lastVictim = chosenVictim.username; 
            console.log(` ${chosenVictim.username} fue atacado por los lobizones`);

            // Verificar si hay ganador
            const winnerResult = checkWinner(room); 
            if (winnerResult) {
              room.winner = winnerResult.winner; 
              room.state = gameStates.FINALIZADO; 

              io.to(code).emit("gameFinished", { 
                winner: winnerResult.winner,
                message: winnerResult.message
              });
            } else {
              room.state = gameStates.DIA_DEBATE;
            }

            // Limpiar votos para la siguiente ronda
            room.lobizonesVotes = {}; 
          }
        }

        // Notificar a todos
        io.to(code).emit("updatedRoom", room);
        io.to(code).emit("changingState", { state: room.state }); 
      }

    } catch (error) {
      console.error("Error en voteVictim:", error);
      socket.emit("roomError", "Error al votar víctima"); 
    }
  });

  // Votar linchamiento (día)
  socket.on("voteLynch", ({ code, accusedSocketId }) => { 
    try {
      const room = rooms.find(r => r.code === code && r.active); 
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player || !player.isAlive) return; 

      const accused = room.players.find(p => p.socketId === accusedSocketId); 
      if (!accused || !accused.isAlive) return; 

      // Registrar voto
      room.lynchVotes[socket.id] = accusedSocketId; 

      console.log(`${player.username} votó por linchar a ${accused.username}`);

      // Verificar si todos los vivos han votado
      const alivePlayers = room.players.filter(p => p.isAlive); 
      const playersWhoVoted = Object.keys(room.lynchVotes); 

      if (playersWhoVoted.length === alivePlayers.length) {
        // Contar votos
        const voteCount = countVotes(room.lynchVotes); 
        let maxVotes = 0;
        let lynchedSocketId = null; 

        Object.entries(voteCount).forEach(([socketId, votes]) => {
          if (votes > maxVotes) {
            maxVotes = votes;
            lynchedSocketId = socketId;
          }
        });

        if (lynchedSocketId) {
          const lynched = room.players.find(p => p.socketId === lynchedSocketId);
          if (lynched) {
            lynched.isAlive = false; 
            console.log(` ${lynched.username} fue linchado por la aldea`);

            // Verificar si hay ganador
            const winnerResult = checkWinner(room); 
            if (winnerResult) {
              room.winner = winnerResult.winner; 
              room.state = gameStates.FINALIZADO; 

              io.to(code).emit("gameFinished", { 
                winner: winnerResult.winner,
                message: winnerResult.message
              });
            } else {
              room.state = gameStates.NOCHE_LOBIZONES;
            }

            // Limpiar votos para la siguiente ronda
            room.lynchVotes = {}; 
          }
        }

        // Notificar a todos
        io.to(code).emit("updatedRoom", room); 
        io.to(code).emit("changingState", { state: room.state }); 
      }

    } catch (error) {
      console.error("Error en voteLynch:", error);
      socket.emit("roomError", "Error al votar linchamiento");
    }
  });

  // Avanzar a siguiente fase
  socket.on("nextPhase", ({ code }) => { 
    try {
      const room = rooms.find(r => r.code === code && r.active); 
      if (!room) return;

      // Solo el anfitrión puede avanzar fases
      if (socket.id !== room.hostSocketId) return;

      switch (room.state) { 
        case gameStates.DIA_DEBATE:
          room.state = gameStates.DIA_VOTACION;
          break;
        case gameStates.DIA_VOTACION:
          room.state = gameStates.NOCHE_LOBIZONES;
          break;
        case gameStates.NOCHE_LOBIZONES:
          room.state = gameStates.NOCHE_ESPECIALES;
          break;
        case gameStates.NOCHE_ESPECIALES:
          room.state = gameStates.DIA_DEBATE;
          room.round++;
          break;
      }

      console.log(`🔄 Avanzando a fase: ${room.state}`);
      io.to(code).emit("changingState", { state: room.state }); 
      io.to(code).emit("updatedRoom", room); 

    } catch (error) {
      console.error("Error en nextPhase:", error);
      socket.emit("roomError", "Error al avanzar fase"); 
    }
  });

  // Cerrar sala - Mantener compatibilidad con frontend
  socket.on("closeRoom", async ({ code }) => { // Cambiado de "cerrarSala" a "closeRoom"
    try {
      console.log(" Cerrando sala:", code);

      // Marcar como inactiva en BD
      await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [code]);

      // Eliminar de memoria
      const index = rooms.findIndex(r => r.code === code); // Cambiado de "salas" a "rooms"
      if (index !== -1) {
        rooms.splice(index, 1); // Cambiado de "salas" a "rooms"
      }

      // Notificar a todos los jugadores
      io.to(code).emit("closedRoom", "El anfitrión cerró la sala"); // Cambiado de "salaCerrada" a "closedRoom"
      io.in(code).socketsLeave(code);

      console.log("Sala cerrada completamente:", code);

    } catch (error) {
      console.error(" Error cerrando sala:", error);
    }
  });

  // Abandonar sala - Mantener compatibilidad con frontend
  socket.on("leaveRoom", async ({ code }) => { // Cambiado de "abandonarSala" a "leaveRoom"
    try {
      const room = rooms.find(r => r.code === code && r.active); // Cambiado de "sala" a "room"
      if (!room) return;

      // Remover jugador de la sala en memoria
      room.players = room.players.filter(p => p.socketId !== socket.id); // Cambiado de "jugadores" a "players"

      // Si el anfitrión abandona, cerrar la sala
      if (socket.isHost && socket.username === room.host) { // Cambiado de "esAnfitrion" a "isHost", "anfitrion" a "host"
        console.log("Anfitrión abandonó la sala, cerrando...");

        // Marcar como inactiva en BD
        await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [code]);

        // Notificar a otros jugadores
        io.to(code).emit("closedRoom", "El anfitrión abandonó la sala"); // Cambiado de "salaCerrada" a "closedRoom"
        io.in(code).socketsLeave(code);

        // Eliminar de memoria
        const index = rooms.findIndex(r => r.code === code); // Cambiado de "salas" a "rooms"
        if (index !== -1) {
          rooms.splice(index, 1); // Cambiado de "salas" a "rooms"
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

    if (socket.currentRoom && socket.isHost) { // Cambiado de "salaActual" a "currentRoom", "esAnfitrion" a "isHost"
      try {
        const room = rooms.find(r => r.code === socket.currentRoom && r.active); // Cambiado de "sala" a "room"
        if (room) {
          console.log("Anfitrión desconectado, cerrando sala:", socket.currentRoom);

          await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [socket.currentRoom]);

          io.to(socket.currentRoom).emit("closedRoom", "El anfitrión se desconectó"); // Cambiado de "salaCerrada" a "closedRoom"
          io.in(socket.currentRoom).socketsLeave(socket.currentRoom);

          const index = rooms.findIndex(r => r.code === socket.currentRoom); // Cambiado de "salas" a "rooms"
          if (index !== -1) {
            rooms.splice(index, 1); // Cambiado de "salas" a "rooms"
          }
        }
      } catch (error) {
        console.error(" Error cerrando sala en desconexión:", error);
      }
    } else if (socket.currentRoom) {
      const room = rooms.find(r => r.code === socket.currentRoom && r.active); // Cambiado de "sala" a "room"
      if (room) {
        room.players = room.players.filter(p => p.socketId !== socket.id); // Cambiado de "jugadores" a "players"
        io.to(socket.currentRoom).emit("usersInRoom", room.players);
      }
    }
  });
});

// Limpiar salas sin anfitrión
setInterval(async () => {
  try {
    const activeRoomsDB = await realizarQuery(`SELECT code FROM Games WHERE status = true`); // Cambiado de "salasActivasBD" a "activeRoomsDB"

    for (const roomDB of activeRoomsDB) {
      const roomInMemory = rooms.find(r => r.code === roomDB.code && r.active); // Cambiado de "salaEnMemoria" a "roomInMemory"
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