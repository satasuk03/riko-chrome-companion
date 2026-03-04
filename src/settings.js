import { SETTINGS_KEY, SETTINGS_DEFAULTS } from './constants.js';

export async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      resolve({ ...SETTINGS_DEFAULTS, ...result[SETTINGS_KEY] });
    });
  });
}

export async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings }, resolve);
  });
}

export function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[SETTINGS_KEY]) {
      callback({ ...SETTINGS_DEFAULTS, ...changes[SETTINGS_KEY].newValue });
    }
  });
}
