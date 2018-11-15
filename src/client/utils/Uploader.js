import FileHandler from './FileHandler.js'
import sendRequest, { submitFile } from './request.js'

const BEFORE_UPLOAD = 0;
const UPLOADING = 1;
const PAUSE = 2;
const COMPLETED = 3;
const ERROR = 4;
/**
 * Initialize file data
 * @param {FileUploader} _this
 * @param {File} file
 */
const initFile = (_this, file) => {
  _this.file = file;
  _this.name = file.name;
  _this.ext = /\.([^.]+)$/.exec(file.name) ? RegExp.$1.toLowerCase() : '';
  _this.size = file.size || 0;
  _this.lastModified = file.lastModified;
  _this.lastModifiedDate = file.lastModifiedDate || new Date();
  _this.state = BEFORE_UPLOAD;
  _this.percentage = 0;
  _this.uploadId = '';
  _this.md5 = '';
  _this.uuid = guid();
  _this.chunkList = [];
};

/**
 * Upload file
 * @param {FileUploader} _this
 * @param {File} file
 */
const uploadFile = (_this) => {
  let queue = _this.queue;
  let options = _this.options;
  let fileHandler = new FileHandler(_this.file, options.chunkSize);
  let chunkSize = fileHandler.chunkSize;

  const merge = () => {
    sendRequest({
      url: options.mergeUrl,
      type: 'post',
      contentType: 'json',
      data: {
        uploadId: _this.uploadId,
        chunkMD5s: _this.chunkList.map(item => item.md5)
      }
    })
  };
  // if(fileHandler.total > 1) {
  fileHandler.on('chunkLoad', (chunkFile, md5, index) => {
    _this.chunkList[index] = {
      md5,
      uploadSize: 0
    };
    let failCount = 0;
    if([UPLOADING, PAUSE].indexOf(_this.state) === -1) return;
    const upload = (uid) => {
      let start = chunkSize * index;
      let end = (start + chunkSize) >= _this.size ? _this.size : (start + chunkSize);
      submitFile({
        url: options.uploadUrl,
        data: {
          uploadId: _this.uploadId,
          md5,
          index,
          start,
          end,
          file: chunkFile
        },
        progress(evt) {
          let percent = evt.loaded / evt.total;
          _this.chunkList[index].uploadSize = percent * (end - start);
          if([UPLOADING].indexOf(_this.state) === -1) return;
          _this.percentage = Math.ceil(_this.chunkList.reduce((sum, item) => sum + item.uploadSize, 0) / _this.size * 100);
          console.log(_this.percentage);
        }
      }).then(() => {
        if([UPLOADING].indexOf(_this.state) === -1) return;
        _this.chunkList[index].uploadSize = end - start;
        _this.percentage = Math.ceil(_this.chunkList.reduce((sum, item) => sum + item.uploadSize, 0) / _this.size * 100);
        console.log(_this.percentage);
        if(index + 1 === fileHandler.total) {
          merge();
        }
      }).catch(() => {
        failCount++;
        if(failCount > 10) {
          _this.state = ERROR;
          return;
        }
        queue.add(upload, _this.uuid);
      }).finally(() => {
        queue.done(uid);
      });
    };
    queue.add(upload, _this.uuid);
  });
  // }

  fileHandler.on('load', (file, md5) => {
    if(fileHandler.total === 1) queue.pause(_this.uuid);
    sendRequest({
      url: options.checkUrl,
      data: {
        uploadId: _this.uploadId,
        md5,
      }
    }).then((result) => {
      if(result) {
        _this.state = COMPLETED;
        queue.remove(_this.uuid);
        _this.percentage = 100;
      } else if([UPLOADING].indexOf(_this.state) > -1 && fileHandler.total > 1) {
        queue.continue(_this.uuid);
      }
    }).catch(() => {

    });
  });

  fileHandler.calculate();
};

/**
 * Generate Guid
 * @return {String}
 */
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
}

const isFunction = (fn) => {
  return typeof fn === 'function';
}

class Uploader {
  /**
   * Constructor
   * @param {File} file
   * @param {Object} options
   * @param {AsyncQueue} queue
   */
  constructor(file, options, queue) {
    initFile(this, file);
    this.options = options;
    this.queue = queue;
    if(options.autoUpload) this.upload();
  }

  /**
   * Prepare for upload
   */
  upload() {
    if(this.state !== BEFORE_UPLOAD) return;
    this.state = UPLOADING;

    let promise;
    if(isFunction(this.options.getUploadId)) {
      promise = this.options.getUploadId(this.file);
      if(promise && !isFunction(promise.then)) promise = Promise.resolve(promise.toString());
    } else {
      promise = Promise.resolve(guid());
    }
    promise.then((uploadId) => {
      this.uploadId = uploadId;
      uploadFile(this);
    }).catch((e) => {
      console.log(e);
      this.state = ERROR;
    });
  }

  pause() {
    if(this.state !== UPLOADING) return;
    this.state = PAUSE;
    this.queue.pause(this.uuid);
  }
}

export default Uploader