var express = require('express');
var app = express();
app.use(express.static('public'));

module.exports = function (app){
    app.get("/dados/", (req, res) => {
        res.sendFile(__dirname + "/views/dados.html")
      })


      app.get("/dados/api/whoami", function (req, res) {
        res.json({
          "ipaddress": req.ip || 'not found',
          "language": req.headers["accept-language"] || 'not found',
          "software": req.headers['user-agent'] || 'not found',
        })
      })
}