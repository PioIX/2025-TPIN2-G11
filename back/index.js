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
  origin: ["http://10.211.228.142:3000", "http://10.211.228.142:3001", "http://10.211.228.142:3002", "http://10.211.228.142:3003", "http://10.211.228.142:3004", "http://10.211.228.142:3005", "http://10.211.228.142:3006", "http://10.211.228.142:3007"],
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
    origin: ["http://10.211.228.142:3000", "http://10.211.228.142:3001", "http://10.211.228.142:3002", "http://10.211.228.142:3003", "http://10.211.228.142:3004", "http://10.211.228.142:3005", "http://10.211.228.142:3006", "http://10.211.228.142:3007"],
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

const rooms = [];

// Agregar en index.js después de los otros endpoints
app.get("/redirect", async (req, res) => {
  const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3014, 3015];
  const http = require('http');
  
  const checkPort = (port) => {
    return new Promise((resolve) => {
      const options = {
        hostname: '10.211.228.142',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 1000
      };
      
      const req = http.request(options, (response) => {
        // Si recibimos respuesta, el puerto está en uso
        resolve(true);
      });
      
      req.on('error', (err) => {
        // Si hay error de conexión, el puerto está disponible
        resolve(false);
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  };

  try {
    console.log("🔍 Buscando puerto disponible para redirección...");
    
    for (const port of ports) {
      const isInUse = await checkPort(port);
      console.log(`Puerto ${port}: ${isInUse ? '🟢 En uso' : '🔴 Disponible'}`);
      
      if (!isInUse) {
        console.log(`✅ Redirigiendo al puerto ${port}`);
        return res.redirect(`http://10.211.228.142:${port}`);
      }
    }
    
    // Fallback al primer puerto
    console.log("⚠️  Todos los puertos ocupados, usando 3000");
    res.redirect(`http://10.211.228.142:3000`);
    
  } catch (error) {
    console.error("❌ Error en redirect:", error);
    res.redirect(`http://10.211.228.142:3000`);
  }
});



function assignRandomRoles(players) {
  const shuffledArray = [...players];
  let currentIndex = shuffledArray.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[currentIndex],
    ];
  }

  const roles = [
    "Palermitano", "Palermitano", "Palermitano", "Palermitano",
    "Tarotista", "Lobizón", "Palermitano", "Lobizón",
    "Palermitano", "Tarotista", "Palermitano", "Lobizón",
    "Palermitano", "Palermitano", "Palermitano", "Tarotista"
  ];

  const randomPool = ["Pombero", "Jubilado", "Chamán"];

  if (players.length > 13) {
    randomPool.push("Colectivero");
  }

  const usedRandomRoles = [];

  const playersWithRoles = shuffledArray.map((player, i) => {
    let role = roles[i];

    if (role === "Random1" || role === "Random2") {
      if (randomPool.length === 0) {
        role = "Palermitano";
      } else {
        const randomIndex = Math.floor(Math.random() * randomPool.length);
        role = randomPool[randomIndex];
        usedRandomRoles.push(role);
        randomPool.splice(randomIndex, 1);
      }
    }

    return {
      ...player,
      role: role,
      isAlive: true,
      votesReceived: 0,
      wasProtected: false
    };
  });

  console.log("Roles asignados:", playersWithRoles.map(p => ({
    username: p.username,
    role: p.role
  })));

  return playersWithRoles;
}

function assignRoles(room) {
  const updatedPlayers = assignRandomRoles(room.players);

  console.log("Roles asignados:", updatedPlayers.map(p => ({
    username: p.username,
    role: p.role
  })));

  return {
    ...room,
    players: updatedPlayers,
    assignedRoles: true
  };
}


app.get('/', function (req, res) {
  res.status(200).send({
    message: 'GET Home route working fine!'
  });
});

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

app.post("/crearSalaBD", async (req, res) => {
  try {
    const { code, host, maxPlayers } = req.body;

    console.log("Creando sala en BD - Datos recibidos:", {
      code,
      host,
      maxPlayers
    });

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

    const result = await realizarQuery(
      `INSERT INTO Games (code, host_id, village_won, status, players_amount) 
       VALUES (?, ?, false, true, ?)`,
      [code, userId, maxPlayers] 
    );

    console.log("Sala creada exitosamente en BD, ID:", result.insertId);

    res.json({
      success: true,
      message: "Sala creada exitosamente",
      salaId: result.insertId
    });

  } catch (error) {
    console.error("Error en /crearSalaBD:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: "Error interno del servidor al crear la sala"
    });
  }
});

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

io.on("connection", (socket) => {
  console.log(" Nuevo usuario conectado:", socket.id);

  socket.on("crearSala", async ({ code, host, maxPlayers }) => {
    try {
      console.log(" Socket: Intentando crear sala:", { code, host, maxPlayers });

      const existingRoom = rooms.find(r => r.code === code && r.active);

      if (existingRoom) {
        socket.emit("roomError", "El código ya está en uso en este momento");
        return;
      }
      const roomDB = await realizarQuery(
        `SELECT id, code, status FROM Games WHERE code = ? AND status = true`,
        [code]
      );

      if (roomDB.length === 0) {
        socket.emit("roomError", "Primero debes crear la sala desde el formulario");
        return;
      }

      const hostUsername = host;

      console.log("🔧 Creando sala con host:", hostUsername);

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
        active: true,
        createdInDB: true
      };

      rooms.push(newRoom);
      socket.join(code);

      socket.currentRoom = code;
      socket.isHost = true;
      socket.username = hostUsername;

      console.log(" Sala activada en memoria para:", hostUsername);
      console.log("Jugadores en sala:", newRoom.players);

      io.to(code).emit("usersInRoom", newRoom.players);

    } catch (error) {
      console.error("Error creando sala en socket:", error);
      socket.emit("roomError", "Error interno del servidor");
    }
  });

  socket.on("joinRoom", async ({ code, username }) => {
    try {
      console.log(" Socket: Intentando unirse a sala:", { code, username });

      const roomDB = await realizarQuery(
        `SELECT g.code, u.username as host_username 
       FROM Games g 
       JOIN Users u ON g.host_id = u.id 
       WHERE g.code = ? AND g.status = true`,
        [code]
      );

      if (roomDB.length === 0) {
        socket.emit("roomError", "No existe una sala activa con ese código");
        return;
      }

      let room = rooms.find(r => r.code === code && r.active);

      if (!room) {
        const hostUsername = roomDB[0].host_username;

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
          active: true,
          createdInDB: true
        };
        rooms.push(room);
      }

      if (room.players.find(p => p.username === username)) {
        socket.emit("roomError", "Ya estás en esta sala");
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit("roomError", "La sala está llena");
        return;
      }

      const newPlayer = {
        id: socket.id,
        username: username,
        socketId: socket.id,
        isHost: (username === room.host), 
        role: null,
        isAlive: true,
        votesReceived: 0,
        wasProtected: false
      };

      room.players.push(newPlayer);

      if (username === room.host && !room.hostSocketId) {
        room.hostSocketId = socket.id;
        newPlayer.isHost = true;
        console.log("Host reconectado:", username);
      }

      socket.join(code);
      socket.currentRoom = code;
      socket.isHost = newPlayer.isHost;
      socket.username = username;

      console.log("Usuario unido exitosamente:", username);
      console.log("Jugadores en sala ahora:", room.players.map(p => p.username));

      io.to(code).emit("usersInRoom", room.players);

    } catch (error) {
      console.error("Error uniéndose a sala:", error);
      socket.emit("roomError", "Error interno del servidor");
    }
  });

  socket.on("startGame", ({ code }) => {
    try {
      console.log(" INTENTANDO INICIAR JUEGO EN SALA:", code);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      if (socket.id !== room.hostSocketId) {
        socket.emit("roomError", "Solo el anfitrión puede iniciar el juego");
        return;
      }

      if (room.players.length < 6) {
        socket.emit("roomError", "Se necesitan al menos 6 jugadores para iniciar");
        return;
      }

      console.log(" ASIGNANDO ROLES...");
      const roomWithRoles = assignRoles(room);

      Object.assign(room, roomWithRoles);
      room.assignedRoles = true;
      room.state = gameStates.INICIO;

      console.log(" JUEGO INICIADO - Emitiendo gameStarted a todos los jugadores");
      console.log(" Jugadores en la sala:", room.players.map(p => p.username));

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

  socket.on("joinGameRoom", ({ code }) => {
    try {
      console.log("Jugador uniéndose a GameRoom:", socket.username, code);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe o el juego terminó");
        return;
      }

      socket.join(code);
      socket.currentRoom = code;

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

      socket.emit("updatedRoom", room);

    } catch (error) {
      console.error("Error en getRoomState:", error);
      socket.emit("roomError", "Error al obtener el estado de la sala");
    }
  });

  socket.on("closeRoom", async ({ code }) => {
    try {
      console.log(" Cerrando sala:", code);

      await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [code]);

      const index = rooms.findIndex(r => r.code === code);
      if (index !== -1) {
        rooms.splice(index, 1);
      }

      io.to(code).emit("closedRoom", "El anfitrión cerró la sala");
      io.in(code).socketsLeave(code);

      console.log("Sala cerrada completamente:", code);

    } catch (error) {
      console.error(" Error cerrando sala:", error);
    }
  });

  socket.on("leaveRoom", async ({ code }) => {
    try {
      const room = rooms.find(r => r.code === code && r.active);
      if (!room) return;

      room.players = room.players.filter(p => p.socketId !== socket.id);

      if (socket.isHost && socket.username === room.host) {
        console.log("Anfitrión abandonó la sala, cerrando...");

        await realizarQuery(`UPDATE Games SET status = false WHERE code = ?`, [code]);

        io.to(code).emit("closedRoom", "El anfitrión abandonó la sala");
        io.in(code).socketsLeave(code);

        const index = rooms.findIndex(r => r.code === code);
        if (index !== -1) {
          rooms.splice(index, 1);
        }
      } else {

        io.to(code).emit("usersInRoom", room.players);
      }

      socket.leave(code);
      console.log("Usuario abandonó sala:", socket.username);

    } catch (error) {
      console.error(" Error abandonando sala:", error);
    }
  });

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
      console.log(` Voto para intendente recibido: ${voter} -> ${candidate}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      console.log("DEBUG - Jugadores en sala:", room.players.map(p => ({
        username: p.username,
        isHost: p.isHost,
        socketId: p.socketId
      })));

      const voterPlayer = room.players.find(p =>
        p.username === voter || p.socketId === socket.id
      );

      if (!voterPlayer) {
        console.log("ERROR - Votante no encontrado:", {
          voter,
          socketId: socket.id,
          players: room.players.map(p => p.username)
        });
        socket.emit("roomError", "Jugador no encontrado");
        return;
      }

      const candidatePlayer = room.players.find(p => p.username === candidate);
      if (!candidatePlayer) {
        socket.emit("roomError", "Candidato no encontrado");
        return;
      }

      if (!room.mayorVotes) {
        room.mayorVotes = {};
      }

      if (room.mayorVotes[voter]) {
        console.log(` ${voter} intentó votar nuevamente`);
        socket.emit("alreadyVoted", { voter, previousVote: room.mayorVotes[voter] });
        return;
      }

      room.mayorVotes[voter] = candidate;
      console.log(` Voto registrado: ${voter} votó por ${candidate}`);

      socket.emit("mayorVoteRegistered", {
        voter: voter,
        candidate: candidate
      });

      const voteCount = {};
      Object.values(room.mayorVotes).forEach(candidate => {
        voteCount[candidate] = (voteCount[candidate] || 0) + 1;
      });

      console.log("Conteo actual de votos para intendente:", voteCount);

      room.players.forEach(player => {
        player.mayorVotes = voteCount[player.username] || 0;
      });

      io.to(code).emit("mayorVoteUpdate", {
        votes: voteCount,
        totalVotes: Object.keys(room.mayorVotes).length,
        totalPlayers: room.players.length,
        recentVote: { voter, candidate }
      });

      console.log("--- VOTOS INDIVIDUALES REGISTRADOS ---");
      Object.entries(room.mayorVotes).forEach(([voter, candidate]) => {
        console.log(`   ${voter} -> ${candidate}`);
      });
      console.log("--------------------------------------");

      if (Object.keys(room.mayorVotes).length === room.players.length) {
        console.log(" Todos han votado, eligiendo intendente...");

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

        if (tieCandidates.length > 1) {
          console.log(` Hubo un empate entre: ${tieCandidates.join(', ')}`);

          const hostPlayer = room.players.find(p => p.username === room.host && p.isAlive);
          if (hostPlayer && hostPlayer.socketId) {
            console.log(` Solicitando desempate al anfitrión: ${room.host}`);

            io.to(hostPlayer.socketId).emit("mayorTieBreak", {
              tieCandidates: tieCandidates,
              votes: voteCount,
              roomCode: code
            });

            console.log(" Esperando decisión del anfitrión...");
            return;
          } else {
            console.log(" Anfitrión no disponible para desempate, usando método alternativo");
            electedMayor = tieCandidates.sort()[0];
            console.log(` Desempate automático: ${electedMayor} es el intendente`);
          }
        }

        if (electedMayor) {
          finalizeMayorElection(room, electedMayor, maxVotes);
        }
      }

    } catch (error) {
      console.error(" Error en voteMayor:", error);
      socket.emit("roomError", "Error al procesar el voto");
    }
  });

  socket.on("mayorTieBreakDecision", ({ code, chosenCandidate, tieCandidates }) => {
    try {
      console.log(` Decisión de desempate recibida: ${chosenCandidate}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      if (socket.id !== room.hostSocketId) {
        socket.emit("roomError", "Solo el anfitrión puede decidir el desempate");
        return;
      }

      if (!tieCandidates.includes(chosenCandidate)) {
        socket.emit("roomError", "Candidato inválido para el desempate");
        return;
      }

      console.log(` Anfitrión ${room.host} eligió a ${chosenCandidate} como intendente`);

      const voteCount = {};
      Object.values(room.mayorVotes).forEach(candidate => {
        voteCount[candidate] = (voteCount[candidate] || 0) + 1;
      });
      const votes = voteCount[chosenCandidate] || tieCandidates.length;

      finalizeMayorElection(room, chosenCandidate, votes);

    } catch (error) {
      console.error("Error en mayorTieBreakDecision:", error);
      socket.emit("roomError", "Error al procesar la decisión de desempate");
    }
  });

  socket.on("voteLynch", ({ code, voter, candidate }) => {
    try {
      console.log(`🗳️ Voto para linchamiento recibido: ${voter} -> ${candidate}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      const voterPlayer = room.players.find(p => p.username === voter && p.isAlive);
      if (!voterPlayer) {
        socket.emit("roomError", "Jugador no encontrado o no está vivo");
        return;
      }

      const candidatePlayer = room.players.find(p => p.username === candidate && p.isAlive);
      if (!candidatePlayer) {
        socket.emit("roomError", "Candidato no encontrado o no está vivo");
        return;
      }

      if (!room.lynchVotes) {
        room.lynchVotes = {};
      }

      if (room.lynchVotes[voter]) {
        console.log(`⚠️ ${voter} intentó votar nuevamente en linchamiento`);
        socket.emit("alreadyVotedLynch", { voter, previousVote: room.lynchVotes[voter] });
        return;
      }

      room.lynchVotes[voter] = candidate;
      console.log(`Voto de linchamiento registrado: ${voter} votó por ${candidate}`);

      socket.emit("lynchVoteRegistered", {
        voter: voter,
        candidate: candidate
      });

      const voteCount = {};
      Object.values(room.lynchVotes).forEach(candidate => {
        voteCount[candidate] = (voteCount[candidate] || 0) + 1;
      });

      console.log("Conteo actual de votos para linchamiento:", voteCount);

      room.players.forEach(player => {
        player.lynchVotes = voteCount[player.username] || 0;
      });

      const alivePlayers = room.players.filter(p => p.isAlive);
      const totalVotesReceived = Object.keys(room.lynchVotes).length;

      console.log("Estado de votación:", {
        jugadoresVivos: alivePlayers.length,
        votosRecibidos: totalVotesReceived,
        jugadoresVivosQueVotaron: alivePlayers.filter(p => room.lynchVotes[p.username]).map(p => p.username),
        faltanVotos: alivePlayers.length - totalVotesReceived
      });

      io.to(code).emit("lynchVoteUpdate", {
        votes: voteCount,
        totalVotes: totalVotesReceived,
        totalAlivePlayers: alivePlayers.length,
        recentVote: { voter, candidate }
      });

      console.log("--- VOTOS INDIVIDUALES REGISTRADOS (LINCHAMIENTO) ---");
      Object.entries(room.lynchVotes).forEach(([voter, candidate]) => {
        console.log(`   ${voter} -> ${candidate}`);
      });
      console.log(`--- Total: ${totalVotesReceived}/${alivePlayers.length} ---`);

      if (totalVotesReceived === alivePlayers.length) {
        console.log("¡TODOS los jugadores vivos han votado! Procesando resultado...");

        let maxVotes = 0;
        let lynchedPlayer = null;
        let tieCandidates = [];

        Object.entries(voteCount).forEach(([candidate, votes]) => {
          if (votes > maxVotes) {
            maxVotes = votes;
            lynchedPlayer = candidate;
            tieCandidates = [candidate];
          } else if (votes === maxVotes) {
            tieCandidates.push(candidate);
          }
        });

        console.log("Resultado de votación:", {
          maxVotos: maxVotes,
          candidatoMasVotado: lynchedPlayer,
          hayEmpate: tieCandidates.length > 1,
          candidatosEmpatados: tieCandidates
        });

        if (tieCandidates.length > 1) {
          console.log(`⚖️ ¡EMPATE DETECTADO! Candidatos: ${tieCandidates.join(', ')}`);

          const mayorPlayer = room.players.find(p => p.isMayor && p.isAlive);

          console.log("🔍 Buscando intendente:", {
            intendenteBD: room.mayor,
            intendenteEncontrado: mayorPlayer ? mayorPlayer.username : "No encontrado",
            estaVivo: mayorPlayer ? mayorPlayer.isAlive : false,
            tieneSocketId: mayorPlayer ? !!mayorPlayer.socketId : false
          });

          if (mayorPlayer && mayorPlayer.socketId) {
            console.log(` Enviando desempate al intendente: ${mayorPlayer.username} (socket: ${mayorPlayer.socketId})`);

            io.to(mayorPlayer.socketId).emit("lynchTieBreak", {
              tieCandidates: tieCandidates,
              votes: voteCount,
              roomCode: code,
              mayorUsername: mayorPlayer.username,
              mayorSocketId: mayorPlayer.socketId,
              timestamp: Date.now(),
              debug: {
                roomMayor: room.mayor,
                mayorPlayer: {
                  username: mayorPlayer.username,
                  socketId: mayorPlayer.socketId,
                  isMayor: mayorPlayer.isMayor,
                  isAlive: mayorPlayer.isAlive
                }
              }
            });

            console.log(" Esperando decisión del intendente...");
            return;
          }
          else {
            console.log(" Intendente no disponible para desempate");
            console.log(" Estado del intendente:", {
              mayorEnRoom: room.mayor,
              todosLosJugadores: room.players.map(p => ({
                username: p.username,
                isMayor: p.isMayor,
                isAlive: p.isAlive,
                socketId: p.socketId
              }))
            });

            io.to(code).emit("lynchResult", {
              lynched: null,
              votes: voteCount,
              message: "Empate y no hay intendente para desempatar, no se lincha a nadie."
            });
            room.lynchVotes = {};
            return;
          }
        }

        if (lynchedPlayer) {
          console.log(`🔨 Sin empate - Linchando a ${lynchedPlayer}`);
          finalizeLynchVote(room, lynchedPlayer, maxVotes);
        }
      } else {
        console.log(`⏳ Esperando más votos... (${totalVotesReceived}/${alivePlayers.length})`);
      }

    } catch (error) {
      console.error(" Error en voteLynch:", error);
      socket.emit("roomError", "Error al procesar el voto de linchamiento");
    }
  });

  socket.on("lynchTieBreakDecision", ({ code, chosenCandidate, tieCandidates }) => {
    try {
      console.log(`🔨 Decisión de desempate de linchamiento recibida: ${chosenCandidate}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      const mayorPlayer = room.players.find(p => p.isMayor && p.isAlive);
      if (!mayorPlayer) {
        socket.emit("roomError", "No hay intendente vivo");
        return;
      }

      if (socket.id !== mayorPlayer.socketId) {
        socket.emit("roomError", "Solo el intendente puede decidir el desempate");
        return;
      }

      if (!tieCandidates.includes(chosenCandidate)) {
        socket.emit("roomError", "Candidato inválido para el desempate");
        return;
      }

      console.log(` Intendente ${mayorPlayer.username} eligió linchar a ${chosenCandidate}`);

      const voteCount = {};
      Object.values(room.lynchVotes).forEach(candidate => {
        voteCount[candidate] = (voteCount[candidate] || 0) + 1;
      });
      const votes = voteCount[chosenCandidate] || tieCandidates.length;

      room.wasTieBreak = true;

      finalizeLynchVote(room, chosenCandidate, votes);

    } catch (error) {
      console.error("Error en lynchTieBreakDecision:", error);
      socket.emit("roomError", "Error al procesar la decisión de desempate");
    }
  });

  function finalizeLynchVote(room, lynchedPlayer, votes) {
    const player = room.players.find(p => p.username === lynchedPlayer);
    if (player) {
      player.isAlive = false;
    }

    if (room.mayor === lynchedPlayer) {
      console.log(` INTENDENTE LINCHADO: ${lynchedPlayer}`);
      handleMayorDeath(room, lynchedPlayer);
    }

    console.log(`🔨 Jugador linchado: ${lynchedPlayer} con ${votes} votos`);

    io.to(room.code).emit("lynchResult", {
      lynched: lynchedPlayer,
      votes: votes,
      totalVoters: room.players.filter(p => p.isAlive).length + 1, 
      wasTieBreak: room.wasTieBreak || false
    });

    room.lynchVotes = {};
    room.wasTieBreak = false;
  }

  socket.on("startNight", ({ code }) => {
    try {
      console.log(" Iniciando noche en sala:", code);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      room.state = gameStates.NOCHE_LOBIZONES;
      room.nightVotes = {};

      console.log(" Noche iniciada. Notificando a todos los jugadores...");

      io.to(code).emit("nightStarted", {
        message: "Cae la noche en Castro Barros...",
        roomCode: code
      });

      const lobizones = room.players.filter(p => p.role === 'Lobizón' && p.isAlive);
      const tarotistas = room.players.filter(p => p.role === 'Tarotista' && p.isAlive);
      console.log(` Lobizones que deben votar: ${lobizones.map(l => l.username).join(', ')}`);
      console.log(` Tarotistas que pueden preguntar: ${tarotistas.map(t => t.username).join(', ')}`);

      lobizones.forEach(lobizon => {
        console.log(` Enviando openNightModal a: ${lobizon.username} (socket: ${lobizon.socketId})`);
        io.to(lobizon.socketId).emit("openNightModal");
      });

      tarotistas.forEach(tarotista => {
        console.log(` Enviando openNightModalTarotista a: ${tarotista.username} (socket: ${tarotista.socketId})`);
        io.to(tarotista.socketId).emit("openNightModalTarotista");
      });

      if (lobizones.length === 0) {
        console.log(" ADVERTENCIA: No hay lobizones vivos para votar");
      }

      if (tarotistas.length === 0) {
        console.log(" ADVERTENCIA: No hay tarotista viva para preguntar");
      }
    } catch (error) {
      console.error(" Error en startNight:", error);
      socket.emit("roomError", "Error al iniciar la noche");
    }
  });

  socket.on("tarotistaQuestionResult", ({ code, tarotista, target, targetRole }) => {
    try {
      console.log(` Tarotista ${tarotista} consultó el rol de ${target}: ${targetRole}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      const tarotistaPlayer = room.players.find(p => p.username === tarotista && p.isAlive);
      if (tarotistaPlayer && tarotistaPlayer.socketId) {
        io.to(tarotistaPlayer.socketId).emit("tarotistaResult", {
          target: target,
          role: targetRole,
          message: `El rol de ${target} es: ${targetRole}`
        });
      }

      console.log(`Respuesta enviada a tarotista ${tarotista}`);

    } catch (error) {
      console.error("Error en tarotistaQuestionResult:", error);
      socket.emit("roomError", "Error al procesar consulta de tarotista");
    }
  });

  socket.on("voteNightKill", ({ code, voter, candidate }) => {
    try {
      console.log(` Voto nocturno recibido: ${voter} -> ${candidate}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      const voterPlayer = room.players.find(p => p.username === voter && p.isAlive && p.role === 'Lobizón');
      if (!voterPlayer) {
        socket.emit("roomError", "No eres un Lobizón o no estás vivo");
        return;
      }

      const candidatePlayer = room.players.find(p => p.username === candidate && p.isAlive && p.role !== 'Lobizón');
      if (!candidatePlayer) {
        socket.emit("roomError", "Candidato no encontrado, no está vivo o es Lobizón");
        return;
      }

      if (!room.nightVotes) {
        room.nightVotes = {};
      }

      if (room.nightVotes[voter]) {
        console.log(` ${voter} intentó votar nuevamente en la noche`);
        socket.emit("alreadyVotedNight", { voter, previousVote: room.nightVotes[voter] });
        return;
      }

      room.nightVotes[voter] = candidate;
      console.log(` Voto nocturno registrado: ${voter} votó por ${candidate}`);

      socket.emit("nightVoteRegistered", {
        voter: voter,
        candidate: candidate
      });

      const voteCount = {};
      Object.values(room.nightVotes).forEach(candidate => {
        voteCount[candidate] = (voteCount[candidate] || 0) + 1;
      });

      console.log("Conteo actual de votos nocturnos:", voteCount);

      const aliveLobizones = room.players.filter(p => p.role === 'Lobizón' && p.isAlive);
      aliveLobizones.forEach(lobizon => {
        io.to(lobizon.socketId).emit("nightVoteUpdate", {
          votes: voteCount,
          totalVotes: Object.keys(room.nightVotes).length,
          totalLobizones: aliveLobizones.length,
          recentVote: { voter, candidate }
        });
      });

      if (Object.keys(room.nightVotes).length === aliveLobizones.length) {
        console.log(" Todos los lobizones han votado, procediendo a la elección de víctima...");

        let maxVotes = 0;
        let victim = null;
        let tieCandidates = [];

        Object.entries(voteCount).forEach(([candidate, votes]) => {
          if (votes > maxVotes) {
            maxVotes = votes;
            victim = candidate;
            tieCandidates = [candidate];
          } else if (votes === maxVotes) {
            tieCandidates.push(candidate);
          }
        });

        if (tieCandidates.length > 1) {
          console.log(` EMPATE NOCTURNO entre: ${tieCandidates.join(', ')}`);

          room.nightTieBreakCandidates = tieCandidates;
          room.nightTieBreakVotes = {};

          aliveLobizones.forEach(lobizon => {
            io.to(lobizon.socketId).emit("nightTieBreak", {
              tieCandidates: tieCandidates,
              votes: voteCount,
              roomCode: code
            });
          });

          console.log(" Solicitando revotación a los lobizones...");
          return;
        }

        if (victim) {
          finalizeNightVote(room, victim, maxVotes);
        }
      }

    } catch (error) {
      console.error(" Error en voteNightKill:", error);
      socket.emit("roomError", "Error al procesar el voto nocturno");
    }
  });

  socket.on("voteNightQuestion", ({ code, voter, candidate }) => {
    try {
      console.log(` Tarotista ${voter} consultando el rol de ${candidate}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      const voterPlayer = room.players.find(p => p.username === voter && p.isAlive && p.role === 'Tarotista');
      if (!voterPlayer) {
        socket.emit("roomError", "No eres un Tarotista o no estás vivo");
        return;
      }

      const targetPlayer = room.players.find(p => p.username === candidate && p.isAlive);
      if (!targetPlayer) {
        socket.emit("roomError", "Jugador objetivo no encontrado o no está vivo");
        return;
      }

      socket.emit("tarotistaResult", {
        target: candidate,
        role: targetPlayer.role,
        message: `El rol de ${candidate} es: ${targetPlayer.role}`
      });

      console.log(` Consulta de tarotista procesada: ${voter} -> ${candidate} (${targetPlayer.role})`);

    } catch (error) {
      console.error("Error en voteNightQuestion:", error);
      socket.emit("roomError", "Error al procesar la consulta de tarotista");
    }
  });

  socket.on("voteNightTieBreak", ({ code, voter, candidate }) => {
    try {
      console.log(` Voto de desempate nocturno recibido: ${voter} -> ${candidate}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      const voterPlayer = room.players.find(p => p.username === voter && p.isAlive && p.role === 'Lobizón');
      if (!voterPlayer) {
        socket.emit("roomError", "No eres un Lobizón o no estás vivo");
        return;
      }

      if (!room.nightTieBreakVotes) {
        room.nightTieBreakVotes = {};
      }

      if (!room.nightTieBreakCandidates || !room.nightTieBreakCandidates.includes(candidate)) {
        socket.emit("roomError", "Candidato inválido para el desempate");
        return;
      }

      if (room.nightTieBreakVotes[voter]) {
        socket.emit("alreadyVotedNight", { voter, previousVote: room.nightTieBreakVotes[voter] });
        return;
      }

      room.nightTieBreakVotes[voter] = candidate;
      console.log(` Voto de desempate nocturno registrado: ${voter} votó por ${candidate}`);

      const tieBreakVoteCount = {};
      Object.values(room.nightTieBreakVotes).forEach(candidate => {
        tieBreakVoteCount[candidate] = (tieBreakVoteCount[candidate] || 0) + 1;
      });

      console.log("Conteo actual de votos de desempate nocturno:", tieBreakVoteCount);

      const aliveLobizones = room.players.filter(p => p.role === 'Lobizón' && p.isAlive);
      aliveLobizones.forEach(lobizon => {
        io.to(lobizon.socketId).emit("nightTieBreakUpdate", {
          votes: tieBreakVoteCount,
          totalVotes: Object.keys(room.nightTieBreakVotes).length,
          totalLobizones: aliveLobizones.length
        });
      });

      if (Object.keys(room.nightTieBreakVotes).length === aliveLobizones.length) {
        console.log(" Todos los lobizones han votado en el desempate...");

        let maxVotes = 0;
        let victim = null;

        Object.entries(tieBreakVoteCount).forEach(([candidate, votes]) => {
          if (votes > maxVotes) {
            maxVotes = votes;
            victim = candidate;
          }
        });

        if (!victim && room.nightTieBreakCandidates.length > 0) {
          victim = room.nightTieBreakCandidates.sort()[0];
          console.log(` Empate persistente, eligiendo: ${victim}`);
        }

        if (victim) {
          finalizeNightVote(room, victim, maxVotes);
        }
      }

    } catch (error) {
      console.error("Error en voteNightTieBreak:", error);
      socket.emit("roomError", "Error al procesar la decisión de desempate nocturno");
    }
  });

  function finalizeNightVote(room, victim, votes) {
    const player = room.players.find(p => p.username === victim);
    if (player) {
      player.isAlive = false;
      room.lastVictim = victim;
    }

    if (room.mayor === victim) {
      console.log(` INTENDENTE ASESINADO: ${victim}`);
      handleMayorDeath(room, victim);
    }

    console.log(` VÍCTIMA NOCTURNA: ${victim} con ${votes} votos`);

    io.to(room.code).emit("nightResult", {
      victim: victim,
      votes: votes,
      totalVoters: room.players.filter(p => p.role === 'Lobizón' && p.isAlive).length
    });

    room.nightVotes = {};
    room.nightTieBreakVotes = {};
    room.nightTieBreakCandidates = null;
  }

  function finalizeMayorElection(room, electedMayor, votes) {
    room.mayor = electedMayor;

    room.players.forEach(player => {
      player.isMayor = player.username === electedMayor;
    });

    console.log(` INTENDENTE ELECTO: ${electedMayor} con ${votes} votos`);

    io.to(room.code).emit("mayorElected", {
      mayor: electedMayor,
      votes: votes,
      totalVoters: room.players.length,
      wasTieBreak: room.wasTieBreak || false
    });

    const mayorPlayer = room.players.find(p => p.username === electedMayor);
    if (mayorPlayer) {
      console.log(` ${electedMayor} (${mayorPlayer.role}) es ahora el Intendente`);
      console.log(" Habilidades disponibles: Plan Platita y romper empates");
    }

    delete room.wasTieBreak;
  }

  function handleMayorDeath(room, deadMayorUsername) {
    console.log(`Intendente ${deadMayorUsername} ha muerto. Eligiendo sucesor...`);

    const deadMayor = room.players.find(p => p.username === deadMayorUsername);
    if (!deadMayor) return;

    if (deadMayor.socketId) {
      const alivePlayers = room.players.filter(p => p.isAlive && p.username !== deadMayorUsername);

      console.log(`Candidatos para sucesor: ${alivePlayers.map(p => p.username).join(', ')}`);

      io.to(deadMayor.socketId).emit("chooseMayorSuccessor", {
        roomCode: room.code,
        alivePlayers: alivePlayers.map(p => p.username),
        deadMayor: deadMayorUsername
      });
    }
  }

  socket.on("chooseSuccessor", ({ code, successor, deadMayor }) => {
    try {
      console.log(`Intendente ${deadMayor} elige sucesor: ${successor}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      if (socket.username !== deadMayor) {
        socket.emit("roomError", "Solo el intendente muerto puede elegir sucesor");
        return;
      }

      const successorPlayer = room.players.find(p => p.username === successor && p.isAlive);
      if (!successorPlayer) {
        socket.emit("roomError", "El sucesor debe estar vivo");
        return;
      }

      room.mayor = successor;
      room.players.forEach(player => {
        player.isMayor = player.username === successor;
      });

      console.log(` Nuevo intendente: ${successor}`);

      io.to(code).emit("mayorSuccessorChosen", {
        newMayor: successor,
        previousMayor: deadMayor,
        chosenBy: deadMayor
      });

    } catch (error) {
      console.error("Error en chooseSuccessor:", error);
      socket.emit("roomError", "Error al elegir sucesor");
    }
  });

  socket.on("requestAutoSuccessor", ({ code, deadMayor }) => {
    try {
      console.log(`Solicitando sucesor automático para intendente ${deadMayor}`);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) return;

      const alivePlayers = room.players.filter(p => p.isAlive);

      if (alivePlayers.length === 0) {
        console.log("No hay jugadores vivos para elegir sucesor");
        return;
      }

      let newMayor = null;
      const playersWithVotes = alivePlayers
        .filter(p => p.mayorVotes > 0)
        .sort((a, b) => b.mayorVotes - a.mayorVotes);

      if (playersWithVotes.length > 0) {
        newMayor = playersWithVotes[0].username;
      } else {
        const randomIndex = Math.floor(Math.random() * alivePlayers.length);
        newMayor = alivePlayers[randomIndex].username;
      }

      console.log(`Sucesor automático: ${newMayor}`);

      room.mayor = newMayor;
      room.players.forEach(player => {
        player.isMayor = player.username === newMayor;
      });

      io.to(code).emit("mayorSuccessorChosen", {
        newMayor: newMayor,
        previousMayor: deadMayor,
        chosenBy: "sistema",
        wasAutomatic: true
      });

    } catch (error) {
      console.error("Error en requestAutoSuccessor:", error);
    }
  });

  socket.on("resetGame", ({ code, host }) => {
    try {
      console.log("Solicitando reset del juego para sala:", code);

      const room = rooms.find(r => r.code === code && r.active);
      if (!room) {
        socket.emit("roomError", "La sala no existe");
        return;
      }

      if (socket.username !== room.host) {
        socket.emit("roomError", "Solo el anfitrión puede reiniciar el juego");
        return;
      }

      console.log("Reiniciando juego en sala:", code);

      room.state = gameStates.INICIO;
      room.round = 1;
      room.assignedRoles = false;
      room.lobizonesVotes = {};
      room.lynchVotes = {};
      room.mayor = null;
      room.lastVictim = null;
      room.nightVotes = {};
      room.nightTieBreakVotes = {};
      room.nightTieBreakCandidates = null;
      room.wasTieBreak = false;
      room.mayorVotes = {};

      room.players = room.players.map(player => ({
        ...player,
        role: null,
        isAlive: true,
        votesReceived: 0,
        wasProtected: false,
        isMayor: false,
        mayorVotes: 0,
        lynchVotes: 0,
        nightVotes: 0
      }));

      console.log(" Sala reiniciada completamente. Jugadores:",
        room.players.map(p => ({
          username: p.username,
          isAlive: p.isAlive,
          role: p.role
        }))
      );

      io.to(code).emit("gameReset", {
        players: room.players,
        message: "El juego ha sido reiniciado. Volviendo al lobby.",
        host: host
      });

      console.log(`${host} ha reiniciado el juego. Volviendo al lobby...`);

    } catch (error) {
      console.error(" Error en resetGame:", error);
      socket.emit("roomError", "Error al reiniciar el juego");
    }
  });
});

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
  console.log(` Server running at http://10.211.228.142:${port}`);
});