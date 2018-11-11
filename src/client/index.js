document.getElementsByTagName('input')[0].addEventListener('change', function() {
    console.log(this.fileList);
});

fetch('/api/getUsername').then(res => res.json()).then(user => console.log(user));