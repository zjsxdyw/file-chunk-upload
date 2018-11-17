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
const downloadFolder = './download/'

const createFolder = (dirPath) => {
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
createFolder(downloadFolder);

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
    createFolder(uploadFolder + uploadId);
  }
  res.send({ uploadId, chunkMD5List });
});

app.get('/file/checkMD5', (req, res) => {
  if(fs.existsSync(downloadFolder + req.query.md5)) res.send({ downloadId: req.query.md5 });
  else res.send(false);
});

app.post('/file/merge', (req, res) => {
  let { md5, chunkMD5List, uploadId, fileName } = req.body;
  if(!md5) res.status(500).send();
  md5Map[md5] = true;
  let downloadPath = downloadFolder + md5;
  let promise = Promise.resolve();

  chunkMD5List.forEach(str => {
    promise = promise.then(() => {
      return new Promise((resolve, reject) => {
        var w = fs.createWriteStream(downloadPath, {flags: 'a'});
        // open source file for reading
        var r = fs.createReadStream(uploadFolder + uploadId + '/' + str);

        w.on('close', function() {
            resolve();
        });

        r.pipe(w);
      });
    });
  });

  promise.then(() => {
    res.send({ downloadId: md5 });
  });

});

app.post('/file/upload', upload.single('file'), (req, res) => {
  res.send();
});

app.get('/file/download/:md5',function(req, res){
  if(!req.params.md5) res.status(500).send();
  else res.download(downloadFolder + req.params.md5, req.query.fileName);
});

app.listen(8080, () => console.log('Listening on port 8080!'));