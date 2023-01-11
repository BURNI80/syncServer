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
var fechaInicioManual = null;

// Funcion en la que mandas el ID del timer y retorna los segundos que dura
function getDuracionByID(id) {
    for (let i = 0; i < categoriasTimer.length; i++) {
        if (categoriasTimer[i].idCategoria === id) {
            return categoriasTimer[i].duracion * 60;
        }
    }
    return null;
}

// añade una hora a una fecha
function addUnaHora(date) {
    return new Date(date.getTime() + 60 * 60 * 1000);
}
// añade una hora y resta un minuto a una fecha
function addHoraMinuto(date) {
    return new Date(date.getTime() + (60 - 1) * 60 * 1000);
}

// Funcion ordena los timers por fecha de inicio y descarta los anteriores a la fecha enviada por parametro
function ordenarTimers(timers, fechaParam) {
    var fechaComp = null;
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
    if (fechaParam == null) {
        fechaComp = new Date();
        fechaComp = addUnaHora(fechaComp)

    } else {
        fechaComp = fechaParam;
        fechaComp = addHoraMinuto(fechaComp)
    }
    // Filter out timers whose inicio is in the past
    const filteredTimers = timers.filter(timer => {
        const startTime = new Date(timer.inicio);
        return startTime >= fechaComp;
    });

    return filteredTimers;
}


// Funcion que calcula la diferencia en minutos entre dos fechas
function calcularDiferencia(date1, date2) {
    var diffInMilliseconds = date1 - date2;
    var solucion = diffInMilliseconds / (1000 * 60)
    if (solucion > 0) {
        return Math.ceil(solucion);
    }
    else {
        return Math.floor(solucion);
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
        minutes: date.getMinutes(),
        seconds: date.getSeconds()
    };
}



socketIO.on('connection', (socket) => {
    //! **************************
    // console.log("📡 Usuario connectado:" + socket.id);


    // // *SyncData vieja
    // function syncData() {
    //     var ahora = new Date();
    //     console.log("Fecha actual Servidor:" + ahora)
    //     var fechaActual = new Date();
    //     let unahora = 60 * 60 * 1000; // una hora en milisegundos
    //     fechaActual = new Date(fechaActual.getTime() + unahora);
    //     console.log("Fecha España: " + fechaActual)



    //     if (corriendo === false) {
    //         //Pausa Intervalos Exisztentes
    //         clearInterval(intervaloComprovarHora);
    //         intervaloComprovarHora = false;

    //         axios.get(urlApi + "api/CategoriasTimer").then(res => {
    //             categoriasTimer = res.data
    //         })



    //         //Busca los timers y los ordena por fecha
    //         axios.get(urlApi + "api/timers").then(res => {
    //             var timers = res.data;

    //             // function ordenarTimers(timers) {
    //             //     return timers.sort((a, b) => {
    //             //         const timeA = new Date(a.inicio);
    //             //         const timeB = new Date(b.inicio);
    //             //         return timeA - timeB;
    //             //     });
    //             // }

    //             function ordenarTimers(timers) {
    //                 // Sort the timers by inicio
    //                 timers.sort((a, b) => {
    //                     if (a.inicio < b.inicio) {
    //                         return -1;
    //                     } else if (a.inicio > b.inicio) {
    //                         return 1;
    //                     } else {
    //                         return 0;
    //                     }
    //                 });

    //                 // Get the current date and time
    //                 var now = new Date();
    //                 let unahora = 60 * 60 * 1000; // una hora en milisegundos
    //                 now = new Date(now.getTime() + unahora);

    //                 // Filter out timers whose inicio is in the past
    //                 const filteredTimers = timers.filter(timer => {
    //                     const startTime = new Date(timer.inicio);
    //                     return startTime >= now;
    //                 });

    //                 return filteredTimers;
    //             }

    //             //Timers Ordenados
    //             timersOrdenados = ordenarTimers(timers);
    //             console.log("Datos Sincronizados");


    //             console.log("Comprobacion Creada.");
    //             // Cada segungo comprueba si el timer deberia haber empezado
    //             intervaloComprovarHora = setInterval(() => {
    //                 function inicioTimer(hora, minuto, dia, mes, anio) {
    //                     var fechaActual = new Date();
    //                     let unahora = 60 * 60 * 1000; // una hora en milisegundos
    //                     fechaActual = new Date(fechaActual.getTime() + unahora);
    //                     var alertTime = new Date();
    //                     alertTime.setHours(hora);
    //                     alertTime.setMinutes(minuto);
    //                     alertTime.setDate(dia);
    //                     alertTime.setMonth(mes);
    //                     alertTime.setFullYear(anio);
    //                     if (fechaActual >= alertTime) {
    //                         //Muestra que el timer deberia haber empezado
    //                         clearInterval(intervaloComprovarHora);
    //                         intervaloComprovarHora = false;
    //                         console.log("Empieza a contar!");
    //                         // El tiempo ha empezado
    //                         timerStart()




    //                     }
    //                 }



    //                 // Funcion sacar datos de la fecha del timer
    //                 function getHoursAndMinutes(timeString) {
    //                     const date = new Date(timeString);
    //                     return {
    //                         day: date.getDate(),
    //                         month: date.getMonth(),
    //                         year: date.getFullYear(),
    //                         hours: date.getHours(),
    //                         minutes: date.getMinutes()
    //                     };
    //                 }

    //                 //Saca los datos de la fecha del timer
    //                 if (timersOrdenados.length > 0) {
    //                     var fecha = getHoursAndMinutes(timersOrdenados[0].inicio)
    //                     //Manda ls fecha del primer timer y compreba si deberia empezar o no
    //                     inicioTimer(fecha.hours, fecha.minutes, fecha.day, fecha.month, fecha.year)
    //                 }


    //             }, 1000);
    //         })

    //     }


    // }
    // // *Funcion vieja
    // function timerStart() {
    //     if (timersOrdenados.length > 0) {
    //         var fechaTimer = new Date(timersOrdenados[0].inicio);
    //         var idTimer = timersOrdenados[0].idTemporizador
    //         var fechaActual = new Date();
    //         let unahora = 60 * 60 * 1000; // una hora en milisegundos
    //         var fechaActualizada = new Date(fechaActual.getTime() + unahora);
    //         if (fechaActualizada < fechaTimer) {
    //             syncData()
    //         } else {
    //             var duracion = getDuracionByID(timersOrdenados[0].idCategoria)
    //             tiempoActual = duracion * 60
    //             console.log("Cuenta Atras Creada.");
    //             timerId = setInterval(() => {
    //                 corriendo = true
    //                 tiempoActual--
    //                 console.log(tiempoActual);
    //                 socket.broadcast.emit("timerID", idTimer)
    //                 socket.broadcast.emit("envio", tiempoActual)
    //                 if (tiempoActual <= 0) {
    //                     // Ha terminado el timer
    //                     console.log("Timer Terminado");
    //                     clearInterval(timerId)
    //                     timerId = false
    //                     corriendo = false
    //                     // Elimina el timer gastado
    //                     timersOrdenados.shift()
    //                     // Inicia el siguiente
    //                     timerStart()
    //                 }

    //             }, 1000);
    //         }
    //     } else {
    //         syncData()
    //     }
    // }






    function syncData(fecha) {
        if(corriendo === false){
            // Muestra la hora del sistema donde esta hosteado
            //! **************************
    
            // var ahora = new Date();
            // console.log("Fecha actual Servidor:" + ahora)
            // var fechaActual = new Date();
            // let unahora = 60 * 60 * 1000; // una hora en milisegundos
            // fechaActual = new Date(fechaActual.getTime() + unahora);
            // console.log("Fecha España: " + fechaActual)
    
            //guarda las categorias
            axios.get(urlApi + "api/CategoriasTimer").then(res => {
                categoriasTimer = res.data
                console.log("Categorias sincronizadas");
            })
    
            //guarda los timers
            axios.get(urlApi + "api/timers").then(res => {
                var timers = res.data;
                timersOrdenados = ordenarTimers(timers, fecha);
                // console.log(timersOrdenados)
                console.log("Timers sincronizados");
            })
        }

    }

    function startTimersManul() {
        console.log("Inicio manual.");
        var fechaInicioManual = new Date();
        var fechaTimer = new Date(timersOrdenados[0].inicio);
        var diffMinutos = calcularDiferencia(addUnaHora(fechaInicioManual), fechaTimer)

        axios.put(urlApi + "/api/timers/IncreaseTimers/" + diffMinutos).then(res => {
            if (res.status === 200) {
                console.log("Timers incrementados en " + diffMinutos + " minutos");
                syncData(fechaInicioManual);
            }
        })
        timerStart();

    }

    function continuarTimers() {

        //Saca los datos de la fecha del timer
        var fecha = getHoursAndMinutes(timersOrdenados[0].inicio)
        //Manda ls fecha del primer timer y compreba si deberia empezar o no
        inicioTimer(fecha.hours, fecha.minutes, fecha.seconds, fecha.day, fecha.month, fecha.year)

        function inicioTimer(hora, minuto, seg, dia, mes, anio) {

            var fechaTimer = new Date();
            fechaTimer.setHours(hora);
            fechaTimer.setMinutes(minuto);
            fechaTimer.setSeconds(seg);
            fechaTimer.setDate(dia);
            fechaTimer.setMonth(mes);
            fechaTimer.setFullYear(anio);
            console.log("Comp creada");
            var fechaActualSync = addUnaHora(new Date());
            if (fechaActualSync < fechaTimer) {
                syncData();
            }

            intervaloComprovarHora = setInterval(() => {
                var fechaActual = addUnaHora(new Date());
                console.log(fechaActual)
                console.log(fechaTimer)
                console.log("----------------------------");
                if (fechaActual >= fechaTimer) {
                    console.log("Empieza el timer");
                    clearInterval(intervaloComprovarHora);
                    intervaloComprovarHora = false;
                    timerStart()
                }
            }, 1000)
        }
    }

    function timerStart() {

        var tiempoRestante = getDuracionByID(timersOrdenados[0].idCategoria)
        console.log("Tiempo rest : " + tiempoRestante)
        var idTimer = timersOrdenados[0].idTemporizador
        corriendo = true
        var intervaloTimer = setInterval(() => {
            tiempoRestante--;
            console.log(tiempoRestante);
            socket.broadcast.emit("timerID", idTimer)
            socket.broadcast.emit("envio", tiempoRestante)
            if (tiempoRestante <= 0) {
                console.log("Timer Terminado!");
                clearInterval(intervaloTimer)
                intervaloTimer = false
                corriendo = false
                timersOrdenados.shift()
                if (timersOrdenados.length > 0) {
                    continuarTimers()
                } else {
                    syncData(null)
                }
            }
        }, 1000);
    }


    socket.on("start", () => {
        if (timersOrdenados.length > 0) {
            if (corriendo == true) {
                console.log("Ya hay un timer corriendo");
            }
            else {
                startTimersManul();
            }
        }
        else {
            console.log("Has intentado iniciar y no hay timers");
        }
    })


    socket.on("syncData", () => {
        syncData(null);
    })


    socket.on("panic", () => {
        panic();

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