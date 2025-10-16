
var express = require('express'); //Tipo de servidor: Express
var bodyParser = require('body-parser'); //Convierte los JSON
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');

var app = express(); //Inicializo express
var port = process.env.PORT || 4000; //Ejecuto el servidor en el puerto 4000

//Pongo el servidor a escuchar
app.listen(port, function () {
    console.log(`Server running in http://localhost:${port}`);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());


app.get('/', function (req, res) {
    res.status(200).send({
        message: 'GET Home route working fine!'
    });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

import { Server } from "socket.io";
const io = new Server(4000, { cors: { origin: "*" } });

const rooms = {};

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
