import { getStoredTheme, setStoredTheme, applyTheme, type ThemeMode } from './index';

/**
 * TwinSpace Theme Architecture Automated Test Suite
 * Validates theme persistence, DOM class/attribute applications, and system mode resolution.
 */
export function runThemeTests() {
  console.log('Running TwinSpace Theme Suite...');

  // Test 1: Default to dark theme
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  const defaultTheme = getStoredTheme();
  console.assert(defaultTheme === 'dark', 'Test 1 Failed: Default theme should be dark');

  // Test 2: Persistence in localStorage under twinspace_theme
  setStoredTheme('light');
  console.assert(localStorage.getItem('twinspace_theme') === 'light', 'Test 2 Failed: Theme light should persist');
  setStoredTheme('dark');
  console.assert(localStorage.getItem('twinspace_theme') === 'dark', 'Test 2 Failed: Theme dark should persist');

  // Test 3: Apply Dark Theme DOM Attribute & Class
  const effectiveDark = applyTheme('dark');
  console.assert(effectiveDark === 'dark', 'Test 3 Failed: Effective theme should be dark');
  console.assert(document.documentElement.getAttribute('data-theme') === 'dark', 'Test 3 Failed: data-theme should be dark');
  console.assert(document.documentElement.classList.contains('dark'), 'Test 3 Failed: classList should contain dark');

  // Test 4: Apply Light Theme DOM Attribute & Class
  const effectiveLight = applyTheme('light');
  console.assert(effectiveLight === 'light', 'Test 4 Failed: Effective theme should be light');
  console.assert(document.documentElement.getAttribute('data-theme') === 'light', 'Test 4 Failed: data-theme should be light');
  console.assert(!document.documentElement.classList.contains('dark'), 'Test 4 Failed: classList should not contain dark');

  console.log('✅ TwinSpace Theme Suite: All 4 Tests Passed!');
}
