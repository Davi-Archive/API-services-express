// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const dns = require('dns');
const urlparser = require('url');
var mongoose = require('mongoose');
require('dotenv').config()
app.use(bodyParser.json()); //link em json

// mongo connect
mongoose.connect(process.env.DB_URI,  { useNewUrlParser: true, useUnifiedTopology: true });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Running in http://localhost:${PORT}`);
})

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require('cors');
const { application } = require('express');
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

app.get("/time/api", function (req, res) {
  let now = new Date()
  res.json({
    "unix": now.getTime(),
    "utc": now.toUTCString()
  })
})

app.get("/time/api/:date_string", function (req, res) {
  let dateString = req.params.date_string
  let stringPassed = new Date(dateString)

  if (parseInt(dateString) > 10000) {
    let unixTime = new Date(parseInt(dateString))
    res.json({
      "unix": unixTime.getTime(),
      "utc": unixTime.toUTCString()
    })
  }


  if (stringPassed == 'Invalid Date') {
    res.json({ error: "Invalid Date" })
  } else {
    res.json({
      "unix": stringPassed.getTime(),
      "utc": stringPassed.toUTCString()
    })
  }
})
//Data Hora FIM - /time/api/:date_string
//------------------------------------------------

//dados do usuário - /dados/api/whoami

app.get("/dados/api/whoami", function (req, res) {
  res.json({
    "ipaddress": req.ip || 'not found',
    "language": req.headers["accept-language"] || 'not found',
    "software": req.headers['user-agent'] || 'not found',
  })
})

//END dados do usuário - /dados/api/whoami
//------------------------------------------------

//URL encurta - /url/api/shorturl

//mongoose connect + SCHEMA
const ShortURL = mongoose.model('ShortURL', new mongoose.Schema({
  url: String,
}));
// ShortURL Schema END
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));


app.post('/url/api/shorturl/', jsonParser, function (req, res) {
  let client_requested_url = req.body.url
  dns.lookup(urlparser.parse(client_requested_url).hostname, (error, address) => {
    if (!address){
      res.json({ error: 'invalid url' })
    } else {
      const url = new ShortURL({ url: client_requested_url })
      url.save((err, data) => {
        res.json({
          original_url: data.url,
          short_url: data.id
        })
      })
    }
  })
})

app.get('/url/api/shorturl/:id', function(req, res){
    const id = req.params.id;
    ShortURL.findById(id, (err,data) =>{
      if(!data){
        res.json({ error: 'invalid url' })
      } else {
        res.redirect(data.url)
      }
    })
})



//END URL encurta - /url/api/shorturl
//------------------------------------------------


//Rastreador de Exercícios - /tracker/api/users
const {Schema} = mongoose;

//Schema
const ExerciseSchema = new Schema({
  userId: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
});

const UserSchema = new Schema({
  username: String
});

//model
const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Execise", ExerciseSchema);

app.post("/tracker/api/users/", function (req, res) {
  const newUser = new User({
    username: req.body.username
  })
  newUser.save(function (err, data){
    if(err || !data) throw err;
    else{
      res.json(data)
    }
  })
})

app.post("/tracker/api/users/:id/exercises", function (req, res) {
  const id = req.params.id
  User.findById(id, (err, userData) => {
    const id = req.params.id;
    const {description, duration, date} = req.body;
    User.findById(id, (err, userData)=>{
      if(err || !userData){
        res.send("Could not find the user.")
      } else {
        const newExercise = new Exercise({
          userId: id,
          description,
          duration,
          date: new Date(date)
        })
        newExercise.save((err,data)=>{
          if(err){
            res.send("Could not save the exercise")
          } else {
            const {description, duration, date, _id} = data;
            res.json({
              username: userData.username,
              description,
              duration,
              date: date.toDateString(),
              _id: userData.id
            })
          }
        })
      }
    })
  })
})

app.get("/tracker/api/users/:id/logs", (req, res)=>{
  const {from, to, limit} = req.query;
  const {id} = req.params;
  User.findById(id, (err, userData)=>{
    if (err || !userData){
      res.send("Could not find user")
    }else{
      let dateObj ={}
      if(from){
        dateObj["$gte"] = new Date(from)
      }
      if(to){
        dateObj["$lte"] = new Date(to)
            }
            let filter = {
              userId: id,
              dateObj
            }
      if( from || to ){
        filter.date = dateObj
      }
      let noNullLimit = limit ?? 500
      Exercise.find(filter).limit(+noNullLimit).exec((err,data)=>{
        if(err || !data){
          res.json([])
        }else{
          const count = data.length
          const rawLog = data
          const {username, _id} = userData
          const log = rawLog.map((l)=> ({
            description: l.description,
            duration: l.duration,
            date: l.date.toDateString()
          }))
          res.json(username, count, _id, log)
        }
      })
    }
  })
})

app.get("/tracker/api/users/", function (req, res) {
  User.find({}, (err,data)=>{
    if(err || !data){
      res.send("No Users")
    } else {
      res.json(data)
    }
  })
})

//END Rastreador de Exercícios - /tracker/api/users
//------------------------------------------------

//Upload de arquivo - /file/api/fileanalyse

app.post("/file/api/fileanalyse", function (req, res) {
  res.json({
    "upload": "FILE"
  })
})

//Upload de arquivo - /file/api/fileanalyse
//------------------------------------------------


/* // listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
}); */
