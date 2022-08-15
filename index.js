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

// PATH /api/users/ Requests
// GET: Show the contents of the User model
// POST: Store user into User model
app.route('/tracker/api/users').get((req, res) => {
  User.find({}, (error, data) => {
    //console.log(data);
    res.json(data);
  });
}).post((req, res) => {
  // Get username input into form
  const potentialUsername = req.body.username;
  console.log("potential username:", potentialUsername);

  // Check to see if the username has already been entered
  User.findOne({username: potentialUsername}, (error, data) => {
    if (error) {
      res.send("Unknown userID");
      return console.log(error);
    }

    if (!data) { // If username is not stored yet, create and save a User object
      const newUser = new User({
        username: potentialUsername
      });

      // Save the user
      newUser.save((error, data) => {
        if (error) return console.log(error);
        // Remove the key-value pair associated with the key __v
        const reducedData = {
          "username": data.username,
          "_id": data._id
        };
        res.json(reducedData);
        console.log(reducedData);
      });
    } else { // If username is already stored, send a message to the user
      res.send(`Username ${potentialUsername} already exists.`);
      console.log(`Username ${potentialUsername} already exists.`);
    }
  });
});

// PATH /api/users/:_id/exercises
// POST: Store new exercise in the Exercise model
app.post('/tracker/api/users/:_id/exercises', (req, res) => {
  // Get data from form
  const userID = req.body[":_id"] || req.params._id;
  const descriptionEntered = req.body.description;
  const durationEntered = req.body.duration;
  const dateEntered = req.body.date;

  // Print statement for debugging
  console.log(userID, descriptionEntered, durationEntered, dateEntered);

  // Make sure the user has entered in an id, a description, and a duration
  // Set the date entered to now if the date is not entered
  if (!userID) {
    res.json("Path `userID` is required.");
    return;
  }
  if (!descriptionEntered) {
    res.json("Path `description` is required.");
    return;
  }
  if (!durationEntered) {
    res.json("Path `duration` is required.");
    return;
  }

  // Check if user ID is in the User model
  User.findOne({"_id": userID}, (error, data) => {
    if (error) {
      res.json("Invalid userID");
      return console.log(error);
    }
    if (!data) {
      res.json("Unknown userID");
      return;
    } else {
      console.log(data);
      const usernameMatch = data.username;

      // Create an Exercise object
      const newExercise = new Exercise({
        username: usernameMatch,
        description: descriptionEntered,
        duration: durationEntered
      });

      // Set the date of the Exercise object if the date was entered
      if (dateEntered) {
        newExercise.date = dateEntered;
      }

      // Save the exercise
      newExercise.save((error, data) => {
        if (error) return console.log(error);

        console.log(data);

        // Create JSON object to be sent to the response
        const exerciseObject = {
          "_id": userID,
          "username": data.username,
          "date": data.date.toDateString(),
          "duration": data.duration,
          "description": data.description
        };

        // Send JSON object to the response
        res.json(exerciseObject);

      });
    }
  });
});


// PATH /api/users/:_id/logs?[from][&to][&limit]
app.get('/tracker/api/users/:_id/logs', (req, res) => {
  const id = req.body["_id"] || req.params._id;
  var fromDate = req.query.from;
  var toDate = req.query.to;
  var limit = req.query.limit;

  console.log(id, fromDate, toDate, limit);

  // Validate the query parameters
  if (fromDate) {
    fromDate = new Date(fromDate);
    if (fromDate == "Invalid Date") {
      res.json("Invalid Date Entered");
      return;
    }
  }

  if (toDate) {
    toDate = new Date(toDate);
    if (toDate == "Invalid Date") {
      res.json("Invalid Date Entered");
      return;
    }
  }

  if (limit) {
    limit = new Number(limit);
    if (isNaN(limit)) {
      res.json("Invalid Limit Entered");
      return;
    }
  }

  // Get the user's information
  User.findOne({ "_id" : id }, (error, data) => {
    if (error) {
      res.json("Invalid UserID");
      return console.log(error);
    }
    if (!data) {
      res.json("Invalid UserID");
    } else {

      // Initialize the object to be returned
      const usernameFound = data.username;
      var objToReturn = { "_id" : id, "username" : usernameFound };

      // Initialize filters for the count() and find() methods
      var findFilter = { "username" : usernameFound };
      var dateFilter = {};

      // Add to and from keys to the object if available
      // Add date limits to the date filter to be used in the find() method on the Exercise model
      if (fromDate) {
        objToReturn["from"] = fromDate.toDateString();
        dateFilter["$gte"] = fromDate;
        if (toDate) {
          objToReturn["to"] = toDate.toDateString();
          dateFilter["$lt"] = toDate;
        } else {
          dateFilter["$lt"] = Date.now();
        }
      }

      if (toDate) {
        objToReturn["to"] = toDate.toDateString();
        dateFilter["$lt"] = toDate;
        dateFilter["$gte"] = new Date("1960-01-01");
      }

      // Add dateFilter to findFilter if either date is provided
      if (toDate || fromDate) {
        findFilter.date = dateFilter;
      }

      // console.log(findFilter);
      // console.log(dateFilter);

      // Add the count entered or find the count between dates
      Exercise.count(findFilter, (error, data) => {
        if (error) {
          res.json("Invalid Date Entered");
          return console.log(error);
        }
        // Add the count key
        var count = data;
        if (limit && limit < count) {
          count = limit;
        }
        objToReturn["count"] = count;


        // Find the exercises and add a log key linked to an array of exercises
        Exercise.find(findFilter, (error, data) => {
          if (error) return console.log(error);

          // console.log(data);

          var logArray = [];
          var objectSubset = {};
          var count = 0;

          // Iterate through data array for description, duration, and date keys
          data.forEach(function(val) {
            count += 1;
            if (!limit || count <= limit) {
              objectSubset = {};
              objectSubset.description = val.description;
              objectSubset.duration = val.duration;
              objectSubset.date = val.date.toDateString();
              console.log(objectSubset);
              logArray.push(objectSubset);
            }
          });

          // Add the log array of objects to the object to return
          objToReturn["log"] = logArray;

          // Return the completed JSON object
          res.json(objToReturn);
        });

      });

    }
  });
});

// ----------------
// ADDITIONAL PATHS (not required for the FreeCodeCamp project)

// PATH /api/exercises/
// Display all of the exercises in the Mongo DB model titled Exercise
app.get('/tracker/api/exercises', (req, res) => {
  Exercise.find({}, (error, data) => {
    if (error) return console.log(error);
    res.json(data);
  })
});


/*


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
}) */

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
