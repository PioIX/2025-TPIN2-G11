
var express = require('express'); //Tipo de servidor: Express
var bodyParser = require('body-parser'); //Convierte los JSON
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');
const session = require('express-session'); // Para el manejo de las variables de sesión


var app = express(); //Inicializo express
var port = process.env.PORT || 4000; //Ejecuto el servidor en el puerto 4000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

//Pongo el servidor a escuchar
const server = app.listen(port, function () {
    console.log(`Server running in http://localhost:${port}`);
});

const io = require('socket.io')(server, {
    cors: {
        // IMPORTANTE: REVISAR PUERTO DEL FRONTEND
        origin: ["http://localhost:3000", "http://localhost:3001"], // Permitir el origen localhost:3000
        methods: ["GET", "POST", "PUT", "DELETE"],   // Métodos permitidos
        credentials: true                           // Habilitar el envío de cookies
    }
});


io.on("connection", (socket) => {
  socket.on("joinRoom", ({ codigo, username }) => {
    socket.join(codigo);

    if (!rooms[codigo]) rooms[codigo] = [];
    if (!rooms[codigo].some(u => u.id === socket.id)) {
      rooms[codigo].push({ id: socket.id, username });
    }

    io.to(codigo).emit("usersInRoom", rooms[codigo]);
  });

  socket.on("disconnect", () => {
    for (const codigo in rooms) {
      rooms[codigo] = rooms[codigo].filter(u => u.id !== socket.id);
      io.to(codigo).emit("usersInRoom", rooms[codigo]);
    }
  });
});

app.use(sessionMiddleware);

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
        let check = await realizarQuery(
            `SELECT * FROM Users WHERE username = "${req.body.username}" AND password = "${req.body.password}"`
        );

        if (check.length > 0) {
            return res.send({
                message: "ok",
                username: req.body.username,
                id: check[0].id
            });
        } else {
            if (req.body.username == "" || req.body.password == "") {
                return res.send({
                    message: "Verifica si ambos campos fueron rellenados"
                });
            } else {
                return res.send({
                    message: "Verifica si el usuario existe y coincide con la contraseña."
                });
            }
        }

    } catch (error) {
        return res.send(error);
    }
});

app.post("/regUser", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.send({ message: "Por favor complete todos los campos" });
        }
        let check = await realizarQuery(
            `SELECT * FROM Users WHERE username = "${username}"`
        );

        if (check.length < 1) {
            await realizarQuery(
                `INSERT INTO Users(username,password) VALUES("${username}","${password}")`
            );

            check = await realizarQuery(
                `SELECT * FROM Users WHERE username = "${username}"`
            );

            res.send({
                message: "ok",
                username: username,
                id: check[0].id
            });

        } else {
            res.send({
                message: "El nombre de usuario ya está registrado, prueba con otro."
            });
        }
    } catch (error) {
        res.send(error);
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