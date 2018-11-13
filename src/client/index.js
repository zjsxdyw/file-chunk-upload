import FileHandler from './utils/FileHandler.js'
import sendRequest, { submitFile } from './utils/request.js'
document.getElementsByTagName('input')[0].addEventListener('change', function() {
  for(let file of this.files) {
    let fileHandler = new FileHandler(file);
    fileHandler.addListener('load', function() {
      console.log(arguments, this);
    });
    fileHandler.addListener('chunkLoad', function() {
      console.log(arguments, this);
    });
    fileHandler.calculate();
    submitFile({
      url: '/api/upload',
      data: {
        file
      }
    });
  }
});

sendRequest({
  url: '/api/getUsername',
  data: {_: new Date().getTime()}
}).then(user => console.log(user));
sendRequest({
  url: '/api/setUsername',
  data: {name: '123'},
  type: 'post'
}).then(user => console.log(user));