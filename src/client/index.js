import FileUploader from './FileUploader.js'
import sendRequest, { submitFile } from './utils/request.js'

const fileUploader = new FileUploader({
  maxConcurrent: 1,
  autoUpload: true,
  uploadUrl: '/api/upload'
});
document.getElementsByTagName('input')[0].addEventListener('change', function() {
  for(let file of this.files) {
    fileUploader.addFile(file);
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