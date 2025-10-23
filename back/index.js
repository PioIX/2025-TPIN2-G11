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
  const req = socket.request;
  console.log(" Nuevo usuario conectado:", socket.id);

  // Función para eliminar sala
  const eliminarSala = (codigoSala) => {
    const index = salas.findIndex(sala => sala.codigo === codigoSala);
    if (index !== -1) {
      console.log(`🗑️ Sala ${codigoSala} eliminada`);
      salas.splice(index, 1);
    }
  };

  socket.on("crearSala", ({ codigo, anfitrion, maxJugadores }) => {
    for (let i = 0; i < salas.length; i++) {
      if (salas[i].codigo === codigo) {
        socket.emit("errorSala", "el codigo ya esta en uso");
        return;
      }
    }

    salas.push({
      codigo: codigo,
      anfitrion: anfitrion,
      maxJugadores: parseInt(maxJugadores),
      jugadores: [{ id: socket.id, username: anfitrion }]
    });

    socket.join(codigo);
    console.log(`Sala creada: ${codigo} (Anfitrión: ${anfitrion})`);

    // Guardar información en el socket
    socket.salaActual = codigo;
    socket.esAnfitrion = true;

    io.to(codigo).emit("usersInRoom", [{ id: socket.id, username: anfitrion }]);
  });

  // Unirse a una sala existente
  socket.on("joinRoom", ({ codigo, username }) => {
    let sala = null;

    for (let i = 0; i < salas.length; i++) {
      if (salas[i].codigo === codigo) {
        sala = salas[i];
        break;
      }
    }

    console.log("Salas: ", salas, " Código recibido: ", codigo);
    if (!sala) {
      socket.emit("errorSala", "No existe una sala con ese código");
      return;
    }

    if (sala.jugadores.length >= sala.maxJugadores) {
      socket.emit("errorSala", "La sala está llena");
      return;
    }

    // Verificar si el usuario ya está en la sala
    const usuarioExistente = sala.jugadores.find(jugador => jugador.username === username);
    if (usuarioExistente) {
      socket.emit("errorSala", "Ya hay un usuario con ese nombre en la sala");
      return;
    }

    sala.jugadores.push({ id: socket.id, username: username });
    socket.join(codigo);
    
    // Guardar información en el socket
    socket.salaActual = codigo;
    socket.esAnfitrion = false;

    console.log(username, "se unió a la sala ");
    io.to(codigo).emit("usersInRoom", sala.jugadores);
  });

  // Manejar desconexión de usuarios
  socket.on("disconnect", () => {
    console.log(" Usuario desconectado:", socket.id);
    
    if (socket.salaActual) {
      const salaIndex = salas.findIndex(sala => sala.codigo === socket.salaActual);
      
      if (salaIndex !== -1) {
        const sala = salas[salaIndex];
        const jugadorIndex = sala.jugadores.findIndex(jugador => jugador.id === socket.id);
        
        if (jugadorIndex !== -1) {
          const jugador = sala.jugadores[jugadorIndex];
          console.log(` ${jugador.username} salió de la sala ${sala.codigo}`);
          
          // Remover jugador de la sala
          sala.jugadores.splice(jugadorIndex, 1);
          
          // Si era el anfitrión, eliminar la sala para todos
          if (socket.esAnfitrion || jugador.username === sala.anfitrion) {
            console.log(` Anfitrión ${jugador.username} salió - Eliminando sala ${sala.codigo}`);
            
            // Notificar a todos los jugadores que la sala se cerró
            io.to(sala.codigo).emit("salaCerrada", "El anfitrión ha abandonado la sala");
            
            // Eliminar la sala del array
            eliminarSala(sala.codigo);
          } else {
            // Si era un jugador normal, solo actualizar la lista
            if (sala.jugadores.length > 0) {
              io.to(sala.codigo).emit("usersInRoom", sala.jugadores);
            } else {
              // Si no quedan jugadores, eliminar la sala
              eliminarSala(sala.codigo);
            }
          }
        }
      }
    }
  });

  // Evento para que el anfitrión cierre la sala manualmente
  socket.on("cerrarSala", ({ codigo }) => {
    const salaIndex = salas.findIndex(sala => sala.codigo === codigo);
    
    if (salaIndex !== -1) {
      const sala = salas[salaIndex];
      
      // Verificar que quien cierra la sala es el anfitrión
      const esAnfitrion = sala.jugadores.some(
        jugador => jugador.id === socket.id && jugador.username === sala.anfitrion
      );
      
      if (esAnfitrion) {
        console.log(` Anfitrión cierra manualmente la sala ${codigo}`);
        
        // Notificar a todos los jugadores
        io.to(codigo).emit("salaCerrada", "El anfitrión ha cerrado la sala");
        
        // Eliminar la sala
        eliminarSala(codigo);
      }
    }
  });

  // Evento para que un jugador abandone la sala voluntariamente
  socket.on("abandonarSala", ({ codigo }) => {
    const salaIndex = salas.findIndex(sala => sala.codigo === codigo);
    
    if (salaIndex !== -1) {
      const sala = salas[salaIndex];
      const jugadorIndex = sala.jugadores.findIndex(jugador => jugador.id === socket.id);
      
      if (jugadorIndex !== -1) {
        const jugador = sala.jugadores[jugadorIndex];
        
        // Remover jugador
        sala.jugadores.splice(jugadorIndex, 1);
        socket.leave(codigo);
        
        console.log(` ${jugador.username} abandonó voluntariamente la sala ${codigo}`);
        
        // Si era el anfitrión, cerrar sala para todos
        if (jugador.username === sala.anfitrion) {
          console.log(` Anfitrión ${jugador.username} abandonó - Eliminando sala`);
          
          io.to(codigo).emit("salaCerrada", "El anfitrión ha abandonado la sala");
          eliminarSala(codigo);
        } else {
          // Actualizar lista de jugadores
          io.to(codigo).emit("usersInRoom", sala.jugadores);
        }
      }
    }
  });

  // Iniciar la partida (solo el anfitrión)
  socket.on("iniciarJuego", ({ codigo }) => {
    const sala = salas.find(s => s.codigo === codigo);
    if (!sala) return;
    
    console.log(` Juego iniciado en sala`, codigo);
    io.to(codigo).emit("gameStarted", true);
  });
});