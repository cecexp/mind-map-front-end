import { MindMap } from '../types';
import { login, register, checkPasswordStrength } from './authService';

// Utility to get current user from localStorage
const getCurrentUser = (): { username?: string } | null => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

const LOCAL_STORAGE_KEY_PREFIX = 'mindmaps_local_storage';

// Get user-specific localStorage key
const getUserStorageKey = (): string => {
    const currentUser = getCurrentUser();
    // Use username instead of ID to ensure consistency across server restarts
    const userId = currentUser?.username || 'anonymous';
    const key = `${LOCAL_STORAGE_KEY_PREFIX}_${userId}`;
    console.log(`🔑 getUserStorageKey: user=${currentUser?.username || 'none'}, username=${userId}, key=${key}`);
    return key;
};

export interface LocalMindMap extends Omit<MindMap, '_id'> {
    id: string;
    createdAt: string;
    updatedAt: string;
}

export const localStorageService = {
    // Get all mind maps from local storage for current user
    getAllMaps: (): LocalMindMap[] => {
        try {
            const storageKey = getUserStorageKey();
            const maps = localStorage.getItem(storageKey);
            const parsedMaps = maps ? JSON.parse(maps) : [];
            console.log(`📥 getAllMaps: key=${storageKey}, found=${parsedMaps.length} maps`);
            return parsedMaps;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    },

    // Save a mind map to local storage for current user
    saveMap: (map: Omit<LocalMindMap, 'id' | 'createdAt' | 'updatedAt'>): LocalMindMap => {
        try {
            const maps = localStorageService.getAllMaps();
            const now = new Date().toISOString();

            const newMap: LocalMindMap = {
                ...map,
                id: generateLocalId(),
                createdAt: now,
                updatedAt: now
            };

            maps.push(newMap);
            const storageKey = getUserStorageKey();
            localStorage.setItem(storageKey, JSON.stringify(maps));
            console.log(`💾 saveMap: saved "${newMap.title}" to ${storageKey}, total maps: ${maps.length}`);
            return newMap;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw new Error('Failed to save mind map locally');
        }
    },

    // Update an existing mind map in local storage for current user
    updateMap: (id: string, updates: Partial<LocalMindMap>): LocalMindMap => {
        try {
            const maps = localStorageService.getAllMaps();
            const mapIndex = maps.findIndex(map => map.id === id);

            if (mapIndex === -1) {
                throw new Error('Mind map not found');
            }

            maps[mapIndex] = {
                ...maps[mapIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            const storageKey = getUserStorageKey();
            localStorage.setItem(storageKey, JSON.stringify(maps));
            return maps[mapIndex];
        } catch (error) {
            console.error('Error updating localStorage:', error);
            throw new Error('Failed to update mind map locally');
        }
    },

    // Delete a mind map from local storage for current user
    deleteMap: (id: string): void => {
        try {
            const storageKey = getUserStorageKey();
            const maps = localStorageService.getAllMaps();
            const mapToDelete = maps.find(map => map.id === id);

            console.log(`🗑️ DELETE MAP ATTEMPT: id=${id}, storageKey=${storageKey}`);
            console.log(`🗑️ Current maps before delete:`, maps.map(m => ({ id: m.id, title: m.title })));

            if (!mapToDelete) {
                console.log(`❌ Map ${id} not found for deletion`);
                return;
            }

            const filteredMaps = maps.filter(map => map.id !== id);
            localStorage.setItem(storageKey, JSON.stringify(filteredMaps));

            console.log(`✅ Deleted map: "${mapToDelete.title}" (${id})`);
            console.log(`📦 Remaining maps in ${storageKey}:`, filteredMaps.length);
        } catch (error) {
            console.error('Error deleting from localStorage:', error);
            throw new Error('Failed to delete mind map locally');
        }
    },

    // Get a specific mind map by id
    getMapById: (id: string): LocalMindMap | null => {
        try {
            const maps = localStorageService.getAllMaps();
            return maps.find(map => map.id === id) || null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    },

    // Clear all mind maps from local storage for current user
    clearAll: (): void => {
        try {
            const storageKey = getUserStorageKey();
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    },

    // Export all maps to JSON file
    exportToFile: (): void => {
        try {
            const maps = localStorageService.getAllMaps();
            const dataStr = JSON.stringify(maps, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileDefaultName = `mindmaps_backup_${new Date().toISOString().split('T')[0]}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } catch (error) {
            console.error('Error exporting localStorage data:', error);
            throw new Error('Failed to export mind maps');
        }
    },

    // Import maps from JSON file for current user
    importFromFile: (jsonData: string): number => {
        try {
            const importedMaps = JSON.parse(jsonData);
            if (!Array.isArray(importedMaps)) {
                throw new Error('Invalid file format');
            }

            const existingMaps = localStorageService.getAllMaps();
            const allMaps = [...existingMaps, ...importedMaps];
            const storageKey = getUserStorageKey();
            localStorage.setItem(storageKey, JSON.stringify(allMaps));

            return importedMaps.length;
        } catch (error) {
            console.error('Error importing to localStorage:', error);
            throw new Error('Failed to import mind maps');
        }
    },

    // Migrate anonymous maps to current user when they login
    migrateAnonymousMaps: (): number => {
        try {
            const anonymousKey = `${LOCAL_STORAGE_KEY_PREFIX}_anonymous`;
            const anonymousMaps = localStorage.getItem(anonymousKey);

            if (anonymousMaps) {
                const maps = JSON.parse(anonymousMaps);
                if (maps.length > 0) {
                    const existingMaps = localStorageService.getAllMaps();
                    const allMaps = [...existingMaps, ...maps];
                    const userKey = getUserStorageKey();
                    localStorage.setItem(userKey, JSON.stringify(allMaps));
                    // Remove anonymous maps after migration
                    localStorage.removeItem(anonymousKey);
                    console.log(`✅ Migrated ${maps.length} anonymous maps to user account`);
                    return maps.length;
                }
            }
            return 0;
        } catch (error) {
            console.error('Error migrating anonymous maps:', error);
            return 0;
        }
    },

    // REMOVED: migrateFromIdToUsername - was causing data mixing between users

    // Emergency cleanup: Clear all mixed data and start fresh
    clearAllMixedData: (): void => {
        try {
            const allKeys = Object.keys(localStorage).filter(key =>
                key.startsWith(LOCAL_STORAGE_KEY_PREFIX)
            );

            console.log('🧹 EMERGENCY CLEANUP: Removing all mixed localStorage data');
            console.log('Found keys:', allKeys);

            allKeys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const maps = JSON.parse(data);
                        console.log(`  📦 Removing: ${key} (${maps.length} maps)`);
                    } catch (e) {
                        console.log(`  📦 Removing: ${key} (invalid data)`);
                    }
                }
                localStorage.removeItem(key);
            });

            console.log('✅ Cleanup complete. Each user will start with fresh data.');

            // Also clear any user data that might be cached
            localStorage.removeItem('user');

        } catch (error) {
            console.error('Error during emergency cleanup:', error);
        }
    },

    // Clean up user-specific data on logout
    cleanupUserData: (): void => {
        try {
            // Keep current user's maps but don't clear them on logout
            // This allows data persistence between sessions
            console.log('User data cleanup completed (maps preserved)');
        } catch (error) {
            console.error('Error during user data cleanup:', error);
        }
    },

    // Migrate old global maps to user-specific storage (one-time migration)
    migrateOldGlobalMaps: (): number => {
        try {
            const oldGlobalKey = 'mindmaps_local_storage';
            const oldMaps = localStorage.getItem(oldGlobalKey);

            if (oldMaps) {
                const maps = JSON.parse(oldMaps);
                if (maps.length > 0) {
                    const existingMaps = localStorageService.getAllMaps();
                    const allMaps = [...existingMaps, ...maps];
                    const userKey = getUserStorageKey();
                    localStorage.setItem(userKey, JSON.stringify(allMaps));

                    // Remove old global maps after migration
                    localStorage.removeItem(oldGlobalKey);
                    console.log(`✅ Migrated ${maps.length} old global maps to user account`);
                    return maps.length;
                }
            }
            return 0;
        } catch (error) {
            console.error('Error migrating old global maps:', error);
            return 0;
        }
    },

    // Debug function to see what's in localStorage
    debugStorage: (): void => {
        console.group('🔍 LocalStorage Debug Info');
        console.log('Current user:', authService.getCurrentUser());
        console.log('User storage key:', getUserStorageKey());
        console.log('User maps count:', localStorageService.getAllMaps().length);

        // Show all mindmap-related keys
        const allKeys = Object.keys(localStorage).filter(key =>
            key.includes('mindmaps') || key.includes('user')
        );
        console.log('All relevant keys in localStorage:', allKeys);

        allKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (key.includes('mindmaps') && data) {
                try {
                    const maps = JSON.parse(data);
                    console.log(`📦 ${key}: ${maps.length} maps`);
                    maps.forEach((map: any, index: number) => {
                        console.log(`    ${index + 1}. "${map.title}" (id: ${map.id || map._id})`);
                    });
                } catch (e) {
                    console.log(`📦 ${key}: Invalid JSON`);
                }
            } else if (data) {
                console.log(`👤 ${key}: ${data}`);
            }
        });
        console.groupEnd();
    }
};

// Generate a simple local ID
const generateLocalId = (): string => {
    return 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export default localStorageService;