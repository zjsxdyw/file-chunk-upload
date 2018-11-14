class AsyncQueue {
  /**
   * Constructor
   */
  constructor(num) {
      this.maxLength = num;
      this.queue = [];
      this.uid = 0;
      this.set = new Set();
  }

  /**
   * Add a callback to queue
   * @param {Function} callback
   */
  add(callback) {
      this.queue.push({
          uid: this.uid++,
          fn: callback
      });
      run();
  }

  /**
   * Run the callback from the queue
   */
  run() {
      while(this.set.size < this.maxLength && this.queue.length) {
          let { uid, fn } = this.queue.shift();
          fn(uid);
      }
  }

  /**
   * Notify the queue to complete the task
   */
  done(uid) {
      if(this.set.has(uid)) {
          this.set.delete(uid);
      }
      run();
  }
}

export default AsyncQueue