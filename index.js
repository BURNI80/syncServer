const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;
// const PORT = 3002;
const urlApi = "https://apitimersagc.azurewebsites.net/";

//New imports
const http = require('http').Server(app);
const cors = require('cors');
const { default: axios } = require('axios');
app.use(cors());
const socketIO = require("socket.io")(http, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors())

var timerId = false;
var intervaloComprovarHora = false;
var corriendo = false
var timersOrdenados = []
var categoriasTimer = []
var tiempoActual = 0


function getDuracionByID(id) {
    for (let i = 0; i < categoriasTimer.length; i++) {
        if (categoriasTimer[i].idCategoria === id) {
            return categoriasTimer[i].duracion;
        }
    }
    return null;
}

socketIO.on('connection', (socket) => {
    // !DESCOMENTAR
    console.log("📡 Usuario connectado:" + socket.id);



    function syncData() {
        var ahora = new Date();
        console.log("Fecha actual Servidor:" + ahora)
        var fechaActual = new Date();
        let unahora = 60 * 60 * 1000; // una hora en milisegundos
        fechaActual = new Date(fechaActual.getTime() + unahora);
        console.log("Fecha España: " + fechaActual)


        
        if (corriendo === false) {
            //Pausa Intervalos Exisztentes
            clearInterval(intervaloComprovarHora);
            intervaloComprovarHora = false;

            axios.get(urlApi + "api/CategoriasTimer").then(res => {
                categoriasTimer = res.data
            })



            //Busca los timers y los ordena por fecha
            axios.get(urlApi + "api/timers").then(res => {
                var timers = res.data;

                // function ordenarTimers(timers) {
                //     return timers.sort((a, b) => {
                //         const timeA = new Date(a.inicio);
                //         const timeB = new Date(b.inicio);
                //         return timeA - timeB;
                //     });
                // }

                function ordenarTimers(timers) {
                    // Sort the timers by inicio
                    timers.sort((a, b) => {
                        if (a.inicio < b.inicio) {
                            return -1;
                        } else if (a.inicio > b.inicio) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });

                    // Get the current date and time
                    var now = new Date();
                    let unahora = 60 * 60 * 1000; // una hora en milisegundos
                    now = new Date(now.getTime() + unahora);

                    // Filter out timers whose inicio is in the past
                    const filteredTimers = timers.filter(timer => {
                        const startTime = new Date(timer.inicio);
                        return startTime >= now;
                    });

                    return filteredTimers;
                }

                //Timers Ordenados
                timersOrdenados = ordenarTimers(timers);
                console.log("Datos Sincronizados");


                console.log("Comprobacion Creada.");
                // Cada segungo comprueba si el timer deberia haber empezado
                intervaloComprovarHora = setInterval(() => {
                    function inicioTimer(hora, minuto, dia, mes, anio) {
                        var fechaActual = new Date();
                        let unahora = 60 * 60 * 1000; // una hora en milisegundos
                        fechaActual = new Date(fechaActual.getTime() + unahora);
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
                            // El tiempo ha empezado
                            timerStart()




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
                    if (timersOrdenados.length > 0) {
                        var fecha = getHoursAndMinutes(timersOrdenados[0].inicio)
                        //Manda ls fecha del primer timer y compreba si deberia empezar o no
                        inicioTimer(fecha.hours, fecha.minutes, fecha.day, fecha.month, fecha.year)
                    }


                }, 1000);
            })

        }


    }

    function panic(){
        clearInterval(intervaloComprovarHora);
        intervaloComprovarHora = false;
        clearInterval(timerId);
        timerId = false;
        syncData() 
    }


    socket.on("syncData", () => {
        syncData();
    })

    socket.on("panic", () => {
        panic();

    })

    function timerStart() {
        if (timersOrdenados.length > 0) {
            var fechaTimer = new Date(timersOrdenados[0].inicio);
            var idTimer = timersOrdenados[0].idTemporizador
            var fechaActual = new Date();
            let unahora = 60 * 60 * 1000; // una hora en milisegundos
            fechaActual = new Date(fechaActual.getTime() + unahora);
            if (fechaActual < fechaTimer) {
                syncData()
            } else {
                var duracion = getDuracionByID(timersOrdenados[0].idCategoria)
                tiempoActual = duracion * 60
                console.log("Cuenta Atras Creada.");
                timerId = setInterval(() => {
                    corriendo = true
                    tiempoActual--
                    console.log(tiempoActual);
                    if (tiempoActual <= 0) {
                        // Ha terminado el timer
                        console.log("Timer Terminado");
                        clearInterval(timerId)
                        timerId = false
                        corriendo = false
                        // Elimina el timer gastado
                        timersOrdenados.shift()
                        // Inicia el siguiente
                        timerStart()

                    }
                    else{
                        socket.broadcast.emit("timerID", idTimer)
                        socket.broadcast.emit("envio", tiempoActual)
                    }
                }, 1000);
            }
        }else{
            syncData()
        }
    }


    // function timerStop() {
    //     console.log("Pausa");
    //     clearInterval(timerId)
    //     timerId = false
    //     socket.broadcast.emit("envio", tiempoActual)
    // }

    // socket.on("reset", () => {
    //     console.log("reset");
    //     tiempoActual = 100;
    //     socket.broadcast.emit("envio", tiempoActual)
    // })

    // socket.on("stop", () => {
    //     timerStop()
    // })


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