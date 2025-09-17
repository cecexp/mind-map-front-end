import axios from 'axios';
import { MindMap, ApiResponse } from '../types';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        // In production (Vercel), use the current domain with /api prefix
        return `${window.location.origin}/api`;
    } else {
        // In development, use localhost
        return 'http://localhost:5000/api';
    }
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const mindMapApi = {
    // Get all mind maps
    getAllMaps: async (): Promise<MindMap[]> => {
        const response = await api.get<ApiResponse<MindMap[]>>('/maps');
        return response.data.data || [];
    },

    // Get a specific mind map
    getMapById: async (id: string): Promise<MindMap> => {
        const response = await api.get<ApiResponse<MindMap>>(`/maps/${id}`);
        if (!response.data.data) {
            throw new Error('Mind map not found');
        }
        return response.data.data;
    },

    // Create a new mind map
    createMap: async (mindMap: Omit<MindMap, '_id' | 'createdAt' | 'updatedAt'>): Promise<MindMap> => {
        const response = await api.post<ApiResponse<MindMap>>('/maps', mindMap);
        if (!response.data.data) {
            throw new Error('Failed to create mind map');
        }
        return response.data.data;
    },

    // Update a mind map
    updateMap: async (id: string, mindMap: Partial<MindMap>): Promise<MindMap> => {
        const response = await api.put<ApiResponse<MindMap>>(`/maps/${id}`, mindMap);
        if (!response.data.data) {
            throw new Error('Failed to update mind map');
        }
        return response.data.data;
    },

    // Delete a mind map
    deleteMap: async (id: string): Promise<void> => {
        await api.delete(`/maps/${id}`);
    },

    // Add a node to a mind map
    addNode: async (mapId: string, node: { text: string; x: number; y: number; color?: string }): Promise<MindMap> => {
        const response = await api.post<ApiResponse<{ map: MindMap; node: any }>>(`/maps/${mapId}/nodes`, node);
        if (!response.data.data) {
            throw new Error('Failed to add node');
        }
        return response.data.data.map;
    },

    // Update a node in a mind map
    updateNode: async (mapId: string, nodeId: string, updates: { text?: string; x?: number; y?: number; color?: string }): Promise<MindMap> => {
        const response = await api.put<ApiResponse<MindMap>>(`/maps/${mapId}/nodes/${nodeId}`, updates);
        if (!response.data.data) {
            throw new Error('Failed to update node');
        }
        return response.data.data;
    },

    // Delete a node from a mind map
    deleteNode: async (mapId: string, nodeId: string): Promise<MindMap> => {
        const response = await api.delete<ApiResponse<MindMap>>(`/maps/${mapId}/nodes/${nodeId}`);
        if (!response.data.data) {
            throw new Error('Failed to delete node');
        }
        return response.data.data;
    },

    // Add a connection between two nodes
    addConnection: async (mapId: string, from: string, to: string): Promise<MindMap> => {
        const response = await api.post<ApiResponse<MindMap>>(`/maps/${mapId}/connections`, { from, to });
        if (!response.data.data) {
            throw new Error('Failed to add connection');
        }
        return response.data.data;
    },

    // Delete a connection between two nodes
    deleteConnection: async (mapId: string, from: string, to: string): Promise<MindMap> => {
        const response = await api.delete<ApiResponse<MindMap>>(`/maps/${mapId}/connections`, {
            data: { from, to }
        });
        if (!response.data.data) {
            throw new Error('Failed to delete connection');
        }
        return response.data.data;
    },

    // Health check
    healthCheck: async (): Promise<boolean> => {
        try {
            await api.get('/health');
            return true;
        } catch {
            return false;
        }
    },
};

export default api;