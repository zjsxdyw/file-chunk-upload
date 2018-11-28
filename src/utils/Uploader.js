import FileHandler from './FileHandler.js'
import sendRequest, {
  submitFile
} from '../utils/request.js'
import {
  guid,
  isFunction,
  isPromise,
  extend
} from '../utils/util.js'

const PREPARE = 0;
const UPLOADING = 1;
const PAUSE = 2;
const COMPLETED = 3;
const ERROR = 4;
const ABORT = 5;

const chunkObject = {
  md5: '',
  uploadSize: 0,
  uploadPromise: null,
  done: false
};

/**
 * Prepare for upload to get uploadId
 * @param {Object} parameters
 * @return {Promise}
 */
const prepare = (fileObj, { uploadId, url, headers, file }) => {
  return sendRequest({
    url,
    headers,
    data: {
      uploadId,
      fileName: file.name,
      size: file.size
    }
  });
};

/**
 * Upload chunk file
 *
 * @param {Object} fileObj
 * @param {Object} parameters
 * @param {Function} onProgress
 * @return {Promise}
 */
const upload = (fileObj, { uploadId, url, headers, chunk, md5, index, start, end }, onProgress) => {
  return submitFile({
    url,
    headers,
    data: {
      uploadId,
      md5,
      index,
      start,
      end,
      file: chunk
    },
    progress: (evt) => {
      let percent = evt.loaded / evt.total;
      onProgress(percent);
    }
  });
};

/**
 * Check md5
 *
 * @param {Object} fileObj
 * @param {Object} parameters
 * @return {Promise}
 */
const checkMD5 = (fileObj, { uploadId, url, headers, md5, file }) => {
  return sendRequest({
    url,
    headers,
    data: {
      uploadId,
      md5,
      fileName: file.name
    }
  });
};

/**
 * Merge chunk to file
 *
 * @param {Object} fileObj
 * @param {Object} parameters
 * @return {Promise}
 */
const merge = (fileObj, { uploadId, url, headers, md5, chunkMD5List, file }) => {
  return sendRequest({
    url,
    type: 'post',
    contentType: 'json',
    headers,
    data: {
      uploadId,
      md5,
      chunkMD5List,
      fileName: file.name
    }
  });
};

class Uploader {
  /**
   * Constructor
   *
   * @param {File} file
   * @param {Object} options
   * @param {AsyncQueue} queue
   * @param {Storage} storage
   */
  constructor(file, options, queue, storage) {
    this.initFile(file);
    this.options = options;
    this.queue = queue;
    this.storage = storage;
    if (options.autoUpload) this.upload();
  }

  /**
   * Initialize file data
   *
   * @param {File} file
   */
  initFile(file) {
    this.state = PREPARE;
    this.uploadId = '';
    this.md5 = '';
    this.firstMD5 = '';
    this.taskId = guid();
    this.chunkList = [];
    this.isExistMap = {};
    this.response = null;

    let fileObj = {};
    fileObj.raw = file;
    fileObj.name = file.name;
    fileObj.ext = /\.([^.]+)$/.exec(file.name) ? RegExp.$1.toLowerCase() : '';
    fileObj.size = file.size || 0;
    fileObj.lastModified = file.lastModified;
    fileObj.percentage = 0;
    fileObj.uid = this.taskId;
    this.file = fileObj;
  };

  /**
   * Prepare for upload
   */
  upload() {
    if (this.state !== PREPARE) return;
    this.state = UPLOADING;
    this.prepare();
  }

  /**
   * Prepare for upload
   */
  prepare() {
    let { firstSize, chunkSize } = this.options;
    let fileHandler = new FileHandler(this.file.raw, firstSize, chunkSize);
    this.fileHandler = fileHandler;
    this.chunkList = new Array(fileHandler.total).fill().map(() => {
      return extend({}, chunkObject);
    });

    if (fileHandler.total > 1) {
      fileHandler.on('firstLoad', (md5) => {
        this.firstMD5 = md5;
        let info = this.storage.get(this.getKey());
        if (info && info.done) {
          this.uploadId = info.uploadId;
          this.completed(info.response);
          return;
        }
        this.applyForUploadId(info && info.uploadId);
      });
      fileHandler.calculateForFirstSize().then((md5) => {
        this.firstMD5 = md5;
        let info = this.storage.get(this.getKey());
        if (info && info.done) {
          this.uploadId = info.uploadId;
          this.completed(info.response);
          return;
        }
        this.applyForUploadId(info && info.uploadId);
      }).catch(() => {});
    } else {
      this.applyForUploadId();
    }
  }

  /**
   * Apply for uploadId
   * 
   * @param {String} uploadId
   */
  applyForUploadId(uploadId) {
    let { prepareUrl, headers, onPrepare, handlePrepare } = this.options;
    const param = {
      url: prepareUrl,
      headers: headers,
      file: this.file.raw
    };
    if(uploadId) param.uploadId = uploadId;

    let promise = this.handlePromise(prepare, onPrepare, handlePrepare, [param]);

    promise.then(({ uploadId, chunkMD5List }) => {
      this.uploadId = uploadId;
      (chunkMD5List || []).forEach(md5 => this.isExistMap[md5] = true);
      this.calculateMD5();
    }).catch(err => {
      this.handleError(err, 'prepare');
    });
  }

  /**
   * calculate md5 of the file
   * 
   * @param {String} uploadId
   */
  calculateMD5() {
    let fileHandler = this.fileHandler;
    fileHandler.on('chunkLoad', (data) => {
      let { md5, index, start, end } = data;
      this.chunkList[index].md5 = md5;
      if ([UPLOADING, PAUSE].indexOf(this.state) === -1) {
        fileHandler.abort();
        return;
      }

      if (this.isExistMap[md5]) {
        this.chunkComleted(index, end - start);
        return;
      }
      this.addToQueue(data);
    });

    fileHandler.on('load', (md5) => {
      this.checkMD5(md5);
    });
    fileHandler.calculate();
  }

  /**
   * Add chunk upload task to the async queue
   * 
   * @param {Object} data
   */
  addToQueue(data) {
    this.queue.add((uid) => {
      this.uploadChunk(uid, data);
    }, this.taskId);
  }

  /**
   * Upload chunk file
   * 
   * @param {String} uid
   * @param {Object} data
   */
  uploadChunk(uid, data) {
    if ([UPLOADING, PAUSE].indexOf(this.state) === -1) {
      this.queue.done(uid);
      return;
    }
    let { chunk, md5, index, start, end } = data;
    let { uploadUrl, headers, onUpload, handleUpload, reupload } = this.options;
    const param = {
      uploadId: this.uploadId,
      url: uploadUrl,
      headers: headers,
      chunk,
      md5,
      index,
      start,
      end,
    };

    const onProgress = (percent) => {
      this.chunkList[index].uploadSize = percent * (end - start);
      if ([UPLOADING].indexOf(this.state) === -1) return;
      this.updatePercentage();
    };

    let promise = this.handlePromise(upload, onUpload, handleUpload, [param, onProgress]);

    this.chunkList[index].uploadPromise = promise;

    promise.then(() => {
      this.chunkComleted(index, end - start);
    }).catch(err => {
      if (err === 'abort') return;
      if(reupload > 0) {
        reupload--;
        this.addToQueue(data);
      } else {
        this.handleError(err, 'upload');
      }
    }).finally(() => {
      this.queue.done(uid);
      this.chunkList[index].uploadPromise = null;
    });
  }

  /**
   * Chunk upload completed
   * 
   * @param {Number} index
   * @param {Number} size
   */
  chunkComleted(index, size) {
    if(!this.chunkList[index]) return;
    this.chunkList[index].uploadSize = size;
    this.chunkList[index].done = true;
    if ([UPLOADING].indexOf(this.state) === -1) return;
    this.updatePercentage();
    this.saveInfo();
    this.merge();
  }

  /**
   * Check file exists by md5
   * 
   * @param {String} md5
   */
  checkMD5(md5) {
    this.md5 = md5;
    let { checkUrl, headers, onCheck, handleCheck } = this.options;
    const param = {
      uploadId: this.uploadId,
      url: checkUrl,
      headers: headers,
      md5: this.md5,
      file: this.file.raw
    };

    let total = this.fileHandler.total;
    if(total === 1) this.queue.pause(this.taskId);

    let promise = this.handlePromise(checkMD5, onCheck, handleCheck, [param]);

    promise.then(data => {
      if (data) this.completed(data);
    }).catch(err => {
      console.log(err);
    }).finally(() => {
      if ([UPLOADING].indexOf(this.state) > -1 && total === 1) {
        this.queue.continue(this.taskId);
      }
    });
  }

  /**
   * Merge chunk to file
   */
  merge() {
    if ([UPLOADING, PAUSE].indexOf(this.state) === -1) return;
    if (this.chunkList.some(item => !item.done)) return;
    let { mergeUrl, headers, onMerge, handleMerge } = this.options;
    const param = {
      uploadId: this.uploadId,
      url: mergeUrl,
      headers: headers,
      md5: this.md5,
      chunkMD5List: this.chunkList.map(item => item.md5),
      file: this.file.raw
    };

    let promise = this.handlePromise(merge, onMerge, handleMerge, [param]);

    promise.then(data => {
      this.completed(data);
    }).catch(err => {
      this.handleError(err, 'merge');
    });
  }

  /**
   * Upload completed
   *
   * @param {Object} response
   */
  completed(response) {
    this.response = response;
    this.file.response = response;
    if (this.state !== UPLOADING) return;
    this.state = COMPLETED;
    this.updatePercentage(100);
    this.saveInfo();
    this.remove();
    if (isFunction(this.options.success)) {
      this.options.success.call(this.file, this.file, response);
    }
  }

  /**
   * Handle error
   * @param {Any} err
   */
  handleError(err, type) {
    this.state = ERROR;
    this.remove();
    if (isFunction(this.options.error)) {
      this.options.error.call(this.file, this.file, err, type);
    }
  }

  /**
   * Handle promise
   * @param {Function} defaultFn
   * @param {Function} fn
   * @param {Function} callback
   * @param {Array} args
   * @param {Promise}
   */
  handlePromise(defaultFn, fn, callback, args) {
    let promise;
    args = [this.file].concat(args);
    if(isFunction(fn)) {
      promise = fn.apply(this.file, args);
    }

    if(!promise || !isPromise(promise)) {
      promise = defaultFn.apply(this.file, args);
    }

    promise.then(data => {
      let result = data;
      if(isFunction(callback)) result = callback(data);
      return result === undefined ? data : result;
    }).catch(() => {});

    return promise;
  }

  /**
   * Pause upload
   */
  pause() {
    if (this.state !== UPLOADING) return;
    this.state = PAUSE;
    this.queue.pause(this.taskId);
  }

  /**
   * Continue upload
   */
  continue () {
    if (this.state !== PAUSE) return;
    this.state = UPLOADING;
    if (this.response !== null) {
      this.completed(this.response);
      return;
    }
    this.queue.continue(this.taskId);
    this.updatePercentage();
    this.merge();
  }

  /**
   * Stop and remove upload
   */
  remove() {
    if (this.state !== COMPLETED) this.state = ABORT;
    this.queue.remove(this.taskId);
    this.chunkList.forEach(item => {
      if (item.uploadPromise && item.uploadPromise.abort)
        item.uploadPromise.abort();
    });
    this.fileHandler.abort();
  }

  /**
   * Update the upload percentage
   *
   * @param {Number} number
   */
  updatePercentage(number) {
    let percentage;
    if(number) {
      percentage = number;
    } else {
      percentage = Math.ceil(this.chunkList.reduce((sum, item) => sum + item.uploadSize, 0) / this.file.size * 100);
    }
    if (percentage > 100) {
      percentage = 100;
    }
    this.file.percentage = percentage;
    if(isFunction(this.options.progress)) this.options.progress.call(this.file, this.file);
  }

  /**
   * Get the storage key
   */
  getKey() {
    let file = this.file;
    return `${file.name}#${file.size}#${file.lastModified}#${this.firstMD5}`;
  }

  /**
   * Save the info to storage
   */
  saveInfo() {
    let key = this.getKey();
    let info = {
      uploadId: this.uploadId,
    };
    if (this.state === COMPLETED) {
      info.done = true;
      info.response = this.response;
    }
    this.storage.set(key, info, this.options.expiration);
  }
}

export default Uploader