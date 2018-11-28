import FileUploader from '../../src/FileUploader.js'
import Vue from 'vue'

window.fileUploader = new FileUploader({
  maxConcurrent: 2,
  autoUpload: true,
});
document.getElementById('input').addEventListener('change', function() {
  for(let i = 0, len = this.files.length; i < len; i++) {
    fileUploader.addFile(this.files[i], (file, response) => {
      console.log(file, response);
    }, (file, error, type) => {
      console.log(file, error, type);
    }, (file) => {
      console.log(file);
    });
  }

  document.getElementById('input').value = '';
});

new Vue({
  el: '#files',
  data: {
    files: fileUploader.fileList
  },
  methods: {
    upload(file) {
      fileUploader.upload(file);
    },
    pause(file) {
      fileUploader.pause(file);
    },
    goon(file) {
      fileUploader.continue(file);
    },
    download(file) {
      if(file && file.response)
        window.open(`/file/download/${file.response.downloadId}?fileName=${file.name}`);
    },
    remove(file) {
      fileUploader.remove(file);
    }
  }
});