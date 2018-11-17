import FileHandler from './FileHandler.js'
import sendRequest, { submitFile } from '../utils/request.js'
import { guid, isFunction } from '../utils/util.js'

const PREPARE = 0;
const UPLOADING = 1;
const PAUSE = 2;
const COMPLETED = 3;
const ERROR = 4;
const ABORT = 5;
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
  _this.state = PREPARE;
  _this.percentage = 0;
  _this.uploadId = '';
  _this.md5 = '';
  _this.firstMD5 = '';
  _this.taskId = guid();
  _this.chunkList = [];
  _this.isExistMap = {};
};


const prepare = function(uploadId) {
  let { prepareUrl, headers } = this.options;
  return sendRequest({
    url: prepareUrl,
    headers: this.options.headers,
    data: {
      uploadId,
      fileName: this.name,
      size: this.size
    }
  });
};

const mergeFile = function(uploadId, chunkMD5List) {
  let { mergeUrl, headers } = this.options;
  return sendRequest({
    url: mergeUrl,
    type: 'post',
    contentType: 'json',
    headers: this.options.headers,
    data: {
      uploadId,
      md5: this.md5,
      chunkMD5List,
      fileName: this.name
    }
  });
};

/**
 * Upload file
 * @param {File} file
 */
const uploadFile = function() {
  let queue = this.queue;
  let options = this.options;
  let fileHandler = new FileHandler(this.file, options.firstSize, options.chunkSize);
  let chunkSize = fileHandler.chunkSize;

  const handlePrepare = (promise) => {
    promise.then(({ uploadId, chunkMD5List }) => {
      this.uploadId = uploadId;
      (chunkMD5List || []).forEach(md5 => this.isExistMap[md5] = true);
      fileHandler.calculate();
    }).catch((e) => {
      this.errorMessage = e;
      this.state = ERROR;
    });
  };

  const merge = () => {
    sendRequest({
      url: options.mergeUrl,
      type: 'post',
      contentType: 'json',
      data: {
        uploadId: this.uploadId,
        md5: this.md5,
        chunkMD5List: this.chunkList.map(item => item.md5),
        fileName: this.name
      }
    }).then((result) => {
      this.state = COMPLETED;
      this.response = result;
      this.setStorageInfo();
    }).catch(() => {
      this.errorMessage = e;
      this.state = ERROR;
    });
  };

  fileHandler.on('chunkLoad', (chunkFile, md5, index) => {
    this.chunkList[index] = {
      md5,
      uploadSize: 0,
      uploadPromise: null,
      done: false
    };
    if([UPLOADING, PAUSE].indexOf(this.state) === -1) {
      fileHandler.abort();
      return;
    }

    let failCount = 0;
    let start = chunkSize * index;
    let end = (start + chunkSize) >= this.size ? this.size : (start + chunkSize);

    if(this.isExistMap[md5]) {
        this.chunkList[index].uploadSize = end - start;
        this.chunkList[index].done = true;
        this.updatePercentage();
        if(index + 1 === fileHandler.total) {
          merge();
        }
      return;
    }
    const upload = (uid) => {
      let uploadPromise = submitFile({
        url: options.uploadUrl,
        data: {
          uploadId: this.uploadId,
          md5,
          index,
          start,
          end,
          file: chunkFile
        },
        progress: (evt) => {
          let percent = evt.loaded / evt.total;
          this.chunkList[index].uploadSize = percent * (end - start);
          if([UPLOADING].indexOf(this.state) === -1) return;
          this.updatePercentage();
        }
      });
      uploadPromise.then(() => {
        if([UPLOADING].indexOf(this.state) === -1) return;
        this.chunkList[index].uploadSize = end - start;
        this.chunkList[index].done = true;
        this.updatePercentage();
        this.setStorageInfo();
        if(index + 1 === fileHandler.total) {
          merge();
        }
      }).catch((e) => {
        if(e === 'abort') return;
        failCount++;
        if(failCount > 10) {
          this.state = ERROR;
          return;
        }
        queue.add(upload, this.taskId);
      }).finally(() => {
        queue.done(uid);
        this.chunkList[index].uploadPromise = null;
      });

      this.chunkList[index].uploadPromise = uploadPromise;
    };
    queue.add(upload, this.taskId);
  });

  fileHandler.on('load', (file, md5) => {
    this.md5 = md5;
    if(fileHandler.total === 1) queue.pause(this.taskId);
    sendRequest({
      url: options.checkMD5Url,
      data: {
        uploadId: this.uploadId,
        md5,
        fileName: this.name
      }
    }).then((result) => {
      if(result) {
        this.state = COMPLETED;
        this.response = result;
        this.setStorageInfo();
        queue.remove(this.taskId);
        this.percentage = 100;
      } else if([UPLOADING].indexOf(this.state) > -1 && fileHandler.total === 1) {
        queue.continue(this.taskId);
      }
    }).catch((e) => {
      
    });
  });

  if(fileHandler.total > 1) {
    fileHandler.on('firstLoad', (md5) => {
      this.firstMD5 = md5;
      let info = this.getStorageInfo();
      if(info) {
        if(info.done) {
          this.uploadId = info.uploadId;
          this.state = COMPLETED;
          this.response = info.response;
          return;
        }
        handlePrepare(prepare.call(this, info.uploadId));
      } else {
        handlePrepare(prepare.call(this));
      }
    });
    fileHandler.calculateForFirstSize();
  } else {
    handlePrepare(prepare.call(this));
  }

};

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
    if(this.state !== PREPARE) return;
    this.state = UPLOADING;
    uploadFile.call(this);
  }

  pause() {
    if(this.state !== UPLOADING) return;
    this.state = PAUSE;
    this.queue.pause(this.taskId);
  }

  continue() {
    if(this.state !== PAUSE) return;
    this.state = UPLOADING;
    this.queue.continue(this.taskId);
  }

  remove() {
    this.state = ABORT;
    this.queue.remove(this.taskId);
    this.chunkList.forEach(item => {
      if(item.uploadPromise) item.uploadPromise.abort();
    });
  }

  updatePercentage() {
    this.percentage = Math.ceil(this.chunkList.reduce((sum, item) => sum + item.uploadSize, 0) / this.size * 100);
    if(this.percentage > 100) {
      this.percentage = 100;
    }
    return this.percentage;
  }

  getStorageKey() {
    return `${this.name}#${this.size}#${this.lastModified}#${this.firstMD5}`;
  }

  getStorageInfo() {
    let string = localStorage.getItem(this.getStorageKey());
    let info;
    try {
      info = JSON.parse(string);
    } catch(e) {
      info = undefined;
    }
    return info;
  }

  setStorageInfo() {
    let key = this.getStorageKey();
    let info = {
      uploadId: this.uploadId,
      date: new Date().getTime()
    };
    if(this.state === COMPLETED) {
      info.done = true;
      info.response = this.response;
    }
    localStorage.setItem(key, JSON.stringify(info));
  }

  removeStorageInfo() {
    localStorage.removeItem(this.getStorageKey());
  }
}

export default Uploader