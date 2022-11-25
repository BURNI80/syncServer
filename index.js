const express = require('express');
const app = express();
const PORT = 4000;

//New imports
const http = require('http').Server(app);
const cors = require('cors');

const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000"
    }
});

app.use(cors());


var num = 100

var timerId = setInterval(() => {
    console.log("SSSS");
}, 1000);
clearInterval(timerId)


socketIO.on('connection', (socket) => {
    console.log("Usuario connectado:" + socket);

    socket.on("start", () => {
        timerId = setInterval(() => {
            num--
            console.log(num);
            socket.emit("envio", num)
        }, 1000);
    })

    socket.on("stop", () => {
        console.log("Pausa");
        clearInterval(timerId)
        socket.broadcast.emit("envio", num)
    })





    socket.on('disconnect', () => {
        console.log('🔥: A user disconnected');
    });
});


app.get('/', (req, res) => {
    res.json({
        message: 'Hello world',
    });
});

http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});