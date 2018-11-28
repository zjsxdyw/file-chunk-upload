import AsyncQueue from './utils/AsyncQueue.js'
import Uploader from './utils/Uploader.js'
import Storage from './utils/Storage.js'
import { extend } from './utils/util.js'

const defaultOptions = {
  // The first size of a file(in B) to breakpoint resume
  firstSize: 256 * 1024,
  // The size of a chunk(in B)
  chunkSize: 4 * 1024 * 1024,
  // The time of expiration
  expiration: 24 * 60 * 60,
  // Number of concurrent uploads
  maxConcurrent: 2,
  // Auto file upload
  autoUpload: true,
  // The url of prepare to upload
  prepareUrl: '/file/prepare',
  // The url of uploading every chunk
  uploadUrl: '/file/upload',
  // The url of checking md5
  checkUrl: '/file/check',
  // The url of merging file
  mergeUrl: '/file/merge',
  // The request headers
  headers: {},
  // The number of reupload the chunk if fail
  reupload: 5,
};

class FileUploader {
  /**
   * Constructor
   * @param {Object} options
   */
  constructor(options) {
    this.options = extend(options, defaultOptions);
    this.queue = new AsyncQueue(options.maxConcurrent);
    this.storage = new Storage('file-upload');
    this.fileList = [];
    this.map = {};

    let methods = ['upload', 'pause', 'continue'];

    methods.forEach((method) => {
      this[method] = (fileObj) => {
        for(let file of this.fileList) {
          if(file === fileObj || file.uid === fileObj) {
            this.map[file.uid][method]();
            break;
          }
        }
      };
      this[method + 'All'] = () => {
        for(let file of this.fileList) {
          this.map[file.uid][method]();
        }
      };
    });
  }

  /**
   * Add a file
   * @param {File} file
   * @param {Function} success
   * @param {Function} error
   * @param {Function} progress
   * @return {Object}
   */
  addFile(file, success, error, progress) {
    let options = extend({ success, error, progress }, this.options);
    let uploader = new Uploader(file, options, this.queue, this.storage);
    this.fileList.push(uploader.file);
    this.map[uploader.file.uid] = uploader;
    return uploader.file;
  }

  /**
   * Remove file
   * @param {Object|String} fileObj
   */
  remove(fileObj) {
    for(let i in this.fileList) {
      if(this.fileList[i] === fileObj || this.fileList[i].uid === fileObj) {
        this.map[this.fileList[i].uid].remove();
        delete this.map[this.fileList[i].uid];
        this.fileList.splice(i, 1);
        break;
      }
    }
  }

  /**
   * Remove all file
   */
  removeAll() {
    for(let file of this.fileList) {
      this.map[file.uid].remove();
      delete this.map[file.uid];
    }
    this.fileList = [];
  }
}
export default FileUploader