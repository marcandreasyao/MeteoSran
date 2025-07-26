import React, { useState, useEffect } from 'react';

interface PWAInstallPromptProps {
  theme: 'light' | 'dark';
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Type declaration for gtag
declare global {
  function gtag(command: string, targetId: string, config?: any): void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ theme }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInstalled = isStandalone || isInWebAppiOS;
      setIsInstalled(isInstalled);
    };

    checkInstallStatus();

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show custom install prompt after a delay
      setTimeout(() => {
        if (!isInstalled) {
          setIsVisible(true);
        }
      }, 5000); // Show after 5 seconds
    };

    // Listen for app shortcut events
    const handleAppShortcut = (e: CustomEvent) => {
      console.log('App shortcut activated:', e.detail);
      // Handle different shortcut types
      if (e.detail.type === 'weather') {
        // Focus on weather input or show weather widget
        window.dispatchEvent(new CustomEvent('focus-weather-input'));
      } else if (e.detail.type === 'image') {
        // Trigger image upload
        window.dispatchEvent(new CustomEvent('trigger-image-upload'));
      }
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      setIsVisible(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      
      // Show success message
      showInstallSuccessMessage();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('app-shortcut', handleAppShortcut as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('app-shortcut', handleAppShortcut as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const showInstallSuccessMessage = () => {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg
      ${theme === 'dark' 
        ? 'bg-green-800 text-green-100 border border-green-700' 
        : 'bg-green-100 text-green-800 border border-green-300'
      }
      transform transition-all duration-500 ease-out
    `;
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span class="font-medium">MeteoSran installed successfully!</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User ${outcome} the install prompt`);
      
      setDeferredPrompt(null);
      setIsVisible(false);
      
      if (outcome === 'accepted') {
        // Track successful install intent
        if (typeof gtag !== 'undefined') {
          gtag('event', 'pwa_install_accepted', {
            'event_category': 'PWA',
            'event_label': 'Install prompt accepted'
          });
        }
      }
    } catch (error) {
      console.error('Error during PWA install:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Track dismissal
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install_dismissed', {
        'event_category': 'PWA',
        'event_label': 'Install prompt dismissed'
      });
    }
    
    // Show again after 1 hour
    setTimeout(() => {
      if (!isInstalled && deferredPrompt) {
        setIsVisible(true);
      }
    }, 60 * 60 * 1000);
  };

  if (!isVisible || isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className={`
        p-4 rounded-lg shadow-xl border backdrop-blur-sm
        ${theme === 'dark' 
          ? 'bg-gray-800/90 text-white border-gray-700' 
          : 'bg-white/90 text-gray-900 border-gray-200'
        }
        transform transition-all duration-500 ease-out
        animate-slide-up
      `}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <img 
              src="/Meteosran-logo.png" 
              alt="MeteoSran" 
              className="w-12 h-12 rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              Install MeteoSran
            </h3>
            <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Get instant access to weather insights with our PWA. Works offline and feels like a native app!
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleInstall}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                  ${theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                  ${theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }
                `}
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-1 rounded-full transition-colors
              ${theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-200 text-gray-500'
              }
            `}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Add CSS animation for slide up effect
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.5s ease-out;
  }
`;

if (!document.head.querySelector('[data-pwa-styles]')) {
  styleSheet.setAttribute('data-pwa-styles', 'true');
  document.head.appendChild(styleSheet);
}

export default PWAInstallPrompt;
