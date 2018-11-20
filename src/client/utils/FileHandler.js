import SparkMD5 from 'spark-md5'
import Observer from './Observer.js'
let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

class FileHandler extends Observer {
  /**
   * Constructor
   * @param {File} file
   * @param {Number} firstSize
   * @param {Number} chunkSize
   */
  constructor(file, firstSize, chunkSize) {
    super();
    this.file = file;
    this.size = file.size;
    this.firstSize = firstSize || 1024 * 256;
    this.chunkSize = chunkSize || 1024 * 1024 * 4;
    this.total = Math.ceil(this.size / this.chunkSize);
    this.stop = false;
  }

  /**
   * Calculate the md5 value of the file
   */
  calculate() {
    let index = 0;
    let size = this.size;
    let chunkSize = this.chunkSize;
    let file = this.file;
    let total = this.total;
    let fileReader = new FileReader();
    let spark = new SparkMD5.ArrayBuffer();
    let chunk, start, end;

    fileReader.onload = (event) => {
      if(this.stop) return;
      let chunkSpark = new SparkMD5.ArrayBuffer();
      spark.append(event.target.result);
      chunkSpark.append(event.target.result);
      let md5 = chunkSpark.end();
      this.fireEvent('chunkLoad', { chunk, md5, index, start, end });
      index++;
      if(index === total) this.fireEvent('load', spark.end());
      else read();
    };

    fileReader.onerror = (event) => {
      console.warn('oops, something went wrong.');
      this.fireEvent('error');
    };

    const read = () => {
      if(this.stop) return;
      start = chunkSize * index;
      end = (start + chunkSize) >= size ? size : (start + chunkSize);
      chunk = blobSlice.call(file, start, end);
      fileReader.readAsArrayBuffer(chunk);
    };

    read();
  }

  /**
   * Calculate the md5 value of the first size of the file
   */
  calculateForFirstSize() {
    let fileReader = new FileReader();
    let spark = new SparkMD5.ArrayBuffer();

    fileReader.onload = (event) => {
      if(this.stop) return;
      this.fireEvent('firstLoad', spark.end());
    };

    fileReader.onerror = (event) => {
      console.warn('oops, something went wrong.');
      this.fireEvent('error');
    };

    let end = this.firstSize >= this.size ? this.size : this.firstSize;

    fileReader.readAsArrayBuffer(blobSlice.call(this.file, 0, end));
  }

  abort() {
    this.stop = true;
  }
}

export default FileHandler;