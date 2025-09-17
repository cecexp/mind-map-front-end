export interface Node {
    id: string;
    text: string;
    x: number;
    y: number;
    parent: string | null;
    color?: string;
}

export interface Connection {
    from: string;
    to: string;
    type?: 'parent-child' | 'regular'; // Optional for backward compatibility
}

export interface MindMap {
    _id?: string;   // For backend maps
    id?: string;    // For local maps
    title: string;
    user?: string | null; // User ID who owns the map
    isPublic?: boolean;
    nodes: Node[];
    connections: Connection[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    count?: number;
}