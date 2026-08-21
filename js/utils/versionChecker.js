/**
 * Auto-Version Checker & Cache-Buster Engine
 * Uses version.json as the Single Source of Truth to detect updates and prevent banner loops
 */

export function getAppVersion() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('kp_app_version') || '1.0.9';
  }
  return '1.0.9';
}

export const CURRENT_APP_VERSION = getAppVersion();

/**
 * Force clear cache and hard reload the application
 * @param {string} [targetVersion]
 */
export async function forceReloadApp(targetVersion = null) {
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

  // Update stored active version
  if (targetVersion) {
    localStorage.setItem('kp_app_version', targetVersion);
  }

  // Reload with cache-buster timestamp query parameter
  const url = new URL(window.location.href);
  url.searchParams.set('_v', Date.now().toString());
  window.location.replace(url.toString());
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
    if (!data.version) return;

    const storedVersion = localStorage.getItem('kp_app_version');

    // First time load: save current server version without prompting
    if (!storedVersion) {
      localStorage.setItem('kp_app_version', data.version);
      return;
    }

    // If current stored version matches server version, ensure banner is removed
    if (storedVersion === data.version) {
      const banner = document.getElementById('app-update-banner');
      if (banner) banner.remove();
      return;
    }

    // If user already dismissed this version during current session, do not re-prompt
    if (sessionStorage.getItem('kp_dismissed_version') === data.version) {
      return;
    }

    // New version detected -> render floating update banner
    console.log(`[VersionChecker] New version detected on server: ${data.version} (active: ${storedVersion})`);
    showUpdateBanner(data);
  } catch (err) {
    // Ignore network failure when offline
  }
}

/**
 * Render a non-intrusive floating update notification
 */
function showUpdateBanner(updateData) {
  let banner = document.getElementById('app-update-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'app-update-banner';
    banner.className = 'app-update-banner';
    document.body.appendChild(banner);
  }

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
      <button class="update-banner-close" id="dismiss-update-btn" title="Tutup notifikasi">&times;</button>
    </div>
  `;

  document.getElementById('apply-update-btn')?.addEventListener('click', async () => {
    localStorage.setItem('kp_app_version', updateData.version);
    banner.remove();
    await forceReloadApp(updateData.version);
  });

  document.getElementById('dismiss-update-btn')?.addEventListener('click', () => {
    sessionStorage.setItem('kp_dismissed_version', updateData.version);
    banner.remove();
  });
}
