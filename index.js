// index.js
// where your node app starts

// init project
let multer = require('multer') // file parser middleware
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const dns = require('dns');
const urlparser = require('url');
var mongoose = require('mongoose');
require('dotenv').config()
app.use(bodyParser.json()); //link em json
app.use(express.static('public'));

// mongo connect
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Running in http://localhost:${PORT}`);
})

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require('cors');
const { response } = require('express');
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
app.get("/time", (req, res)=>{
  res.sendFile(__dirname+"/views/time.html")
})


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
app.get("/dados/", (req, res) => {
  res.sendFile(__dirname + "/views/dados.html")
})

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
    if (!address) {
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

app.get('/url/api/shorturl/:id', function (req, res) {
  const id = req.params.id;
  ShortURL.findById(id, (err, data) => {
    if (!data) {
      res.json({ error: 'invalid url' })
    } else {
      res.redirect(data.url)
    }
  })
})



//END URL encurta - /url/api/shorturl
//------------------------------------------------
app.get("/tracker/", (req, res) => {
  res.sendFile(__dirname + "/views/tracker.html")
})

//Rastreador de Exercícios - /tracker/api/users
const { Schema } = mongoose;
const userSchema = new Schema({
  "username": String,
})

const exerciseSchema = new Schema({
  "username": String,
  "date": Date,
  "duration": Number,
  "description": String,
})

const logSchema = new Schema({
  "username": String,
  "count": Number,
  "log": Array,
})

// Models
const UserInfo = mongoose.model('userInfo', userSchema);
const ExerciseInfo = mongoose.model('exerciseInfo', exerciseSchema);
const LogInfo = mongoose.model('logInfo', logSchema);




// Middlware
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static('public'))
// Api Endpoints

// #1
app.post('/tracker/api/users', (req, res) => {
  UserInfo.find({ "username": req.body.username }, (err, userData) => {
    if (err) {
      console.log("Error with server=> ", err)
    } else {
      if (userData.length === 0) {
        const test = new UserInfo({
          "_id": req.body.id,
          "username": req.body.username,
        })

        test.save((err, data) => {
          if (err) {
            console.log("Error saving data=> ", err)
          } else {
            res.json({
              "_id": data.id,
              "username": data.username,
            })
          }
        })
      } else {
        res.send("Username already Exists")
      }
    }
  })
})

// #2
app.post('/tracker/api/users/:_id/exercises', (req, res) => {
  let idJson = { "id": req.params._id };
  let checkedDate = new Date(req.body.date);
  let idToCheck = idJson.id;

  let noDateHandler = () => {
    if (checkedDate instanceof Date && !isNaN(checkedDate)) {
      return checkedDate
    } else {
      checkedDate = new Date();
    }
  }

  UserInfo.findById(idToCheck, (err, data) => {
    noDateHandler(checkedDate);

    if (err) {
      console.log("error with id=> ", err);
    } else {
      const test = new ExerciseInfo({
        "username": data.username,
        "description": req.body.description,
        "duration": req.body.duration,
        "date": checkedDate.toDateString(),
      })

      test.save((err, data) => {
        if (err) {
          console.log("error saving=> ", err);
        } else {
          console.log("saved exercise successfully");
          res.json({
            "_id": idToCheck,
            "username": data.username,
            "description": data.description,
            "duration": data.duration,
            "date": data.date.toDateString(),
          })
        }
      })
    }
  })
})

// change data for test

app.get('/tracker/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  let idJson = { "id": req.params._id };
  let idToCheck = idJson.id;

  // Check ID
  UserInfo.findById(idToCheck, (err, data) => {
    var query = {
      username: data.username
    }

    if (from !== undefined && to === undefined) {
      query.date = { $gte: new Date(from) }
    } else if (to !== undefined && from === undefined) {
      query.date = { $lte: new Date(to) }
    } else if (from !== undefined && to !== undefined) {
      query.date = { $gte: new Date(from), $lte: new Date(to) }
    }

    let limitChecker = (limit) => {
      let maxLimit = 100;
      if (limit) {
        return limit;
      } else {
        return maxLimit
      }
    }

    if (err) {
      console.log("error with ID=> ", err)
    } else {

      ExerciseInfo.find((query), null, { limit: limitChecker(+limit) }, (err, docs) => {
        let loggedArray = [];
        if (err) {
          console.log("error with query=> ", err);
        } else {

          let documents = docs;
          let loggedArray = documents.map((item) => {
            return {
              "description": item.description,
              "duration": item.duration,
              "date": item.date.toDateString()
            }
          })

          const test = new LogInfo({
            "username": data.username,
            "count": loggedArray.length,
            "log": loggedArray,
          })

          test.save((err, data) => {
            if (err) {
              console.log("error saving exercise=> ", err)
            } else {
              console.log("saved exercise successfully");
              res.json({
                "_id": idToCheck,
                "username": data.username,
                "count": data.count,
                "log": loggedArray
              })
            }
          })
        }
      })
    }
  })
})

// #4
app.get('/tracker/api/users', (req, res) => {
  UserInfo.find({}, (err, data) => {
    if (err) {
      res.send("No Users");
    } else {
      res.json(data);
    }
  })
})

//END Rastreador de Exercícios - /tracker/api/users
//------------------------------------------------

//Upload de arquivo - /file/api/fileanalyse
//multer({dest: './public/uploads/'}) saves to folder /public/uploads/

app.post("/file/api/fileanalyse", multer().single('upfile'), (req, res) => {
  console.log(req.file)
  res.json({
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  })
})

app.get("/file/", (req, res) => {
  res.sendFile(__dirname + '/views/file_upload.html');
})
//Upload de arquivo - /file/api/fileanalyse
//------------------------------------------------


/* // listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
}); */

// Export the Express API
module.exports = app;