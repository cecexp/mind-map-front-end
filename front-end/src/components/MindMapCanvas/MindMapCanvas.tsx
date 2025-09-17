import React from 'react';
import { Stage, Layer, Rect, Text, Line, Circle } from 'react-konva';
import { Node, Connection } from '../../types';

interface MindMapCanvasProps {
    nodes: Node[];
    connections: Connection[];
    selectedNodeId: string | null;
    onNodeSelect: (nodeId: string | null) => void;
    onNodeDrag: (nodeId: string, x: number, y: number) => void;
    onCanvasClick: (x: number, y: number) => void;
    width: number;
    height: number;
    connectionMode?: boolean;
    connectingFrom?: string | null;
}

const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
    nodes,
    connections,
    selectedNodeId,
    onNodeSelect,
    onNodeDrag,
    onCanvasClick,
    width,
    height,
    connectionMode = false,
    connectingFrom = null,
}) => {
    const getNodeById = (id: string) => nodes.find(node => node.id === id);
    const stageRef = React.useRef<any>(null);

    const handleStageClick = (e: any) => {
        // Check if clicked on empty space
        if (e.target === e.target.getStage()) {
            const pos = e.target.getStage().getPointerPosition();
            onCanvasClick(pos.x, pos.y);
            onNodeSelect(null);
        }
    };

    const renderConnections = () => {
        return connections.map((connection, index) => {
            const fromNode = getNodeById(connection.from);
            const toNode = getNodeById(connection.to);

            if (!fromNode || !toNode) return null;

            // Determine if this is a parent-child connection
            const isParentChild = connection.type === 'parent-child' ||
                toNode.parent === fromNode.id;

            // Different styles for different connection types
            const lineStyle = isParentChild ? {
                stroke: "#10b981", // Green for parent-child
                strokeWidth: 3,
                dash: undefined, // Solid line
                lineCap: 'round' as const,
                lineJoin: 'round' as const
            } : {
                stroke: "#6b7280", // Gray for regular connections
                strokeWidth: 2,
                dash: [5, 5], // Dashed line
                lineCap: 'round' as const,
                lineJoin: 'round' as const
            };

            return (
                <Line
                    key={`connection-${index}`}
                    points={[
                        fromNode.x + 60, fromNode.y + 20, // Center of from node
                        toNode.x + 60, toNode.y + 20,     // Center of to node
                    ]}
                    stroke={lineStyle.stroke}
                    strokeWidth={lineStyle.strokeWidth}
                    dash={lineStyle.dash}
                    lineCap={lineStyle.lineCap}
                    lineJoin={lineStyle.lineJoin}
                />
            );
        });
    };

    const renderNodes = () => {
        return nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isConnectingFrom = connectingFrom === node.id;
            const nodeColor = node.color || '#ffffff';

            // Determine stroke color based on state
            let strokeColor = '#d1d5db';
            let strokeWidth = 1;

            if (isSelected || isConnectingFrom) {
                strokeColor = '#4f46e5';
                strokeWidth = 3;
            } else if (connectionMode) {
                strokeColor = '#10b981'; // Green for connection mode
                strokeWidth = 2;
            }

            return (
                <React.Fragment key={node.id}>
                    {/* Node background */}
                    <Rect
                        x={node.x}
                        y={node.y}
                        width={120}
                        height={40}
                        fill={nodeColor}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        cornerRadius={6}
                        shadowColor="rgba(0, 0, 0, 0.1)"
                        shadowOffsetY={2}
                        shadowBlur={4}
                        draggable={!connectionMode} // Disable dragging in connection mode
                        onClick={() => onNodeSelect(node.id)}
                        onDragEnd={(e: any) => {
                            onNodeDrag(node.id, e.target.x(), e.target.y());
                        }}
                        onMouseEnter={(e: any) => {
                            const container = e.target.getStage()?.container();
                            if (container) {
                                container.style.cursor = connectionMode ? 'pointer' : 'move';
                            }
                        }}
                        onMouseLeave={(e: any) => {
                            const container = e.target.getStage()?.container();
                            if (container) {
                                container.style.cursor = 'default';
                            }
                        }}
                    />

                    {/* Node text */}
                    <Text
                        x={node.x + 10}
                        y={node.y + 12}
                        text={node.text}
                        fontSize={12}
                        fontFamily="Arial"
                        fill="#1f2937"
                        width={100}
                        height={16}
                        ellipsis={true}
                        listening={false} // Make text non-interactive
                    />

                    {/* Selection indicator */}
                    {isSelected && (
                        <Circle
                            x={node.x + 115}
                            y={node.y + 5}
                            radius={3}
                            fill="#4f46e5"
                        />
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <Stage width={width} height={height} ref={stageRef} {...({} as any)}>
            <Layer onTap={handleStageClick} onClick={handleStageClick}>
                {renderConnections()}
                {renderNodes()}
            </Layer>
        </Stage>
    );
};

export default MindMapCanvas;