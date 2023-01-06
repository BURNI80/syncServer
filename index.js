const express = require('express');
const app = express();
// const PORT = process.env.PORT;
const PORT = 3001;
const urlApi = "https://apitimersagc.azurewebsites.net/api/timers";

//New imports
const http = require('http').Server(app);
const cors = require('cors');
const { default: axios } = require('axios');

const socketIO = require("socket.io")(http, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors())

var num = 100
var timerId = false;
var intervaloComprovarHora = false;
var timersOrdenados = []


function getTimers() {
    //Pausa Intervalos Exisztentes
    clearInterval(intervaloComprovarHora);
    intervaloComprovarHora = false;


    //Busca los timers y los ordena por fecha
    axios.get(urlApi).then(res => {
        var timers = res.data;

        function ordenarTimers(timers) {
            return timers.sort((a, b) => {
                const timeA = new Date(a.inicio);
                const timeB = new Date(b.inicio);
                return timeA - timeB;
            });
        }
        //Timers Ordenados
        timersOrdenados = ordenarTimers(timers);


        



        // Cada segungo comprueba si el timer deberia haber empezado
        intervaloComprovarHora = setInterval(() => {
            function inicioTimer(hora, minuto, dia, mes, anio) {
                var fechaActual = new Date();
                var alertTime = new Date();
                alertTime.setHours(hora);
                alertTime.setMinutes(minuto);
                alertTime.setDate(dia);
                alertTime.setMonth(mes);
                alertTime.setFullYear(anio);
                if (fechaActual >= alertTime) {
                    //Muestra que el timer deberia haber empezado
                    clearInterval(intervaloComprovarHora);
                    intervaloComprovarHora = false;
                    console.log("Empieza a contar!");

                    


                }
            }

            // Funcion sacar datos de la fecha del timer
            function getHoursAndMinutes(timeString) {
                const date = new Date(timeString);
                return {
                    day: date.getDate(),
                    month: date.getMonth(),
                    year: date.getFullYear(),
                    hours: date.getHours(),
                    minutes: date.getMinutes()
                };
            }

            //Saca los datos de la fecha del timer
            var fecha = getHoursAndMinutes(timersOrdenados[0].inicio)
            //Manda ls fecha del primer timer y compreba si deberia empezar o no
            inicioTimer(fecha.hours,fecha.minutes,fecha.day,fecha.month,fecha.year)



        }, 1000);
    })
}

getTimers()













socketIO.on('connection', (socket) => {
    // !DESCOMENTAR
    // console.log("Usuario connectado:" + socket.id);






    function timerStart() {
        timerId = setInterval(() => {
            num--
            console.log(num);
            socket.broadcast.emit("envio", num)
        }, 1000);
    }

    function timerStop() {
        console.log("Pausa");
        clearInterval(timerId)
        timerId = false
        socket.broadcast.emit("envio", num)
    }




    socket.on("start", () => {
        timerStart();
    })

    socket.on("reset", () => {
        console.log("reset");
        num = 100;
        socket.broadcast.emit("envio", num)
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