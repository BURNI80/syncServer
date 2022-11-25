const express = require('express');
const app = express();
const PORT = process.env.PORT;

//New imports
const http = require('http').Server(app);
var socketIO = require("socket.io")(http);
const cors = require('cors');

// const socketIO = new Server();
// const socketIO = require('socket.io')(http, {
//     cors: {
//         origin: "https://sync-server-beige.vercel.app",
//         methods: ["GET", "POST"],
//         credentials: true
//       }
// });

app.use(cors())


var num = 100
var timerId = false;


socketIO.on('connection', (socket) => {
    console.log("Usuario connectado:" + socket);

    function timerStart(){
        timerId = setInterval(() => {
            num--
            console.log(num);
            socket.broadcast.emit("envio", num)
        }, 1000);
    }

    function timerStop(){
        console.log("Pausa");
        clearInterval(timerId)
        timerId = false
        socket.broadcast.emit("envio", num)
    }




    socket.on("start", () => {
        timerStart();
    })

    socket.on("stop", () => {
        timerStop()
    })

    socket.on("estado", () => {
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