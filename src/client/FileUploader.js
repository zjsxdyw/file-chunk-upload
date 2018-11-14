import FileHandler from './utils/FileHandler.js'
import AsyncQueue from './utils/AsyncQueue.js'
import sendRequest, { submitFile } from './utils/request.js'
import Uploader from './utils/Uploader.js'

class FileUploader {
  /**
   * Constructor
   * @param {Object} options
   */
  constructor(options) {
    this.options = options;
    this.queue = new AsyncQueue(options.maxConcurrent);
  }

  /**
   * Add a file
   * @param {File} file
   */
  addFile(file) {
    let { chunkSize, autoUpload } = this.options;
    let fileHandler = new FileHandler(file, chunkSize);
    let fileObj = {
      size: file.size,
      name: file.name,
    };
    return new Uploader(file, this.options, this.queue);
  }
}
export default FileUploader