class Observer {
  /**
   * Constructor
   */
  constructor() {
    this.messages = {};
  }
  /**
   * Get all listeners by type
   * @param {String} type
   * @return {Function[]}
   */
  getListeners(type) {
    let messages = this.messages;
    type = type.toLowerCase();
    return messages[type] || (messages[type] = []);
  }
  /**
   * Add a event listener
   * @param {String} type
   * @param {Function} listener
   */
  on(type, listener) {
    let listeners = this.getListeners(type);
    if(listeners.indexOf(listener) === -1) listeners.push(listener);
  }
  /**
   * Add a event listener
   * @param {String} type
   * @param {Function} listener
   */
  addListener(type, listener) {
    this.on(type, listener);
  }
  /**
   * Fire event
   * @param {String} type
   */
  fireEvent(type) {
    let args = Array.prototype.slice.call(arguments, 1),
        listeners = this.getListeners(type);
    for (let fn, j = 0; j < listeners.length; j++) {
      fn = listeners[j];
      if (fn.apply(this, args) === false) {
        return false;
      }
      while (listeners[j] !== fn) j--;
    }
    return true;
  }
  /**
   * Remove a event listener
   * @param {String} type
   * @return {Boolean}
   */
  remove(type, listener) {
    let listeners = this.getListeners(type),
        index = listeners.indexOf(listener);
    if(index !== -1) {
      listeners.splice(index, 1);
      return true;
    }
    return false;
  }
}

export default Observer