var express = require('express');
var app = express();
app.use(express.static('public'));

module.exports = function (app){
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
        let dateString = req.params?.date_string
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
}