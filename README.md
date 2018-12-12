# file-chunk-upload

## Installation
```sh
npm install file-chunk-upload
```
### Import
- ESM
```js
import FileUploader from 'file-chunk-upload'
```
- CommonJS
```js
var FileUploader = require('file-chunk-upload')
```
- CDN

```html
<script src="https://unpkg.com/file-chunk-upload/dist/file-chunk-upload.min.js"></script>
```
### Usage
```js
var fileUploader = new FileUpload({
  // The first size of a file(in B) to breakpoint resume
  firstSize: 256 * 1024,
  // The size of a chunk(in B)
  chunkSize: 4 * 1024 * 1024,
  // The time of expiration
  expiration: 24 * 60 * 60,
  // Number of concurrent uploads
  maxConcurrent: 2,
  // Auto file upload
  autoUpload: true,
  // The url of prepare to upload
  prepareUrl: '/file/prepare',
  // The url of uploading every chunk
  uploadUrl: '/file/upload',
  // The url of checking md5
  checkUrl: '/file/check',
  // The url of merging file
  mergeUrl: '/file/merge',
  // The request headers
  headers: {},
  // The number of reupload the chunk if fail
  reupload: 5,
  // Upload success callback
  success: function(fileObj, response) {
    console.log(response);
  },
  // Upload error callback
  error: function(fileObj, error, type) {
    console.log(error, type);
  },
  // Upload progress callback
  progress: function(fileObj) {
    console.log(fileObj.percentage);
  }
});
// add File to fileUploader
var fileObj = fileUploader.addFile(file);
// if autoUpload is false
fileUploader.upload(fileObj);
// pause upload
fileUploader.pause(fileObj);
// continue upload
fileUploader.continue(fileObj);
// remove file
fileUploader.remove(fileObj);
```
## Example
```sh
npm install
npm run dev
```
