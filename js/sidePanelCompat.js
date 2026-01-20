// js/sidePanelCompat.js
// Side Panel Compatibility Module - Provides Firefox fallback for Chrome's Side Panel API
// Requirements: 10.1, 10.2, 10.3

import BrowserCompat from './browserCompat.js';

/**
 * SidePanelCompat provides a cross-browser abstraction for Chrome's Side Panel API.
 * On Chrome: Uses the native chrome.sidePanel API
 * On Firefox: Falls back to opening a new tab since Side Panel is not supported
 */
class SidePanelCompat {
    /**
     * Open the side panel or fallback to a new tab
     * @param {Object} options - Options for opening the panel
     * @param {number} [options.windowId] - The window ID to open the panel in
     * @param {number} [options.tabId] - The tab ID to open the panel for
     * @returns {Promise<void|Object>} - Resolves when panel is opened or tab is created
     */
    static async open(options) {
        if (BrowserCompat.supportsSidePanel) {
            return chrome.sidePanel.open(options);
        }
        // Firefox: Use a new tab as a fallback since Side Panel is not supported
        const url = chrome.runtime.getURL('ui/ariang/index.html');
        return browser.tabs.create({ url });
    }
    
    /**
     * Set side panel options
     * @param {Object} options - Panel options
     * @param {string} [options.path] - The path to the panel HTML file
     * @param {boolean} [options.enabled] - Whether the panel is enabled
     * @param {number} [options.tabId] - The tab ID to set options for
     * @returns {Promise<void>}
     */
    static async setOptions(options) {
        if (BrowserCompat.supportsSidePanel) {
            return chrome.sidePanel.setOptions(options);
        }
        // Firefox: No-op since Side Panel is not supported
        return Promise.resolve();
    }
    
    /**
     * Get side panel options
     * @param {Object} options - Query options
     * @param {number} [options.tabId] - The tab ID to get options for
     * @returns {Promise<Object>} - Panel options object
     */
    static async getOptions(options) {
        if (BrowserCompat.supportsSidePanel) {
            return chrome.sidePanel.getOptions(options);
        }
        // Firefox: Return default values since Side Panel is not supported
        return { path: 'ui/ariang/index.html' };
    }
    
    /**
     * Set panel behavior
     * @param {Object} behavior - Panel behavior options
     * @param {boolean} [behavior.openPanelOnActionClick] - Whether to open panel on action click
     * @returns {Promise<void>}
     */
    static async setPanelBehavior(behavior) {
        if (BrowserCompat.supportsSidePanel) {
            return chrome.sidePanel.setPanelBehavior(behavior);
        }
        // Firefox: No-op since Side Panel is not supported
        return Promise.resolve();
    }
}

export default SidePanelCompat;
