const express = require('express');
const bodyParser = require('body-parser');
const os = require('os');

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());
// parse application/json
app.use(bodyParser.json());

app.use(express.static('dist'));
app.get('/api/getUsername', (req, res) => {
    res.send({ username: os.userInfo().username });
});
app.post('/api/setUsername', (req, res) => {
    res.send({ username: req.body.name });
});

app.listen(8080, () => console.log('Listening on port 8080!'));