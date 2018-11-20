/**
 * Generate Guid
 * @return {String}
 */
export const guid = () => {
  let s = [];
  let hexDigits = "0123456789abcdef";
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  // bits 12-15 of the time_hi_and_version field to 0010
  s[14] = "4";
  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
};

/**
 * Use Object.prototype.toString
 * @param {Any} obj
 * @return {String}
 */
export const toString = (obj) => {
  return Object.prototype.toString.call(obj);
};

/**
 * Check whether the fn is function
 * @param {Any} fn
 * @return {Boolean}
 */
export const isFunction = (fn) => {
  return toString(fn) === '[object Function]';
};

/**
 * Check whether the obj is Object
 * @param {Any} obj
 * @return {Boolean}
 */
export const isObject = (obj) => {
  return toString(obj) === '[object Object]';
};

/**
 * Check whether the p is Promise
 * @param {Any} p
 * @return {Boolean}
 */
export const isPromise = (p) => {
  if(toString(p) === '[object Promise]') return true;
  return !!p && isFunction(p.then) && isFunction(p.cacah) && isFunction(p.finally);
};

/**
 * Extend the object
 * @param {Object} target
 * @param {Object} source
 * @return {Object}
 */
export const extend = (target, options) => {
  target = target || {};
  options = options || {};
  for(let key in options) {
    let value1 = target[key];
    let value2 = options[key];
    if(Array.isArray(value2) || isObject(value2)) {
      target[key] = extend(value1, value2);
    } else if(toString(value1) === toString(value2)) {
      target[key] = value1;
    } else {
      target[key] = value2;
    }
  }
  return target;
}