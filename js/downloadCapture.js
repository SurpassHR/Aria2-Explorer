// js/downloadCapture.js
// Download Capture Module - Handles cross-browser download event capture
// Requirements: 3.2, 3.4

import BrowserCompat from './browserCompat.js';

/**
 * DownloadCapture provides a unified interface for capturing download events
 * across different browsers.
 * 
 * - Chrome: Uses downloads.onDeterminingFilename for complete filename info
 * - Firefox: Falls back to downloads.onCreated as onDeterminingFilename is not supported
 */
class DownloadCapture {
    #captureCallback = null;
    #isListening = false;
    #boundHandleDeterminingFilename = null;
    #boundHandleDownloadCreated = null;
    
    constructor() {
        this.useOnDeterminingFilename = BrowserCompat.supportsOnDeterminingFilename;
        // Pre-bind handlers to ensure we can properly remove listeners
        this.#boundHandleDeterminingFilename = this.#handleDeterminingFilename.bind(this);
        this.#boundHandleDownloadCreated = this.#handleDownloadCreated.bind(this);
    }
    
    /**
     * Start capturing download events
     * @param {Function} callback - Callback function to handle download items
     */
    startCapture(callback) {
        if (this.#isListening) {
            return; // Already listening
        }
        
        this.#captureCallback = callback;
        
        if (this.useOnDeterminingFilename) {
            // Chrome: Use onDeterminingFilename to get complete filename
            chrome.downloads.onDeterminingFilename.addListener(
                this.#boundHandleDeterminingFilename
            );
        } else {
            // Firefox: Use onCreated as fallback
            browser.downloads.onCreated.addListener(
                this.#boundHandleDownloadCreated
            );
        }
        this.#isListening = true;
    }
    
    /**
     * Stop capturing download events
     */
    stopCapture() {
        if (!this.#isListening) {
            return; // Not listening
        }
        
        if (this.useOnDeterminingFilename) {
            chrome.downloads.onDeterminingFilename.removeListener(
                this.#boundHandleDeterminingFilename
            );
        } else {
            browser.downloads.onCreated.removeListener(
                this.#boundHandleDownloadCreated
            );
        }
        this.#isListening = false;
        this.#captureCallback = null;
    }
    
    /**
     * Check if currently listening for download events
     * @returns {boolean}
     */
    get isListening() {
        return this.#isListening;
    }
    
    /**
     * Chrome implementation: Handle onDeterminingFilename event
     * This event provides the suggested filename before the download starts
     * @param {Object} downloadItem - The download item
     * @param {Function} suggest - Function to suggest a filename (must be called)
     * @private
     */
    #handleDeterminingFilename(downloadItem, suggest) {
        // Must call suggest() to allow the download to proceed
        suggest();
        if (this.#captureCallback) {
            this.#captureCallback(downloadItem);
        }
    }
    
    /**
     * Firefox implementation: Handle onCreated event
     * This event fires when a download is created, but may not have complete info
     * We need to query for additional download information
     * @param {Object} downloadItem - The download item
     * @private
     */
    async #handleDownloadCreated(downloadItem) {
        // Firefox's onCreated fires immediately when download starts
        // Skip already finished downloads
        if (downloadItem.state === 'complete' || downloadItem.state === 'interrupted') {
            return;
        }
        
        try {
            // Wait a short time for Firefox to receive Content-Length header
            // This allows totalBytes to be populated
            await new Promise(resolve => setTimeout(resolve, 150));
            
            // Query for more complete download information
            const items = await browser.downloads.search({ id: downloadItem.id });
            
            if (items.length > 0) {
                const fullItem = items[0];
                
                // Check if download was already cancelled/completed during our wait
                if (fullItem.state === 'complete' || fullItem.state === 'interrupted') {
                    return;
                }
                
                if (this.#captureCallback) {
                    this.#captureCallback(fullItem);
                }
            } else {
                // If search returns nothing, use the original item
                if (this.#captureCallback) {
                    this.#captureCallback(downloadItem);
                }
            }
        } catch (error) {
            // If search fails, use the original item
            console.warn('DownloadCapture: Failed to get full download info', error);
            if (this.#captureCallback) {
                this.#captureCallback(downloadItem);
            }
        }
    }
}

export default DownloadCapture;
