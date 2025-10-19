/**
 * Mobile Utilities for SmolyanVote
 * Touch gestures, pull-to-refresh, and mobile-specific interactions
 */

class MobileUtils {
  constructor() {
    this.isMobile = window.innerWidth <= 768;
    this.isTouch = 'ontouchstart' in window;
    this.init();
  }

  init() {
    if (this.isMobile) {
      this.setupViewportFix();
      this.setupTouchFeedback();
      this.setupSwipeGestures();
      this.preventZoomOnDoubleTap();
      this.handleSafeArea();
    }
  }

  // Fix for iOS viewport height (address bar)
  setupViewportFix() {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
  }

  // Add touch feedback to buttons
  setupTouchFeedback() {
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('button, .btn, a');
      if (target) {
        target.style.opacity = '0.7';
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const target = e.target.closest('button, .btn, a');
      if (target) {
        target.style.opacity = '';
      }
    }, { passive: true });
  }

  // Swipe gesture detection
  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY, e.target);
    }, { passive: true });
  }

  handleSwipe(startX, startY, endX, endY, target) {
    const diffX = endX - startX;
    const diffY = endY - startY;
    const minSwipeDistance = 50;

    // Horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        this.onSwipeRight(target);
      } else {
        this.onSwipeLeft(target);
      }
    }

    // Vertical swipe
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipeDistance) {
      if (diffY > 0) {
        this.onSwipeDown(target);
      } else {
        this.onSwipeUp(target);
      }
    }
  }

  onSwipeRight(target) {
    // Close mobile menu if open
    const mobileMenu = document.querySelector('.navbar-nav-section-glass.active');
    if (mobileMenu) {
      this.closeMobileMenu();
    }

    // Back navigation in modals
    const activeModal = document.querySelector('.modal.show');
    if (activeModal) {
      const closeBtn = activeModal.querySelector('.btn-close');
      if (closeBtn) closeBtn.click();
    }
  }

  onSwipeLeft(target) {
    // Could open filters drawer or similar
  }

  onSwipeDown(target) {
    // Pull to refresh implementation
    if (window.scrollY === 0 && !target.closest('.scroll-container')) {
      this.triggerPullToRefresh();
    }
  }

  onSwipeUp(target) {
    // Could hide bottom sheet or similar
  }

  // Prevent double-tap zoom
  preventZoomOnDoubleTap() {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  // Handle safe area for notched devices
  handleSafeArea() {
    if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
      document.body.classList.add('has-safe-area');
    }
  }

  // Pull to refresh
  triggerPullToRefresh() {
    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'pull-refresh-indicator';
    refreshIndicator.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
    document.body.appendChild(refreshIndicator);

    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  // Mobile menu toggle
  closeMobileMenu() {
    const menu = document.querySelector('.navbar-nav-section-glass');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (menu) menu.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
  }

  // Detect if running as PWA
  static isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Vibration feedback
  static vibrate(pattern = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Share API
  static async share(data) {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        console.log('Share cancelled or failed:', err);
        return false;
      }
    } else {
      // Fallback to copy to clipboard
      if (data.url && navigator.clipboard) {
        await navigator.clipboard.writeText(data.url);
        return true;
      }
      return false;
    }
  }

  // Check network status
  static isOnline() {
    return navigator.onLine;
  }

  // Get device info
  static getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      isIOS: /iPad|iPhone|iPod/.test(ua),
      isAndroid: /Android/.test(ua),
      isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
      isChrome: /Chrome/.test(ua),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mobileUtils = new MobileUtils();
  });
} else {
  window.mobileUtils = new MobileUtils();
}

// Export for use in other modules
window.MobileUtils = MobileUtils;
