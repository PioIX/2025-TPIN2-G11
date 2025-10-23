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
    console.log("🔍 Salas activas desde BD:", salas);
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

    // Verificar si ya existe una sala con ese código
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

    // Insertar nueva sala usando el ID del usuario
    const result = await realizarQuery(
      `INSERT INTO Games (code, village_won, status) 
       VALUES (?, ?, true)`,
      [codigo, userId]  // Usar ID numérico en lugar del username
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

const salas = [];
app.get("/vectorSalas", (req, res) => {
  res.send(salas);
})

server.listen(port, function () {
  console.log(` Server running at http://localhost:${port}`);
});


io.on("connection", (socket) => {
  console.log(" Nuevo usuario conectado:", socket.id);

  socket.on("crearSala", async ({ codigo, anfitrion, maxJugadores }) => {
    try {
      console.log(" Intentando crear sala:", { codigo, anfitrion, maxJugadores });

      // Verificar en BD si la sala existe
      const salaExistente = await realizarQuery(
        `SELECT code FROM Games WHERE code = ? AND status = true`,
        [codigo]
      );

      if (salaExistente.length > 0) {
        socket.emit("errorSala", "El código ya está en uso");
        return;
      }

      // Crear sala en BD - usando village_won para el anfitrión
      await realizarQuery(
        `INSERT INTO Games (code, village_won, status) VALUES (?, ?, true)`,
        [codigo, anfitrion]
      );

      // Mantener en memoria para la sesión actual
      const nuevaSala = {
        codigo: codigo,
        anfitrion: anfitrion,
        maxJugadores: parseInt(maxJugadores) || 6, // Valor por defecto
        jugadores: [{ id: socket.id, username: anfitrion, socketId: socket.id }]
      };

      salas.push(nuevaSala);
      socket.join(codigo);

      socket.salaActual = codigo;
      socket.esAnfitrion = true;
      socket.username = anfitrion;

      console.log(" Sala creada exitosamente en BD y memoria");
      io.to(codigo).emit("usersInRoom", nuevaSala.jugadores);

    } catch (error) {
      console.error(" Error creando sala:", error);
      socket.emit("errorSala", "Error interno del servidor");
    }
  });

  socket.on("joinRoom", async ({ codigo, username }) => {
    try {
      console.log(" Intentando unirse a sala:", { codigo, username });

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

      // Buscar en memoria o crear desde BD
      let sala = salas.find(s => s.codigo === codigo);

      if (!sala) {
        sala = {
          codigo: codigo,
          anfitrion: salaBD[0].village_won, // Usamos village_won como anfitrión
          maxJugadores: 6, // Valor por defecto ya que no tenemos la columna
          jugadores: []
        };
        salas.push(sala);
      }

      if (sala.jugadores.length >= sala.maxJugadores) {
        socket.emit("errorSala", "La sala está llena");
        return;
      }

      // Unir al jugador
      const nuevoJugador = { id: socket.id, username: username, socketId: socket.id };
      sala.jugadores.push(nuevoJugador);
      socket.join(codigo);

      socket.salaActual = codigo;
      socket.esAnfitrion = false;
      socket.username = username;

      console.log(" Usuario unido exitosamente");
      io.to(codigo).emit("usersInRoom", sala.jugadores);

    } catch (error) {
      console.error(" Error uniéndose a sala:", error);
      socket.emit("errorSala", "Error interno del servidor");
    }
  });

  socket.on("disconnect", async () => {
    console.log("🔌 Usuario desconectado:", socket.id);

    if (socket.salaActual && socket.esAnfitrion) {
      try {
        // Cerrar sala en BD cuando el anfitrión se desconecta
        await realizarQuery(
          `UPDATE Games SET status = false WHERE code = ?`,
          [socket.salaActual]
        );
        console.log("🗑️ Sala cerrada en BD por desconexión del anfitrión");
      } catch (error) {
        console.error(" Error cerrando sala en BD:", error);
      }
    }
  });
});