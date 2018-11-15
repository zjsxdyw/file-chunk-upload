import AsyncQueue from './utils/AsyncQueue.js'
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
    return new Uploader(file, this.options, this.queue);
  }
}
export default FileUploader