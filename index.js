var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const dns = require('dns');
const urlparser = require('url');
var mongoose = require('mongoose');
require('dotenv').config()
app.use(bodyParser.json()); //link em json
app.use(express.static('public'));

const urlShort = require('./components/url_short');
const hora = require('./components/hora.js');
const dados = require('./components/dados.js');
const tracker = require('./components/tracker.js');
const fileUpload = require('./components/fileUpload.js');


// mongo connect
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Running in http://localhost:${PORT}`);
})

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require('cors');

app.use(cors({ optionsSuccessStatus: 200 }));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});
app.get("/url/", function (req, res) {
  res.sendFile(__dirname + '/views/url_api.html');
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello APIi' });
});

//Data e Hora - /time/api/:date_string
hora(app)
//Data Hora FIM - /time/api/:date_string
//------------------------------------------------


//dados do usuário - /dados/api/whoami
dados(app)
//END dados do usuário - /dados/api/whoami
//------------------------------------------------

//URL encurta - /url/api/shorturl
urlShort(app)
//END URL encurta - /url/api/shorturl
//------------------------------------------------

//Rastreador de Exercícios - /tracker/api/users
tracker(app)

//END Rastreador de Exercícios - /tracker/api/users
//------------------------------------------------

//Upload de arquivo - /file/api/fileanalyse
//multer({dest: './public/uploads/'}) saves to folder /public/uploads/

fileUpload(app)
//Upload de arquivo - /file/api/fileanalyse
//------------------------------------------------


/* // listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
}); */

// Export the Express API
module.exports = app;