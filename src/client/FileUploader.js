import FileHandler from './utils/FileHandler.js'
import AsyncQueue from './AsyncQueue.js'
import sendRequest, { submitFile } from './utils/request.js'

class FileUploader {
  /**
   * Constructor
   * @param {Object} options
   */
  constructor(options) {
    this.options = options;
  }
}