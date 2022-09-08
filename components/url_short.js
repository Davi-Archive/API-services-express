var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const dns = require('dns');
const urlparser = require('url');
var mongoose = require('mongoose');
require('dotenv').config()
app.use(bodyParser.json()); //link em json
app.use(express.static('public'));

const { response } = require('express');

// mongo connect
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//URL encurta - /url/api/shorturl

module.exports = function (app){


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
}
