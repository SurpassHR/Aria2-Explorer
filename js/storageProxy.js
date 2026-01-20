// js/storageProxy.js
// Storage Proxy Module - Ensures consistent storage across Firefox containers
// Firefox containers have isolated storage.local, so we use storage.sync instead
// which is shared across all containers.

import BrowserCompat from './browserCompat.js';

/**
 * StorageProxy provides a unified storage interface that works consistently
 * across Firefox containers by using storage.sync on Firefox.
 * 
 * Note: storage.sync has a 100KB total limit and 8KB per item limit.
 * For most extension configs this should be sufficient.
 */
class StorageProxy {
    /**
     * Get the appropriate storage area
     * Firefox: use storage.sync to avoid container isolation
     * Chrome: use storage.local for better performance
     */
    static get storage() {
        return BrowserCompat.isFirefox ? chrome.storage.sync : chrome.storage.local;
    }
    
    /**
     * Get values from storage
     * @param {string|string[]|object|null} keys - Keys to retrieve
     * @returns {Promise<object>} Storage values
     */
    static async get(keys = null) {
        return this.storage.get(keys);
    }
    
    /**
     * Set values in storage
     * @param {object} items - Key-value pairs to store
     * @returns {Promise<void>}
     */
    static async set(items) {
        return this.storage.set(items);
    }
    
    /**
     * Remove values from storage
     * @param {string|string[]} keys - Keys to remove
     * @returns {Promise<void>}
     */
    static async remove(keys) {
        return this.storage.remove(keys);
    }
    
    /**
     * Clear all storage
     * @returns {Promise<void>}
     */
    static async clear() {
        return this.storage.clear();
    }
}

export default StorageProxy;
