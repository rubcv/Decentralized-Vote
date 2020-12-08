'use strict';

// Framework express
var express = require('express');
var app = express();

// Request y parametros de conexion
var resquest = require('request');
var https = require('https');
var bodyParser = require('body-parser');
var cors = require('cors');

// Acceder a las claves https (/https_keys)
var fs = require('fs');


// CONFIGURAR APP

const PORT = 8081;

app.set('port', PORT);
app.set('rest', resquest);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
    next();
});


app.use(bodyParser.json( {limit: '50mb', extended: true} ));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static('public'));
app.use(cors());

//      RUTAS

require("./src/routes")(app);


//  LANZAR SERVIDOR

https.createServer({
    key: fs.readFileSync('./https_keys/server.key'),
    cert: fs.readFileSync('./https_keys/server.cert')
}, app)
    .listen(PORT, function () {
        console.log("=> Servidor activo en el puerto: ", PORT);
    })