var express = require('express');
var app = express();
app.use(express.static('public'));
let multer = require('multer') // file parser middleware

module.exports = function(app){
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
}