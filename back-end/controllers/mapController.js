const MindMap = require('../models/MindMap');

// In-memory storage as fallback when database is not available
let inMemoryMaps = [];
let nextId = 1;

// Helper function to check if MongoDB is connected
const isMongoConnected = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
};

// Helper function to create a mind map object
const createMapObject = (data, userId = null) => {
    const now = new Date().toISOString();
    return {
        _id: data._id || nextId++,
        title: data.title,
        user: userId,
        isPublic: data.isPublic || false,
        nodes: data.nodes || [],
        connections: data.connections || [],
        createdAt: data.createdAt || now,
        updatedAt: now
    };
};

// @desc    Get all mind maps
// @route   GET /api/maps
// @access  Public
const getAllMaps = async (req, res) => {
    try {
        let maps;
        const userId = req.user?._id;

        if (isMongoConnected()) {
            // If user is authenticated, get their maps and public maps
            // If not authenticated, only get public maps
            const query = userId ?
                { $or: [{ user: userId }, { isPublic: true }, { user: null }] } :
                { $or: [{ isPublic: true }, { user: null }] };

            maps = await MindMap.find(query).sort({ updatedAt: -1 });
        } else {
            // Use in-memory storage - filter by user if authenticated
            maps = inMemoryMaps.filter(map => {
                if (userId) {
                    return map.user === userId.toString() || map.isPublic || !map.user;
                }
                return map.isPublic || !map.user;
            }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        res.status(200).json({
            success: true,
            count: maps.length,
            data: maps
        });
    } catch (error) {
        console.error('Error fetching maps:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch mind maps'
        });
    }
};

// @desc    Get single mind map by ID
// @route   GET /api/maps/:id
// @access  Public
const getMapById = async (req, res) => {
    try {
        let map;

        if (isMongoConnected()) {
            map = await MindMap.findById(req.params.id);
        } else {
            // Use in-memory storage
            map = inMemoryMaps.find(m => m._id.toString() === req.params.id);
        }

        if (!map) {
            return res.status(404).json({
                success: false,
                message: 'Mind map not found'
            });
        }

        res.status(200).json({
            success: true,
            data: map
        });
    } catch (error) {
        console.error('Error fetching map:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to fetch mind map'
        });
    }
};

// @desc    Create new mind map
// @route   POST /api/maps
// @access  Public
const createMap = async (req, res) => {
    try {
        const { title, nodes, connections, isPublic } = req.body;
        const userId = req.user?._id;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        let savedMap;

        if (isMongoConnected()) {
            const newMap = new MindMap({
                title: title.trim(),
                user: userId || null,
                isPublic: isPublic || false,
                nodes: nodes || [],
                connections: connections || []
            });

            savedMap = await newMap.save();
        } else {
            // Use in-memory storage
            savedMap = createMapObject({
                title: title.trim(),
                isPublic: isPublic || false,
                nodes: nodes || [],
                connections: connections || []
            }, userId?.toString());
            inMemoryMaps.push(savedMap);
        }

        res.status(201).json({
            success: true,
            message: 'Mind map created successfully',
            data: savedMap
        });
    } catch (error) {
        console.error('Error creating map:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to create mind map'
        });
    }
};

// @desc    Update mind map
// @route   PUT /api/maps/:id
// @access  Private
const updateMap = async (req, res) => {
    try {
        const { title, nodes, connections } = req.body;
        const userId = req.user?._id;
        let map;
        let updatedMap;

        if (isMongoConnected()) {
            map = await MindMap.findById(req.params.id);

            if (!map) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            // Check ownership - only the owner or maps with no user (anonymous) can be updated
            if (map.user && map.user.toString() !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only update your own maps'
                });
            }

            // Update fields if provided
            if (title !== undefined) map.title = title.trim();
            if (nodes !== undefined) map.nodes = nodes;
            if (connections !== undefined) map.connections = connections;

            updatedMap = await map.save();
        } else {
            // Use in-memory storage
            const mapIndex = inMemoryMaps.findIndex(m => m._id.toString() === req.params.id);

            if (mapIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            const map = inMemoryMaps[mapIndex];

            // Check ownership - only the owner or maps with no user (anonymous) can be updated
            if (map.user && map.user !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only update your own maps'
                });
            }

            // Update fields if provided
            if (title !== undefined) inMemoryMaps[mapIndex].title = title.trim();
            if (nodes !== undefined) inMemoryMaps[mapIndex].nodes = nodes;
            if (connections !== undefined) inMemoryMaps[mapIndex].connections = connections;
            inMemoryMaps[mapIndex].updatedAt = new Date().toISOString();

            updatedMap = inMemoryMaps[mapIndex];
        }

        res.status(200).json({
            success: true,
            message: 'Mind map updated successfully',
            data: updatedMap
        });
    } catch (error) {
        console.error('Error updating map:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to update mind map'
        });
    }
};

// @desc    Delete mind map
// @route   DELETE /api/maps/:id
// @access  Private
const deleteMap = async (req, res) => {
    try {
        const userId = req.user?._id;
        let map;

        if (isMongoConnected()) {
            map = await MindMap.findById(req.params.id);

            if (!map) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            // Check ownership - only the owner or maps with no user (anonymous) can be deleted
            if (map.user && map.user.toString() !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only delete your own maps'
                });
            }

            await MindMap.findByIdAndDelete(req.params.id);
        } else {
            // Use in-memory storage
            const mapIndex = inMemoryMaps.findIndex(m => m._id.toString() === req.params.id);

            if (mapIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            const map = inMemoryMaps[mapIndex];

            // Check ownership - only the owner or maps with no user (anonymous) can be deleted
            if (map.user && map.user !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only delete your own maps'
                });
            }

            inMemoryMaps.splice(mapIndex, 1);
        }

        res.status(200).json({
            success: true,
            message: 'Mind map deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting map:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to delete mind map'
        });
    }
};

// @desc    Add a node to a mind map
// @route   POST /api/maps/:id/nodes
// @access  Private
const addNode = async (req, res) => {
    try {
        const { text, x, y, color } = req.body;
        const mapId = req.params.id;
        const userId = req.user?._id;

        // Validation
        if (!text || text.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Node text is required'
            });
        }

        if (x === undefined || y === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Node position (x, y) is required'
            });
        }

        // Create new node object
        const newNode = {
            id: Math.random().toString(36).substr(2, 9),
            text: text.trim(),
            x: Number(x),
            y: Number(y),
            parent: null,
            color: color || '#ffffff'
        };

        let updatedMap;

        if (isMongoConnected()) {
            const map = await MindMap.findById(mapId);

            if (!map) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user.toString() !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            map.nodes.push(newNode);
            updatedMap = await map.save();
        } else {
            // Use in-memory storage
            const mapIndex = inMemoryMaps.findIndex(m => m._id.toString() === mapId);

            if (mapIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            const map = inMemoryMaps[mapIndex];

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            inMemoryMaps[mapIndex].nodes.push(newNode);
            inMemoryMaps[mapIndex].updatedAt = new Date().toISOString();
            updatedMap = inMemoryMaps[mapIndex];
        }

        res.status(201).json({
            success: true,
            message: 'Node added successfully',
            data: {
                map: updatedMap,
                node: newNode
            }
        });
    } catch (error) {
        console.error('Error adding node:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to add node'
        });
    }
};

// @desc    Update a node in a mind map
// @route   PUT /api/maps/:id/nodes/:nodeId
// @access  Private
const updateNode = async (req, res) => {
    try {
        const { text, x, y, color } = req.body;
        const { id: mapId, nodeId } = req.params;
        const userId = req.user?._id;

        let updatedMap;
        let nodeFound = false;

        if (isMongoConnected()) {
            const map = await MindMap.findById(mapId);

            if (!map) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user.toString() !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            const nodeIndex = map.nodes.findIndex(node => node.id === nodeId);
            if (nodeIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Node not found'
                });
            }

            // Update node properties
            if (text !== undefined) map.nodes[nodeIndex].text = text.trim();
            if (x !== undefined) map.nodes[nodeIndex].x = Number(x);
            if (y !== undefined) map.nodes[nodeIndex].y = Number(y);
            if (color !== undefined) map.nodes[nodeIndex].color = color;

            updatedMap = await map.save();
            nodeFound = true;
        } else {
            // Use in-memory storage
            const mapIndex = inMemoryMaps.findIndex(m => m._id.toString() === mapId);

            if (mapIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            const map = inMemoryMaps[mapIndex];

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            const nodeIndex = inMemoryMaps[mapIndex].nodes.findIndex(node => node.id === nodeId);
            if (nodeIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Node not found'
                });
            }

            // Update node properties
            if (text !== undefined) inMemoryMaps[mapIndex].nodes[nodeIndex].text = text.trim();
            if (x !== undefined) inMemoryMaps[mapIndex].nodes[nodeIndex].x = Number(x);
            if (y !== undefined) inMemoryMaps[mapIndex].nodes[nodeIndex].y = Number(y);
            if (color !== undefined) inMemoryMaps[mapIndex].nodes[nodeIndex].color = color;

            inMemoryMaps[mapIndex].updatedAt = new Date().toISOString();
            updatedMap = inMemoryMaps[mapIndex];
            nodeFound = true;
        }

        res.status(200).json({
            success: true,
            message: 'Node updated successfully',
            data: updatedMap
        });
    } catch (error) {
        console.error('Error updating node:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to update node'
        });
    }
};

// @desc    Delete a node from a mind map
// @route   DELETE /api/maps/:id/nodes/:nodeId
// @access  Private
const deleteNode = async (req, res) => {
    try {
        const { id: mapId, nodeId } = req.params;
        const userId = req.user?._id;

        let updatedMap;

        if (isMongoConnected()) {
            const map = await MindMap.findById(mapId);

            if (!map) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user.toString() !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            const nodeIndex = map.nodes.findIndex(node => node.id === nodeId);
            if (nodeIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Node not found'
                });
            }

            // Remove node
            map.nodes.splice(nodeIndex, 1);

            // Remove connections related to this node
            map.connections = map.connections.filter(conn =>
                conn.from !== nodeId && conn.to !== nodeId
            );

            updatedMap = await map.save();
        } else {
            // Use in-memory storage
            const mapIndex = inMemoryMaps.findIndex(m => m._id.toString() === mapId);

            if (mapIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            const map = inMemoryMaps[mapIndex];

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            const nodeIndex = inMemoryMaps[mapIndex].nodes.findIndex(node => node.id === nodeId);
            if (nodeIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Node not found'
                });
            }

            // Remove node
            inMemoryMaps[mapIndex].nodes.splice(nodeIndex, 1);

            // Remove connections related to this node
            inMemoryMaps[mapIndex].connections = inMemoryMaps[mapIndex].connections.filter(conn =>
                conn.from !== nodeId && conn.to !== nodeId
            );

            inMemoryMaps[mapIndex].updatedAt = new Date().toISOString();
            updatedMap = inMemoryMaps[mapIndex];
        }

        res.status(200).json({
            success: true,
            message: 'Node deleted successfully',
            data: updatedMap
        });
    } catch (error) {
        console.error('Error deleting node:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to delete node'
        });
    }
};

// @desc    Add a connection between two nodes
// @route   POST /api/maps/:id/connections
// @access  Private
const addConnection = async (req, res) => {
    try {
        const { from, to } = req.body;
        const mapId = req.params.id;
        const userId = req.user?._id;

        // Validation
        if (!from || !to) {
            return res.status(400).json({
                success: false,
                message: 'Both from and to node IDs are required'
            });
        }

        if (from === to) {
            return res.status(400).json({
                success: false,
                message: 'Cannot connect a node to itself'
            });
        }

        let updatedMap;

        if (isMongoConnected()) {
            const map = await MindMap.findById(mapId);

            if (!map) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user.toString() !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            // Check if nodes exist
            const fromNode = map.nodes.find(node => node.id === from);
            const toNode = map.nodes.find(node => node.id === to);

            if (!fromNode || !toNode) {
                return res.status(404).json({
                    success: false,
                    message: 'One or both nodes not found'
                });
            }

            // Check if connection already exists
            const existingConnection = map.connections.find(conn =>
                (conn.from === from && conn.to === to) ||
                (conn.from === to && conn.to === from)
            );

            if (existingConnection) {
                return res.status(400).json({
                    success: false,
                    message: 'Connection already exists between these nodes'
                });
            }

            // Add connection
            const newConnection = { from, to };
            map.connections.push(newConnection);
            updatedMap = await map.save();
        } else {
            // Use in-memory storage
            const mapIndex = inMemoryMaps.findIndex(m => m._id.toString() === mapId);

            if (mapIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            // Check if nodes exist
            const fromNode = inMemoryMaps[mapIndex].nodes.find(node => node.id === from);
            const toNode = inMemoryMaps[mapIndex].nodes.find(node => node.id === to);

            if (!fromNode || !toNode) {
                return res.status(404).json({
                    success: false,
                    message: 'One or both nodes not found'
                });
            }

            // Check if connection already exists
            const existingConnection = inMemoryMaps[mapIndex].connections.find(conn =>
                (conn.from === from && conn.to === to) ||
                (conn.from === to && conn.to === from)
            );

            if (existingConnection) {
                return res.status(400).json({
                    success: false,
                    message: 'Connection already exists between these nodes'
                });
            }

            // Add connection
            const newConnection = { from, to };
            inMemoryMaps[mapIndex].connections.push(newConnection);
            inMemoryMaps[mapIndex].updatedAt = new Date().toISOString();
            updatedMap = inMemoryMaps[mapIndex];
        }

        res.status(201).json({
            success: true,
            message: 'Connection added successfully',
            data: updatedMap
        });
    } catch (error) {
        console.error('Error adding connection:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to add connection'
        });
    }
};

// @desc    Delete a connection between two nodes
// @route   DELETE /api/maps/:id/connections
// @access  Private
const deleteConnection = async (req, res) => {
    try {
        const { from, to } = req.body;
        const mapId = req.params.id;
        const userId = req.user?._id;

        // Validation
        if (!from || !to) {
            return res.status(400).json({
                success: false,
                message: 'Both from and to node IDs are required'
            });
        }

        let updatedMap;

        if (isMongoConnected()) {
            const map = await MindMap.findById(mapId);

            if (!map) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user.toString() !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            // Find and remove connection
            const connectionIndex = map.connections.findIndex(conn =>
                (conn.from === from && conn.to === to) ||
                (conn.from === to && conn.to === from)
            );

            if (connectionIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Connection not found'
                });
            }

            map.connections.splice(connectionIndex, 1);
            updatedMap = await map.save();
        } else {
            // Use in-memory storage
            const mapIndex = inMemoryMaps.findIndex(m => m._id.toString() === mapId);

            if (mapIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Mind map not found'
                });
            }

            const map = inMemoryMaps[mapIndex];

            // Check ownership - only the owner or maps with no user (anonymous) can be modified
            if (map.user && map.user !== userId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only modify your own maps'
                });
            }

            // Find and remove connection
            const connectionIndex = inMemoryMaps[mapIndex].connections.findIndex(conn =>
                (conn.from === from && conn.to === to) ||
                (conn.from === to && conn.to === from)
            );

            if (connectionIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Connection not found'
                });
            }

            inMemoryMaps[mapIndex].connections.splice(connectionIndex, 1);
            inMemoryMaps[mapIndex].updatedAt = new Date().toISOString();
            updatedMap = inMemoryMaps[mapIndex];
        }

        res.status(200).json({
            success: true,
            message: 'Connection deleted successfully',
            data: updatedMap
        });
    } catch (error) {
        console.error('Error deleting connection:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to delete connection'
        });
    }
};

module.exports = {
    getAllMaps,
    getMapById,
    createMap,
    updateMap,
    deleteMap,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection
};