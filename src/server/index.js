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

const uploadFolder = './upload/';

const createFolder = (folderName) => {
  let dirPath = uploadFolder + folderName;
  try{
    fs.accessSync(dirPath);
  }catch(e){
    fs.mkdirSync(dirPath);
  }
};

const isDirectory = (folderName) => {
  let dirPath = uploadFolder + folderName;
  return fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory();
};

const guid = () => {
  let s = [];
  let hexDigits = "0123456789abcdef";
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
};

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

const md5Map = {};

app.use(express.static('dist'));

app.get('/file/prepare', (req, res) => {
  let chunkMD5List = [];
  let uploadId = (req.query.uploadId || '').replace(/\.+\//g, '');
  if(uploadId && isDirectory(uploadId)) {
    chunkMD5List = fs.readdirSync(uploadFolder + uploadId);
  } else {
    uploadId = guid();
    createFolder(uploadId);
  }
  res.send({ uploadId, chunkMD5List });
});

app.get('/file/checkMD5', (req, res) => {
  if(md5Map[req.query.md5]) res.send({ data: '' });
  else res.send(false);
});

app.post('/file/merge', (req, res) => {
  if(req.body.md5) md5Map[req.body.md5] = true;
  res.send({ data: '' });
});

app.post('/file/upload', upload.single('file'), (req, res) => {
  res.send();
});

app.listen(8080, () => console.log('Listening on port 8080!'));