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

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
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
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`User response: ${outcome}`);
    this.deferredPrompt = null;
    this.hideInstallButton();
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
