const express = require('express');
const bodyParser = require('body-parser');
const multer  = require('multer');
const os = require('os');
const fs = require('fs');

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());
// parse application/json
app.use(bodyParser.json());


const createFolder = (folder) => {
  try{
    fs.accessSync(folder);
  }catch(e){
    fs.mkdirSync(folder);
  }
};

const uploadFolder = './upload/';
createFolder(uploadFolder);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = uploadFolder + req.body.uploadId;
    createFolder(folder);
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    cb(null, req.body.md5);
  }
});

const upload = multer({ storage: storage });

app.use(express.static('dist'));

app.get('/api/checkMD5', (req, res) => {
  res.send(Math.random() > 0.5 ? true : false);
});

app.post('/api/merge', (req, res) => {
  res.send({ data: '' });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  res.send();
});

app.listen(8080, () => console.log('Listening on port 8080!'));