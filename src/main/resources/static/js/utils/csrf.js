// Reads CSRF token and header name from meta tags and augments fetch to include them.
(function () {
  function getMeta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute('content') : null;
  }

  var csrfToken = getMeta('_csrf');
  var csrfHeader = getMeta('_csrf_header') || 'X-XSRF-TOKEN';

  if (!csrfToken) {
    // Try cookie fallback: XSRF-TOKEN
    var m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    csrfToken = m ? decodeURIComponent(m[1]) : null;
  }

  if (!window.fetch || !csrfToken) {
    return; // nothing to do
  }

  var originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    init = init || {};
    init.headers = init.headers || {};

    // Normalize Headers to a plain object for simple assignment
    if (init.headers instanceof Headers) {
      var obj = {};
      init.headers.forEach(function (v, k) { obj[k] = v; });
      init.headers = obj;
    }

    // Attach token only for same-origin requests
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    var isSameOrigin = !/^https?:\/\//i.test(url) || url.indexOf(location.origin) === 0;
    if (isSameOrigin) {
      init.headers[csrfHeader] = csrfToken;
    }

    return originalFetch(input, init);
  };
})();


