// PWA Install Prompt Manager
class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('✅ Service Worker registered:', registration.scope);
          })
          .catch(error => {
            console.error('❌ Service Worker registration failed:', error);
          });
      });
    }

    // Always show install button in navbar (will be hidden if not installable)
    this.addInstallButtonToNavbar();

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🚀 PWA Install Prompt received!');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
      this.showNavbarInstallButton();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.hideInstallButton();
      this.hideNavbarInstallButton();
      this.deferredPrompt = null;
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      console.log('📱 PWA already installed, hiding install button');
      this.hideNavbarInstallButton();
    }

    // Debug PWA criteria
    console.log('🔍 PWA Debug Info:');
    console.log('- Service Worker support:', 'serviceWorker' in navigator);
    console.log('- HTTPS:', location.protocol === 'https:');
    console.log('- Manifest:', document.querySelector('link[rel="manifest"]') !== null);
    console.log('- Display mode:', window.matchMedia('(display-mode: standalone)').matches);
    console.log('- iOS standalone:', window.navigator.standalone === true);

    // Fallback: Show install button after 3 seconds if PWA criteria are met
    setTimeout(() => {
      if (this.isPWAInstallable()) {
        console.log('⏰ Fallback: Showing install button after timeout');
        this.showNavbarInstallButton();
        
        // If still no prompt after 5 more seconds, check why
        setTimeout(() => {
          if (!this.deferredPrompt) {
            console.warn('⚠️ No beforeinstallprompt event received after 8 seconds');
            console.log('Possible reasons:');
            console.log('- PWA already installed');
            console.log('- Browser does not support PWA installation');
            console.log('- Site criteria not met (HTTPS, manifest, service worker)');
            console.log('- User has dismissed prompt multiple times (browser blocks it)');
          }
        }, 5000);
      } else {
        console.log('❌ PWA not installable - criteria not met');
      }
    }, 3000);
  }

  showInstallButton() {
    // Create install banner
    const existingBanner = document.getElementById('pwa-install-banner');
    if (existingBanner) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #19861C 0%, #5cb85c 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        z-index: 10000;
        animation: slideUp 0.3s ease;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">
            Инсталирай SmolyanVote
          </div>
          <div style="font-size: 13px; opacity: 0.9;">
            Добави като приложение на началния екран
          </div>
        </div>
        <button id="pwa-install-btn" style="
          background: white;
          color: #19861C;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
        ">
          Инсталирай
        </button>
        <button id="pwa-dismiss-btn" style="
          background: transparent;
          color: white;
          border: none;
          padding: 8px;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
        ">
          ×
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    // Event listeners
    document.getElementById('pwa-install-btn').addEventListener('click', () => {
      this.install();
    });

    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      this.hideInstallButton();
    });
  }

  hideInstallButton() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  async install() {
    console.log('🔘 Install button clicked');
    
    // Check if deferred prompt is available
    if (!this.deferredPrompt) {
      console.warn('⚠️ No install prompt available');
      
      // Check if it's iOS
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isStandalone = window.navigator.standalone === true;
      
      if (isIOS && !isStandalone) {
        // Show iOS installation instructions
        this.showIOSInstructions();
        return;
      }
      
      // For other browsers, show generic message
      alert('Инсталирането не е налично в момента.\n\nМоля, опитайте:\n1. Отворете в Chrome/Edge browser\n2. Проверете дали сайтът е достъпен през HTTPS\n3. Опитайте отново след няколко секунди');
      return;
    }

    // Show the install prompt
    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`✅ User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('🎉 PWA installation accepted!');
      } else {
        console.log('❌ PWA installation dismissed');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
      this.hideNavbarInstallButton();
    } catch (error) {
      console.error('❌ Error during installation:', error);
      alert('Грешка при инсталиране. Моля, опитайте отново.');
    }
  }

  // Add install button to navbar
  addInstallButtonToNavbar() {
    // Wait for navbar to be loaded
    setTimeout(() => {
      // Desktop button (already in HTML)
      const desktopBtn = document.getElementById('navbar-pwa-install');
      if (desktopBtn) {
        desktopBtn.addEventListener('click', () => this.install());
      }
      
      // Mobile button (add to mobile menu)
      const mobileNavbar = document.querySelector('.navbar-nav-section-glass');
      if (mobileNavbar) {
        const mobileInstallBtn = document.createElement('button');
        mobileInstallBtn.id = 'mobile-pwa-install';
        mobileInstallBtn.className = 'nav-link-glass pwa-install-nav-btn';
        mobileInstallBtn.innerHTML = `
          <i class="bi bi-download"></i>
          <span>Инсталирай приложението</span>
        `;
        mobileInstallBtn.style.display = 'none';
        mobileInstallBtn.addEventListener('click', () => this.install());
        
        // Add to mobile menu
        const userSection = mobileNavbar.querySelector('.navbar-user-section-glass');
        if (userSection) {
          userSection.appendChild(mobileInstallBtn);
        } else {
          mobileNavbar.appendChild(mobileInstallBtn);
        }
      }
    }, 1000);
  }

  showNavbarInstallButton() {
    // Show desktop button
    const desktopBtn = document.getElementById('navbar-pwa-install');
    if (desktopBtn) {
      desktopBtn.style.display = 'flex';
    }
    
    // Show mobile button
    const mobileBtn = document.getElementById('mobile-pwa-install');
    if (mobileBtn) {
      mobileBtn.style.display = 'flex';
    }
  }

  hideNavbarInstallButton() {
    // Hide desktop button
    const desktopBtn = document.getElementById('navbar-pwa-install');
    if (desktopBtn) {
      desktopBtn.style.display = 'none';
    }
    
    // Hide mobile button
    const mobileBtn = document.getElementById('mobile-pwa-install');
    if (mobileBtn) {
      mobileBtn.style.display = 'none';
    }
  }

  // Check if PWA is installable
  isPWAInstallable() {
    // Check basic PWA criteria
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    const notAlreadyInstalled = !window.matchMedia('(display-mode: standalone)').matches && window.navigator.standalone !== true;
    
    return hasServiceWorker && hasManifest && isHTTPS && notAlreadyInstalled;
  }

  // Show iOS installation instructions
  showIOSInstructions() {
    const modal = document.createElement('div');
    modal.id = 'ios-install-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      " onclick="this.parentElement.remove()">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        " onclick="event.stopPropagation()">
          <h3 style="margin: 0 0 16px 0; font-size: 20px; color: #19861C;">
            📱 Инсталирай SmolyanVote на iOS
          </h3>
          <div style="text-align: left; line-height: 1.8; color: #333; font-size: 15px;">
            <p style="margin: 16px 0;"><strong>Стъпки за инсталиране:</strong></p>
            <ol style="padding-left: 20px; margin: 12px 0;">
              <li>Натиснете бутона <strong>Share</strong> <span style="font-size: 24px;">⎙</span> в долния край на екрана</li>
              <li>Превъртете надолу и изберете <strong>"Add to Home Screen"</strong> <span style="font-size: 20px;">➕</span></li>
              <li>Натиснете <strong>"Add"</strong> за потвърждение</li>
            </ol>
            <p style="margin: 16px 0; font-size: 13px; color: #666;">
              След това SmolyanVote ще се появи като приложение на началния ви екран!
            </p>
          </div>
          <button onclick="this.closest('#ios-install-modal').remove()" style="
            width: 100%;
            padding: 12px;
            background: #19861C;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 16px;
          ">
            Разбрах
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// Initialize PWA installer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PWAInstaller();
  });
} else {
  new PWAInstaller();
}
