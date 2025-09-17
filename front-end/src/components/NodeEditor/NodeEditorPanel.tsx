import React, { useState, useEffect } from 'react';
import { Node } from '../../types';
import {
    NodeEditor,
    NodeEditorTitle,
    Input,
    Button,
    ColorPicker,
    ColorOption,
} from '../styled/GlobalStyles';

interface NodeEditorPanelProps {
    selectedNode: Node | null;
    onNodeUpdate: (nodeId: string, updates: Partial<Node>) => void;
    onNodeDelete: (nodeId: string) => void;
}

const predefinedColors = [
    '#ffffff', '#fef3c7', '#fed7e2', '#ddd6fe',
    '#d1fae5', '#bfdbfe', '#fde68a', '#f9a8d4',
    '#a78bfa', '#6ee7b7', '#93c5fd', '#fbbf24',
];

const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({
    selectedNode,
    onNodeUpdate,
    onNodeDelete,
}) => {
    const [nodeText, setNodeText] = useState('');
    const [nodeColor, setNodeColor] = useState('#ffffff');

    useEffect(() => {
        if (selectedNode) {
            setNodeText(selectedNode.text);
            setNodeColor(selectedNode.color || '#ffffff');
        }
    }, [selectedNode]);

    const handleTextUpdate = () => {
        if (selectedNode && nodeText.trim()) {
            onNodeUpdate(selectedNode.id, { text: nodeText.trim() });
        }
    };

    const handleColorUpdate = (color: string) => {
        setNodeColor(color);
        if (selectedNode) {
            onNodeUpdate(selectedNode.id, { color });
        }
    };

    const handleDeleteNode = () => {
        if (selectedNode && window.confirm('Are you sure you want to delete this node?')) {
            onNodeDelete(selectedNode.id);
        }
    };

    if (!selectedNode) {
        return (
            <NodeEditor>
                <NodeEditorTitle>Node Editor</NodeEditorTitle>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                    Select a node to edit its properties
                </p>
            </NodeEditor>
        );
    }

    return (
        <NodeEditor>
            <NodeEditorTitle>Edit Node</NodeEditorTitle>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                }}>
                    Text:
                </label>
                <Input
                    type="text"
                    value={nodeText}
                    onChange={(e) => setNodeText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextUpdate()}
                    placeholder="Enter node text..."
                />
                <Button
                    variant="primary"
                    onClick={handleTextUpdate}
                    disabled={!nodeText.trim()}
                    style={{ width: '100%', marginBottom: '1rem' }}
                >
                    Update Text
                </Button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                }}>
                    Color:
                </label>
                <ColorPicker>
                    {predefinedColors.map((color) => (
                        <ColorOption
                            key={color}
                            color={color}
                            isSelected={nodeColor === color}
                            onClick={() => handleColorUpdate(color)}
                            title={`Select ${color}`}
                        />
                    ))}
                </ColorPicker>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151'
                }}>
                    Position:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Input
                        type="number"
                        value={Math.round(selectedNode.x)}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { x: Number(e.target.value) })}
                        placeholder="X"
                        style={{ margin: 0 }}
                    />
                    <Input
                        type="number"
                        value={Math.round(selectedNode.y)}
                        onChange={(e) => onNodeUpdate(selectedNode.id, { y: Number(e.target.value) })}
                        placeholder="Y"
                        style={{ margin: 0 }}
                    />
                </div>
            </div>

            <Button
                variant="danger"
                onClick={handleDeleteNode}
                style={{ width: '100%' }}
            >
                Delete Node
            </Button>
        </NodeEditor>
    );
};

export default NodeEditorPanel;