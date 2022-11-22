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

app.get('/', (req, res) => {
    socketIO.on('connection', (socket) => {
        console.log(`⚡: ${socket.id} user just connected!`);
        // setInterval(() => {
        //     res.send(console.log("AAA"))
        // }, 1000);
        socket.on('disconnect', () => {
            console.log('🔥: A user disconnected');
        });
    });
    res.json({
        message: 'Hello world',
    });
});

http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});