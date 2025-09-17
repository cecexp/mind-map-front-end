const mongoose = require('mongoose');

// Node schema
const nodeSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    x: {
        type: Number,
        required: true
    },
    y: {
        type: Number,
        required: true
    },
    parent: {
        type: String,
        default: null
    },
    color: {
        type: String,
        default: '#ffffff'
    }
});

// Connection schema
const connectionSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['parent-child', 'regular'],
        default: 'regular'
    }
});

// Main MindMap schema
const mindMapSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Allow anonymous users for now
    },
    isPublic: {
        type: Boolean,
        default: false // Private by default
    },
    nodes: [nodeSchema],
    connections: [connectionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
mindMapSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const MindMap = mongoose.model('MindMap', mindMapSchema, 'maps');

module.exports = MindMap;