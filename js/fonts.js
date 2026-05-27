(function () {
    var link = document.getElementById('fonts-inter');
    if (!link) return;
    if (link.sheet) {
        link.media = 'all';
    } else {
        link.addEventListener('load', function () { link.media = 'all'; });
    }
})();
