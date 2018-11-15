import FileUploader from './FileUploader.js'
import sendRequest, { submitFile } from './utils/request.js'

const fileUploader = new FileUploader({
  maxConcurrent: 2,
  autoUpload: true,
  uploadUrl: '/api/upload',
  checkUrl: '/api/checkMD5',
  mergeUrl: '/api/merge'
});
document.getElementsByTagName('input')[0].addEventListener('change', function() {
  for(let file of this.files) {
    fileUploader.addFile(file);
  }
});