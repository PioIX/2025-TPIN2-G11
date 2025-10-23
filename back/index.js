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
  origin: ["http://localhost:3000", "http://localhost:3001"],
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
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Definir estados del juego
const estadosJuego = {
  INICIO: "inicio",
  NOCHE_LOBIZONES: "noche_lobizones",
  NOCHE_ESPECIALES: "noche_especiales",
  DIA_DEBATE: "dia_debate",
  DIA_VOTACION: "dia_votacion",
  FINALIZADO: "finalizado"
};

// Array para almacenar salas en memoria
const salas = [];

app.get('/', function (req, res) {
  res.status(200).send({
    message: 'GET Home route working fine!'
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/verifyUser", async (req, res) => {
  try {
    const { username, password } = req.query;

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
    const { codigo, anfitrion, maxJugadores } = req.body;

    console.log(" Creando sala en BD - Datos recibidos:", {
      codigo,
      anfitrion,
      maxJugadores
    });

    // Obtener el ID del usuario desde la base de datos
    const usuario = await realizarQuery(
      `SELECT id FROM Users WHERE username = ?`,
      [anfitrion]
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
      [codigo]
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
      [codigo, userId]
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
app.get("/verificarSala/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;

    const sala = await realizarQuery(
      `SELECT id, code, village_won, status FROM Games 
       WHERE code = ? AND status = true`,
      [codigo]
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
    console.error(" Error en /verificarSala:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cerrar sala
app.post("/cerrarSala", async (req, res) => {
  try {
    const { codigo } = req.body;

    await realizarQuery(
      `UPDATE Games SET status = false WHERE code = ?`,
      [codigo]
    );

    console.log("Sala cerrada en BD:", codigo);
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

  // En la parte de sockets, modifica el evento "crearSala":
  socket.on("crearSala", async ({ codigo, anfitrion, maxJugadores }) => {
    try {
      console.log(" Socket: Intentando crear sala:", { codigo, anfitrion, maxJugadores });

      // Verificar si ya existe en memoria
      const salaExistente = salas.find(s => s.codigo === codigo && s.activa);

      if (salaExistente) {
        socket.emit("errorSala", "El código ya está en uso en este momento");
        return;
      }

      // Buscar la sala en BD para verificar que fue creada por HTTP
      const salaBD = await realizarQuery(
        `SELECT id, code, village_won FROM Games 
       WHERE code = ? AND status = true`,
        [codigo]
      );

      if (salaBD.length === 0) {
        socket.emit("errorSala", "Primero debes crear la sala desde el formulario");
        return;
      }

      // Obtener el username del anfitrión desde la BD
      const usuarioAnfitrion = await realizarQuery(
        `SELECT username FROM Users WHERE id = ?`,
        [salaBD[0].village_won]
      );

      const anfitrionUsername = usuarioAnfitrion.length > 0 ? usuarioAnfitrion[0].username : anfitrion;

      // Crear sala en memoria
      const nuevaSala = {
        codigo: codigo,
        anfitrion: anfitrionUsername,
        anfitrionSocketId: socket.id,
        maxJugadores: parseInt(maxJugadores) || 6,
        jugadores: [{
          id: socket.id,
          username: anfitrionUsername,
          socketId: socket.id,
          esAnfitrion: true,
          rol: null,
          estaVivo: true,
          votosRecibidos: 0,
          fueProtegido: false
        }],
        estado: estadosJuego.INICIO,
        ronda: 1,
        rolesAsignados: false,
        votosLobizones: {},
        votosLinchamiento: {},
        intendente: null,
        ultimaVictima: null,
        ganador: null,
        activa: true,
        creadaEnBD: true
      };

      salas.push(nuevaSala);
      socket.join(codigo);

      socket.salaActual = codigo;
      socket.esAnfitrion = true;
      socket.username = anfitrionUsername;

      console.log("Sala activada en memoria para:", anfitrionUsername);
      console.log("Jugadores en sala:", nuevaSala.jugadores);

      // Enviar la lista de jugadores a TODOS en la sala (incluyendo al anfitrión)
      io.to(codigo).emit("usersInRoom", nuevaSala.jugadores);

    } catch (error) {
      console.error(" Error creando sala en socket:", error);
      socket.emit("errorSala", "Error interno del servidor");
    }
  });

  socket.on("joinRoom", async ({ codigo, username }) => {
    try {
      console.log(" Socket: Intentando unirse a sala:", { codigo, username });

      // Verificar en BD si la sala existe y está activa
      const salaBD = await realizarQuery(
        `SELECT id, code, village_won FROM Games 
         WHERE code = ? AND status = true`,
        [codigo]
      );

      if (salaBD.length === 0) {
        socket.emit("errorSala", "No existe una sala activa con ese código");
        return;
      }

      // Buscar en memoria
      let sala = salas.find(s => s.codigo === codigo && s.activa);

      if (!sala) {
        // Si no está en memoria pero sí en BD, crear en memoria
        const usuarioAnfitrion = await realizarQuery(
          `SELECT username FROM Users WHERE id = ?`,
          [salaBD[0].village_won]
        );

        const anfitrionUsername = usuarioAnfitrion.length > 0 ? usuarioAnfitrion[0].username : "Anfitrión";

        sala = {
          codigo: codigo,
          anfitrion: anfitrionUsername,
          anfitrionSocketId: null,
          maxJugadores: 6, // Valor por defecto ya que no tenemos la columna en BD
          jugadores: [],
          estado: estadosJuego.INICIO,
          ronda: 1,
          rolesAsignados: false,
          votosLobizones: {},
          votosLinchamiento: {},
          intendente: null,
          ultimaVictima: null,
          ganador: null,
          activa: true,
          creadaEnBD: true
        };
        salas.push(sala);
      }

      // Verificar si el jugador ya está en la sala
      if (sala.jugadores.find(j => j.username === username)) {
        socket.emit("errorSala", "Ya estás en esta sala");
        return;
      }

      if (sala.jugadores.length >= sala.maxJugadores) {
        socket.emit("errorSala", "La sala está llena");
        return;
      }

      // Unir al jugador
      const nuevoJugador = {
        id: socket.id,
        username: username,
        socketId: socket.id,
        esAnfitrion: (username === sala.anfitrion && !sala.anfitrionSocketId),
        rol: null,
        estaVivo: true,
        votosRecibidos: 0,
        fueProtegido: false
      };

      sala.jugadores.push(nuevoJugador);

      // Si es el anfitrión reconectándose, actualizar su socket ID
      if (username === sala.anfitrion && !sala.anfitrionSocketId) {
        sala.anfitrionSocketId = socket.id;
        nuevoJugador.esAnfitrion = true;
        console.log("Anfitrión reconectado:", username);
      }

      socket.join(codigo);
      socket.salaActual = codigo;
      socket.esAnfitrion = nuevoJugador.esAnfitrion;
      socket.username = username;

      console.log("Usuario unido exitosamente:", username);
      io.to(codigo).emit("usersInRoom", sala.jugadores);

    } catch (error) {
      console.error(" Error uniéndose a sala:", error);
      socket.emit("errorSala", "Error interno del servidor");
    }
  });

  socket.on("cerrarSala", async ({ codigo }) => {
    try {
      console.log(" Cerrando sala:", codigo);

      // Marcar como inactiva en BD
      await realizarQuery(
        `UPDATE Games SET status = false WHERE code = ?`,
        [codigo]
      );

      // Eliminar de memoria
      const index = salas.findIndex(s => s.codigo === codigo);
      if (index !== -1) {
        salas.splice(index, 1);
      }

      // Notificar a todos los jugadores
      io.to(codigo).emit("salaCerrada", "El anfitrión cerró la sala");
      io.in(codigo).socketsLeave(codigo);

      console.log("Sala cerrada completamente:", codigo);

    } catch (error) {
      console.error(" Error cerrando sala:", error);
    }
  });

  socket.on("abandonarSala", async ({ codigo }) => {
    try {
      const sala = salas.find(s => s.codigo === codigo && s.activa);
      if (!sala) return;

      // Remover jugador de la sala en memoria
      sala.jugadores = sala.jugadores.filter(j => j.socketId !== socket.id);

      // Si el anfitrión abandona, cerrar la sala
      if (socket.esAnfitrion && socket.username === sala.anfitrion) {
        console.log("Anfitrión abandonó la sala, cerrando...");

        // Marcar como inactiva en BD
        await realizarQuery(
          `UPDATE Games SET status = false WHERE code = ?`,
          [codigo]
        );

        // Notificar a otros jugadores
        io.to(codigo).emit("salaCerrada", "El anfitrión abandonó la sala");
        io.in(codigo).socketsLeave(codigo);

        // Eliminar de memoria
        const index = salas.findIndex(s => s.codigo === codigo);
        if (index !== -1) {
          salas.splice(index, 1);
        }
      } else {
        // Solo actualizar lista de jugadores
        io.to(codigo).emit("usersInRoom", sala.jugadores);
      }

      socket.leave(codigo);
      console.log("Usuario abandonó sala:", socket.username);

    } catch (error) {
      console.error(" Error abandonando sala:", error);
    }
  });

  socket.on("iniciarJuego", ({ codigo }) => {
    try {
      console.log("Intentando iniciar juego en sala:", codigo);

      const sala = salas.find(s => s.codigo === codigo && s.activa);
      if (!sala) {
        socket.emit("errorSala", "La sala no existe");
        return;
      }

      // Verificar que el que inicia es el anfitrión
      if (socket.id !== sala.anfitrionSocketId) {
        socket.emit("errorSala", "Solo el anfitrión puede iniciar el juego");
        return;
      }

      // Verificar cantidad mínima de jugadores
      if (sala.jugadores.length < 2) {
        socket.emit("errorSala", "Se necesitan al menos 2 jugadores para iniciar");
        return;
      }

      console.log("Juego iniciado en sala:", codigo);
      io.to(codigo).emit("gameStarted", true);

    } catch (error) {
      console.error("Error iniciando juego:", error);
      socket.emit("errorSala", "Error al iniciar el juego");
    }
  });

  socket.on("disconnect", async () => {
    console.log("Usuario desconectado:", socket.id, socket.username);

    if (socket.salaActual && socket.esAnfitrion) {
      try {
        const sala = salas.find(s => s.codigo === socket.salaActual && s.activa);
        if (sala) {
          console.log("Anfitrión desconectado, cerrando sala:", socket.salaActual);

          // Marcar como inactiva en BD
          await realizarQuery(
            `UPDATE Games SET status = false WHERE code = ?`,
            [socket.salaActual]
          );

          // Notificar a otros jugadores
          io.to(socket.salaActual).emit("salaCerrada", "El anfitrión se desconectó");
          io.in(socket.salaActual).socketsLeave(socket.salaActual);

          // Eliminar de memoria
          const index = salas.findIndex(s => s.codigo === socket.salaActual);
          if (index !== -1) {
            salas.splice(index, 1);
          }
        }
      } catch (error) {
        console.error(" Error cerrando sala en desconexión:", error);
      }
    } else if (socket.salaActual) {
      // Solo jugador normal - remover de la lista
      const sala = salas.find(s => s.codigo === socket.salaActual && s.activa);
      if (sala) {
        sala.jugadores = sala.jugadores.filter(j => j.socketId !== socket.id);
        io.to(socket.salaActual).emit("usersInRoom", sala.jugadores);
      }
    }
  });
});

// Limpieza automática de salas huérfanas
setInterval(async () => {
  try {
    // Cerrar salas en BD que no están en memoria
    const salasActivasBD = await realizarQuery(
      `SELECT code FROM Games WHERE status = true`
    );

    for (const salaBD of salasActivasBD) {
      const salaEnMemoria = salas.find(s => s.codigo === salaBD.code && s.activa);
      if (!salaEnMemoria) {
        await realizarQuery(
          `UPDATE Games SET status = false WHERE code = ?`,
          [salaBD.code]
        );
        console.log("Sala huérfana limpiada:", salaBD.code);
      }
    }
  } catch (error) {
    console.error(" Error en limpieza automática:", error);
  }
}, 5 * 60 * 1000); // 5 minutos

server.listen(port, function () {
  console.log(` Server running at http://localhost:${port}`);
});