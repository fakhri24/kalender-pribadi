/**
 * Auto-Version Checker & Cache-Buster Engine
 * Detects new server releases and forces clean cache updates across devices
 */

export const CURRENT_APP_VERSION = '1.0.5';

/**
 * Force clear cache and hard reload the application
 */
export async function forceReloadApp() {
  try {
    // Clear CacheStorage if supported
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Unregister service workers if any
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  } catch (err) {
    console.warn('Error clearing caches:', err);
  }

  // Update stored version and reload with timestamp cache-buster
  localStorage.setItem('kp_app_version', CURRENT_APP_VERSION);
  const cleanUrl = window.location.origin + window.location.pathname + '?_t=' + Date.now();
  window.location.href = cleanUrl;
}

/**
 * Check if a new version is available on the server
 */
export async function checkForAppUpdate() {
  try {
    const res = await fetch(`version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!res.ok) return;

    const data = await res.json();
    const storedVersion = localStorage.getItem('kp_app_version');

    if (!storedVersion) {
      localStorage.setItem('kp_app_version', data.version || CURRENT_APP_VERSION);
      return;
    }

    if (data.version && data.version !== storedVersion && data.version !== CURRENT_APP_VERSION) {
      console.log(`[VersionChecker] New version detected: ${data.version} (current: ${CURRENT_APP_VERSION})`);
      showUpdateBanner(data);
    }
  } catch (err) {
    // Ignore network failure when offline
  }
}

/**
 * Render a non-intrusive floating update notification
 */
function showUpdateBanner(updateData) {
  if (document.getElementById('app-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'app-update-banner';
  banner.className = 'app-update-banner';
  banner.innerHTML = `
    <div class="update-banner-content">
      <span class="update-banner-icon">⚡</span>
      <div class="update-banner-text">
        <strong>Versi Baru (v${updateData.version}) Tersedia!</strong>
        <small>${updateData.changeNotes || 'Pembaruan aplikasi siap digunakan.'}</small>
      </div>
    </div>
    <div class="update-banner-actions">
      <button class="btn btn-sm btn-primary" id="apply-update-btn">
        Muat Ulang
      </button>
      <button class="update-banner-close" id="dismiss-update-btn">&times;</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('apply-update-btn')?.addEventListener('click', () => {
    localStorage.setItem('kp_app_version', updateData.version);
    forceReloadApp();
  });

  document.getElementById('dismiss-update-btn')?.addEventListener('click', () => {
    banner.remove();
  });
}
