
const express = require('express');
const session = require('express-session');
var bodyParser = require('body-parser');
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');
const http = require('http');
const { Server } = require('socket.io');
const { rmSync } = require('fs');


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

server.listen(port, function () {
  console.log(` Server running at http://localhost:${port}`);
});


io.on("connection", (socket) => {
  const req = socket.request;
  console.log(" Nuevo usuario conectado:", socket.id);

  socket.on("crearSala", ({ codigo, anfitrion, maxJugadores }) => {


    for (let i = 0; i < salas.length; i++) {
      if (salas[i].codigo === codigo) {
        console.log("errorSala", "el codigo ya esta en uso");
        return;
      }
    };

    salas.push({
      codigo: codigo,
      anfitrion: anfitrion,
      maxJugadores: parseInt(maxJugadores),
      jugadores: [{ id: socket.id, username: anfitrion }]
    });

    socket.join(codigo);
    console.log(`Sala creada: ${codigo} (Anfitrión: ${anfitrion})`);

    io.to(codigo).emit("usersInRoom", [{ id: socket.id, username: anfitrion }]);
  });

  // Unirse a una sala existente
  socket.on("joinRoom", ({ codigo, username }) => {

    for (let i = 0; i < salas.length; i++) {
      if (salas[i].codigo === codigo) {
        var sala = salas[i];
        sala.jugadores.push({ id: socket.id, username: username });
        break;
      }
    }

    console.log("Salas: ", salas, " Código recibido: ", codigo);
    if (!sala) {
      socket.emit("errorSala", "No existe una sala con ese código");
      return;
    }
    console.log(username, "se unió a la sala ");

    if (sala.jugadores.length >= sala.maxJugadores) {
      socket.emit("errorSala", "La sala está llena");
      return;
    }

    socket.join(codigo);
    io.to(codigo).emit("usersInRoom", sala.jugadores);

  });

  // Iniciar la partida (solo el anfitrión)
  socket.on("iniciarJuego", ({ codigo }) => {
    const sala = salas[codigo];
    if (!sala) return;
    console.log(` Juego iniciado en sala`, codigo);
    io.to(codigo).emit("gameStarted", true);
  });

  // Desconexión
  socket.on("disconnect", () => {
    console.log(" Usuario desconectado:", socket.id);
  });
});



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////