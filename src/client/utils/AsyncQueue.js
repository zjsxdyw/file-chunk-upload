class AsyncQueue {
  /**
   * Constructor
   * @param {Number} num
   */
  constructor(num) {
    num = Number(num);
    this.maxLength = num > 0 ? num : 1;
    this.queue = [];
    this.uid = 0;
    this.set = new Set();
    this.map = {};
  }

  /**
   * Add a callback to the queue
   * @param {Function} callback
   * @param {String} taskId
   * @param {Boolean} forward
   * @return {Number}
   */
  add(callback, taskId, forward) {
    let operator = forward ? 'unshift' : 'push';
    let uid = `${taskId || ''}_${this.uid++}`;
    this.queue[operator]({
      uid,
      fn: callback
    });
    this.run();
    return uid;
  }

  /**
   * Run the callback from the queue
   */
  run() {
    Promise.resolve().then(() => {
      for(let i = 0; i < this.queue.length && this.set.size < this.maxLength; i++) {
        let { uid, fn } = this.queue[i];
        let taskId = uid.replace(/_\d+$/, '');
        if(this.map[taskId]) continue;
        Promise.resolve().then(() => fn(uid));
        this.set.add(uid);
        this.queue.splice(i--, 1);
      }
    });
  }

  /**
   * Notify the queue to complete the task
   * @param {String} uid
   */
  done(uid) {
    if(this.set.has(uid)) {
      this.set.delete(uid);
    }
    this.run();
  }

  /**
   * Change the max length
   * @param {Number} num
   */
  changeLength(num) {
    num = Number(num);
    this.maxLength = num > 0 ? num : 1;
    this.run();
  }

  /**
   * Notify the queue pause the task
   * @param {String} taskId
   */
  pause(taskId) {
    this.map[taskId] = true;
  }

  /**
   * Notify the queue continue the task
   * @param {String} taskId
   */
  continue(taskId) {
    delete this.map[taskId];
    this.run();
  }

  /**
   * Notify the queue remove the task
   * @param {String} taskId
   */
  remove(taskId) {
    delete this.map[taskId];
    for(let i = this.queue.length - 1; i >= 0; i--) {
      let { uid } = this.queue[i];
      if(uid.replace(/_\d+$/, '') === taskId) this.queue.splice(i, 1);
    }
  }
}

export default AsyncQueue