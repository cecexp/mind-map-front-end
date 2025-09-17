const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/mapController');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

// Routes - GET operations can be optional auth, but CREATE/UPDATE/DELETE require authentication
router.route('/')
    .get(optionalAuth, getAllMaps)
    .post(authenticateToken, createMap);  // Require auth for creating maps

router.route('/:id')
    .get(optionalAuth, getMapById)
    .put(authenticateToken, updateMap)    // Require auth for updating maps
    .delete(authenticateToken, deleteMap); // Require auth for deleting maps

// Node management routes - all require authentication since they modify data
router.route('/:id/nodes')
    .post(authenticateToken, addNode);

router.route('/:id/nodes/:nodeId')
    .put(authenticateToken, updateNode)
    .delete(authenticateToken, deleteNode);

// Connection management routes - all require authentication since they modify data
router.route('/:id/connections')
    .post(authenticateToken, addConnection)
    .delete(authenticateToken, deleteConnection);

module.exports = router;