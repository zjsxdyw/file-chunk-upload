import FileUploader from './FileUploader.js'
import sendRequest, { submitFile } from './utils/request.js'

const fileUploader = new FileUploader({
  maxConcurrent: 2,
  autoUpload: true,
  uploadUrl: '/api/upload',
  checkUrl: '/api/checkMD5',
  mergeUrl: '/api/merge'
});
document.getElementById('input').addEventListener('change', function() {
  if(!this.files[0]) return;

  window.file = fileUploader.addFile();

  let percentage = window.file.percentage;
  Object.defineProperty(window.file, 'percentage', {
    get() {
      return percentage;
    },
    set(newValue) {
      percentage = newValue;
      document.getElementById('percentage').innerText = percentage;
      return newValue;
    }
  })
});

document.getElementById('pause').addEventListener('click', function() {
  file && file.pause();
});

document.getElementById('continue').addEventListener('click', function() {
  file && file.continue();
});

document.getElementById('remove').addEventListener('click', function() {
  if(file) {
    file.remove();
    window.file = undefined;
    document.getElementById('input').value = '';
  }
});