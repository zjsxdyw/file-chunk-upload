/**
 * Creates a XHR request
 * @param {Object} options
 * @return {XMLHttpRequest}
 */
const createRequest = (options) => {
  const xhr = new XMLHttpRequest();
  xhr.open(options.type || 'GET', options.url, true);
  xhr.responseType = options.responseType || 'json';
  if (options.headers) {
    Object.keys(options.headers).forEach(key => {
      xhr.setRequestHeader(key, options.headers[key]);
    });
  }
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  return xhr;
}

/**
 * Send a XHR request
 * @param {XMLHttpRequest} xhr
 * @return {Promise}
 */
const sendRequest = (xhr, data) => {
  let promise = new Promise((resolve, reject) => {
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let response;
        try {
          response = JSON.parse(xhr.response);
        } catch (err) {
          response = xhr.response;
        }
        resolve(response);
      } else {
        reject(xhr);
      }
    }
    xhr.onerror = (err) => reject(xhr);
    xhr.send(data);
  });
  
  promise.abort = () => {
    xhr.abort();
  };
  return promise;
}

/**
 * Submit file with XHR
 * @param {Object} options
 * @return {Promise}
 */
export const submitFile = (options) => {
  const data = options.data;
  const formData = new FormData();
  for (let name in data) {
    formData.append(name, data[name]);
  }
  options.type = options.type || 'POST';
  options.headers = options.headers || {};
  // options.headers['Content-type'] = 'multipart/form-data;charset=utf-8';
  const xhr = createRequest(options);

  if(typeof options.progress === 'function') {
    xhr.upload.addEventListener('progress', function (evt) {
      if (evt.lengthComputable) {
        options.progress(evt);
      }
    }, false);
  }

  return sendRequest(xhr, formData);
}

/**
 * Send a normal request
 * @param {Object} options
 * @returns Promise
 */
export default function (options) {
  options.type = (options.type || 'GET').toUpperCase();
  let data, url = options.url;
  if(options.data) {
    data = '';
    Object.keys(options.data).forEach(key => {
      if(options.data[key] === undefined) return;
      if(data) data += `&`;
      data += `${key}=${options.data[key]}`;
    });
  }
  if(options.type === 'GET') {
    options.url += `?${data}`;
    data = null;
  }
  if(options.type === 'POST') {
    let headers = options.headers || {};
    if(options.contentType === 'json') {
      headers['Content-type'] = 'application/json;charset=utf-8';
      data = JSON.stringify(options.data);
    } else if(data) {
      headers['Content-type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    }
    options.headers = headers;
  }
  return sendRequest(createRequest(options), data);
}