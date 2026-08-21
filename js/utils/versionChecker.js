/**
 * Auto-Version Checker & Cache-Buster Engine
 * Detects new server releases and forces clean cache updates across devices
 */

export const CURRENT_APP_VERSION = '1.0.9';

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

  // Update stored version to prevent banner loop
  const newVer = targetVersion || CURRENT_APP_VERSION;
  localStorage.setItem('kp_app_version', newVer);

  // Reload with cache-buster query parameter
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

    // If server version matches current running code, sync and dismiss banner
    if (data.version === CURRENT_APP_VERSION) {
      localStorage.setItem('kp_app_version', CURRENT_APP_VERSION);
      const banner = document.getElementById('app-update-banner');
      if (banner) banner.remove();
      return;
    }

    // Only show banner if server version is strictly newer/different from CURRENT_APP_VERSION
    console.log(`[VersionChecker] New version detected: ${data.version} (current running: ${CURRENT_APP_VERSION})`);
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
      <button class="update-banner-close" id="dismiss-update-btn">&times;</button>
    </div>
  `;

  document.getElementById('apply-update-btn')?.addEventListener('click', async () => {
    localStorage.setItem('kp_app_version', updateData.version);
    banner.remove();
    await forceReloadApp(updateData.version);
  });

  document.getElementById('dismiss-update-btn')?.addEventListener('click', () => {
    banner.remove();
  });
}
