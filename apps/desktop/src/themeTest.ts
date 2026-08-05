import { getStoredTheme, setStoredTheme, applyTheme } from '@syncnotes/utils';

/**
 * Desktop TwinSpace Theme Verification Helper
 */
export function verifyDesktopThemeSystem() {
  setStoredTheme('dark');
  const stored = getStoredTheme();
  if (stored !== 'dark') {
    throw new Error('Theme verification failed: expected dark theme');
  }
  applyTheme('dark');
}
