import AsyncQueue from './utils/AsyncQueue.js'
import Uploader from './utils/Uploader.js'

const defaultOptions = {
  // The first size of a file(in B) to breakpoint resume
  firstSize: 256 * 1024,
  // The size of a chunk(in B)
  chunkSize: 4 * 1024 * 1024,
  // Number of concurrent uploads
  maxConcurrent: 2,
  // Auto file upload
  autoUpload: true,
  // The url of prepare to upload
  prepareUrl: '/file/prepare',
  // The url of uploading every chunk
  uploadUrl: '/file/upload',
  // The url of checking md5
  checkMD5Url: '/file/checkMD5',
  // The url of merging file
  mergeUrl: '/file/merge',
};

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