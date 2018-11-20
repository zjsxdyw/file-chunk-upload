class Storage {
  /**
   * Init then name of localStorage
   *
   * @param {String} name
   */
  constructor(name) {
    let storage;
    try {
      storage = JSON.parse(localStorage.getItem(name)) || {};
    } catch(e) {
      storage = {};
    }
    this.name = name;
    this.storage = storage;
    Object.keys(this.storage).forEach(key => {
      let { time } = this.storage[key];
      if(time && time < new Date().getTime()) this.remove(key);
    });
  }

  /**
   * Get the value by key
   * If time is overtime reutrn null
   *
   * @param {String} key
   */
  get(key) {
    if(!this.storage[key]) return null;
    let { time, value } = this.storage[key];
    if(time && time < new Date().getTime()) {
      this.remove(key);
      return null;
    }
    return value;
  }

  /**
   * Get the value by key
   * If time is overtime reutrn null
   *
   * @param {String} key
   * @param {Any} value
   * @param {Number} expiration
   */
  set(key, value, expiration) {
    this.storage[key] = {
      time: expiration ? (new Date().getTime() + expiration * 1000) : 0,
      value: value
    };
    this.saveToStorage();
  }

  /**
   * Remove the value by key
   *
   * @param {String} key
   */
  remove(key) {
    delete this.storage[key];
    this.saveToStorage();
  }

  /**
   * Save all value to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.name, JSON.stringify(this.storage));
    } catch(e) {

    }
  }
}
export default Storage