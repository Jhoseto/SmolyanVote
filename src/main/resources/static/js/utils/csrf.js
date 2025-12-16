// Reads CSRF token and header name from meta tags and augments fetch to include them.
(function () {
  function getCsrfToken() {
    // 1. Try window.CSRF_TOKEN (от topHtmlStyles fragment)
    if (window.CSRF_TOKEN) return window.CSRF_TOKEN;
    
    // 2. Try window.getCsrfToken() function (от topHtmlStyles fragment)
    if (window.getCsrfToken && typeof window.getCsrfToken === 'function') {
      var token = window.getCsrfToken();
      if (token) return token;
    }
    
    // 3. Try meta tag
    var meta = document.querySelector('meta[name="_csrf"]');
    if (meta && meta.getAttribute('content')) return meta.getAttribute('content');
    
    // 4. Try window.SVMESSENGER_CSRF (от svMessengerWidget)
    if (window.SVMESSENGER_CSRF && window.SVMESSENGER_CSRF.token) {
      return window.SVMESSENGER_CSRF.token;
    }
    
    // 5. Try cookie fallback: XSRF-TOKEN
    var m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function getCsrfHeader() {
    // 1. Try window.CSRF_HEADER (от topHtmlStyles fragment)
    if (window.CSRF_HEADER) return window.CSRF_HEADER;
    
    // 2. Try window.getCsrfHeader() function (от topHtmlStyles fragment)
    if (window.getCsrfHeader && typeof window.getCsrfHeader === 'function') {
      return window.getCsrfHeader();
    }
    
    // 3. Try meta tag
    var meta = document.querySelector('meta[name="_csrf_header"]');
    if (meta && meta.getAttribute('content')) return meta.getAttribute('content');
    
    // 4. Try window.SVMESSENGER_CSRF (от svMessengerWidget)
    if (window.SVMESSENGER_CSRF && window.SVMESSENGER_CSRF.headerName) {
      return window.SVMESSENGER_CSRF.headerName;
    }
    
    return 'X-XSRF-TOKEN';
  }

  if (!window.fetch) {
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
      // Get CSRF token dynamically (може да се промени)
      var csrfToken = getCsrfToken();
      var csrfHeader = getCsrfHeader();
      
      if (csrfToken && csrfHeader) {
        init.headers[csrfHeader] = csrfToken;
      } else {
        console.warn('⚠️ CSRF token not found for request to:', url);
      }
    }

    return originalFetch(input, init);
  };
})();


