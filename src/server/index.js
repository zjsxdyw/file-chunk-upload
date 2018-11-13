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

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './upload/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

var createFolder = function(folder){
    try{
        fs.accessSync(folder); 
    }catch(e){
        fs.mkdirSync(folder);
    }  
};

var uploadFolder = './upload/';
createFolder(uploadFolder);

var upload = multer({ storage: storage });

app.use(express.static('dist'));
app.get('/api/getUsername', (req, res) => {
    res.send({ username: os.userInfo().username });
});
app.post('/api/setUsername', (req, res) => {
    res.send({ username: req.body.name });
});
app.post('/api/upload', upload.single('file'), (req, res) => {
    res.send({ result: true });
})

app.listen(8080, () => console.log('Listening on port 8080!'));