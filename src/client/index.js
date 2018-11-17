import FileUploader from './FileUploader.js'
import sendRequest, { submitFile } from './utils/request.js'

const fileUploader = new FileUploader({
  maxConcurrent: 2,
  autoUpload: true,
  prepareUrl: '/file/prepare',
  uploadUrl: '/file/upload',
  checkMD5Url: '/file/checkMD5',
  mergeUrl: '/file/merge'
});
document.getElementById('input').addEventListener('change', function() {
  if(!this.files[0]) return;

  window.file = fileUploader.addFile(this.files[0]);

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

document.getElementById('download').addEventListener('click', function() {
  file && file.response && open('/file/download/' + file.response.downloadId + '?fileName=' + file.name);
});