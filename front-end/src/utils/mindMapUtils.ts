import { Node, Connection } from '../types';

export const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

export const createNewNode = (x: number, y: number, text: string = 'New Node'): Node => {
    return {
        id: generateId(),
        text,
        x,
        y,
        parent: null,
        color: '#ffffff',
    };
};

export const exportToJSON = (title: string, nodes: Node[], connections: Connection[]): string => {
    const mindMapData = {
        title,
        nodes,
        connections,
        exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(mindMapData, null, 2);
};

export const downloadJSON = (title: string, nodes: Node[], connections: Connection[]): void => {
    const jsonData = exportToJSON(title, nodes, connections);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_mindmap.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

export const findNodeConnections = (nodeId: string, connections: Connection[]): Connection[] => {
    return connections.filter(conn => conn.from === nodeId || conn.to === nodeId);
};

export const removeNodeConnections = (nodeId: string, connections: Connection[]): Connection[] => {
    return connections.filter(conn => conn.from !== nodeId && conn.to !== nodeId);
};

export const createChildNode = (parentNode: Node, offset: { x: number; y: number }, text: string = 'Child Node'): Node => {
    return {
        id: generateId(),
        text,
        x: parentNode.x + offset.x,
        y: parentNode.y + offset.y,
        parent: parentNode.id,
        color: '#ffffff',
    };
};

export const findChildren = (parentId: string, nodes: Node[]): Node[] => {
    return nodes.filter(node => node.parent === parentId);
};

export const findParent = (childId: string, nodes: Node[]): Node | null => {
    const child = nodes.find(node => node.id === childId);
    if (!child || !child.parent) return null;
    return nodes.find(node => node.id === child.parent) || null;
};

export const updateNodePosition = (nodeId: string, newPosition: { x: number; y: number }, nodes: Node[]): Node[] => {
    return nodes.map(node => {
        if (node.id === nodeId) {
            return { ...node, x: newPosition.x, y: newPosition.y };
        }
        return node;
    });
};

export const organizeHierarchy = (nodes: Node[]): { roots: Node[]; children: { [parentId: string]: Node[] } } => {
    const roots: Node[] = [];
    const children: { [parentId: string]: Node[] } = {};

    nodes.forEach(node => {
        if (!node.parent) {
            roots.push(node);
        } else {
            if (!children[node.parent]) {
                children[node.parent] = [];
            }
            children[node.parent].push(node);
        }
    });

    return { roots, children };
};

export const findChildNodes = (parentId: string, nodes: Node[]): Node[] => {
    return nodes.filter(node => node.parent === parentId);
};

export const createConnection = (fromNodeId: string, toNodeId: string): Connection => {
    return {
        from: fromNodeId,
        to: toNodeId,
    };
};

export const isValidConnection = (
    fromNodeId: string,
    toNodeId: string,
    connections: Connection[]
): boolean => {
    // Check if connection already exists
    const exists = connections.some(
        conn =>
            (conn.from === fromNodeId && conn.to === toNodeId) ||
            (conn.from === toNodeId && conn.to === fromNodeId)
    );

    // Can't connect to self
    if (fromNodeId === toNodeId) return false;

    return !exists;
};

export const getCanvasBounds = (nodes: Node[]): { width: number; height: number } => {
    if (nodes.length === 0) return { width: 800, height: 600 };

    const maxX = Math.max(...nodes.map(node => node.x + 120)); // 120 is node width
    const maxY = Math.max(...nodes.map(node => node.y + 40));  // 40 is node height

    return {
        width: Math.max(800, maxX + 100),
        height: Math.max(600, maxY + 100),
    };
};

// Utility function to determine connection type based on node relationships
export const determineConnectionType = (
    connection: Connection,
    nodes: Node[]
): 'parent-child' | 'regular' => {
    const toNode = nodes.find(node => node.id === connection.to);
    const fromNode = nodes.find(node => node.id === connection.from);

    // Check if this is a parent-child relationship
    if (toNode && toNode.parent === connection.from) {
        return 'parent-child';
    }

    if (fromNode && fromNode.parent === connection.to) {
        return 'parent-child';
    }

    return 'regular';
};

// Migrate existing connections to include type information
export const migrateConnections = (connections: Connection[], nodes: Node[]): Connection[] => {
    return connections.map(connection => ({
        ...connection,
        type: connection.type || determineConnectionType(connection, nodes)
    }));
};