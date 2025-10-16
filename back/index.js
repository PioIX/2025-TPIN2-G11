
var express = require('express');              
var bodyParser = require('body-parser');        
var cors = require('cors');                     
var session = require('express-session');       
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
  saveUninitialized: true,
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

const rooms = {};

io.on("connection", (socket) => {
  console.log(" Usuario conectado:", socket.id);

  socket.on("joinRoom", ({ codigo, username }) => {
    socket.join(codigo);

    if (!rooms[codigo]) rooms[codigo] = [];
    if (!rooms[codigo].some(u => u.id === socket.id)) {
      rooms[codigo].push({ id: socket.id, username });
    }

    console.log(` ${username} se unió a la sala ${codigo}`);
    io.to(codigo).emit("usersInRoom", rooms[codigo]);
  });

  socket.on("disconnect", () => {
    for (const codigo in rooms) {
      rooms[codigo] = rooms[codigo].filter(u => u.id !== socket.id);
      io.to(codigo).emit("usersInRoom", rooms[codigo]);
    }
    console.log(" Usuario desconectado:", socket.id);
  });
});

app.get('/', function (req, res) {
  res.status(200).send({
    message: 'GET Home route working fine!'
  });
});

server.listen(port, function () {
  console.log(` Server running at http://localhost:${port}`);
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/verifyUser", async (req, res) => {
  try {
    const { username, password } = req.query;

    const check = await realizarQuery(
      `SELECT * FROM Users WHERE username = "${username}" AND password = "${password}"`
    );

    if (check.length > 0) {
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
    console.log("Usuario creado:", nuevo);

    return res.send({
      message: "ok",
      username,
      id: nuevo[0].id 
    });

  } catch (error) {
    console.error("❌ Error en /regUser:", error);
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////