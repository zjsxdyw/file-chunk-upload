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
    this.index = 0;
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
    let uid = this.uid++;
    // this.queue[operator]({
    //   uid,
    //   fn: callback,
    //   taskId
    // });
    // this.run();
    // return uid;


    let index = this.queue.findIndex(item => item.taskId === taskId);
    let task;
    if(index === -1) {
      task = {
        taskId,
        taskList: []
      };
      this.queue.unshift(task);
    } else task = this.queue[index];
    task.taskList[operator]({ uid, fn: callback });
    this.run();
    return uid;
  }

  /**
   * Run the callback from the queue
   */
  run() {
    Promise.resolve().then(() => {
      // for(let i = 0; i < this.queue.length && this.set.size < this.maxLength; i++) {
      //   let { uid, fn, taskId } = this.queue[i];
      //   if(this.map[taskId]) continue;
      //   Promise.resolve().then(() => fn(uid));
      //   this.set.add(uid);
      //   this.queue.splice(i--, 1);
      // }

      while(this.index < this.queue.length && this.set.size < this.maxLength) {
        let { taskId, taskList } = this.queue[this.index];
        if(this.map[taskId]) {
          if(this.index === 0) break;
          this.index = 0;
          continue;
        }
        let { uid, fn } = taskList.shift();
        this.set.add(uid);
        Promise.resolve().then(() => fn(uid));
        if(taskList.length === 0) this.queue.splice(this.index, 1);
        else this.index++;
        if(this.index >= this.queue.length) this.index = 0;
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

    let index = this.queue.findIndex(item => item.taskId === taskId);
    if(index === -1) return;
    let task = this.queue[index];
    this.queue.splice(index, 1);
    this.queue.push(task);
  }

  /**
   * Notify the queue continue the task
   * @param {String} taskId
   */
  continue(taskId) {
    delete this.map[taskId];
    // this.run();

    let index = this.queue.findIndex(item => item.taskId === taskId);
    if(index === -1) return;
    let task = this.queue[index];
    this.queue.splice(index, 1);
    this.queue.unshift(task);
  }

  /**
   * Notify the queue remove the task
   * @param {String} taskId
   */
  remove(taskId) {
    delete this.map[taskId];
    for(let i = this.queue.length - 1; i >= 0; i--) {
      if(this.queue[i].taskId === taskId) this.queue.splice(i, 1);
    }
  }
}

export default AsyncQueue