import React, { useState, useEffect, useCallback } from 'react';
import MindMapCanvas from './components/MindMapCanvas/MindMapCanvas';
import MapListSidebar from './components/MapListSidebar/MapListSidebar';
import NodeEditorPanel from './components/NodeEditor/NodeEditorPanel';
import AuthWrapper from './components/Auth/AuthWrapper';
import UserProfile from './components/Auth/UserProfile';
import UserDashboard from './components/Dashboard/UserDashboard';
import ExportControls from './components/ExportControls/ExportControls';
import { UserProvider, useUser } from './contexts/UserContext';
import { MindMap, Node, Connection } from './types';
import { mindMapApi } from './services/api';
import localStorageService, { LocalMindMap } from './services/localStorage';
import { login, register, checkPasswordStrength } from './services/authService';
import { User } from './types';
import {
  createNewNode,
  downloadJSON,
  removeNodeConnections,
  getCanvasBounds,
  createChildNode,
  findChildren,
  migrateConnections,
} from './utils/mindMapUtils';
import { exportMindMap, prepareElementForExport } from './utils/exportUtils';
import {
  AppContainer,
  Header,
  HeaderTitle,
  HeaderActions,
  Button,
  MainContent,
  CanvasContainer,
  ErrorMessage,
  ConnectionLegend,
  LegendItem,
  LegendLine,
} from './components/styled/GlobalStyles';

function AppContent() {
  const { user, logout } = useUser();
  // State management
  const [currentMap, setCurrentMap] = useState<MindMap | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(true); // Always use localStorage
  const [showProfile, setShowProfile] = useState(false);

  // Load all maps on component mount
  useEffect(() => {
    loadMaps();
  }, []);

  // Mark as having unsaved changes when nodes or connections change
  useEffect(() => {
    if (currentMap && (nodes.length > 0 || connections.length > 0)) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, connections, currentMap]);

  const loadMaps = async () => {
    console.log(`📂 LOAD MAPS STARTED - using localStorage`);
    setLoading(true);
    setError(null);
    try {
      console.log(`📦 Loading from localStorage...`);
      const localMaps = localStorageService.getAllMaps();
      // Convert LocalMindMap to MindMap format
      const convertedMaps: MindMap[] = localMaps.map(map => ({
        _id: map.id,
        title: map.title,
        nodes: map.nodes,
        connections: map.connections,
        createdAt: map.createdAt,
        updatedAt: map.updatedAt
      }));
      console.log(`📦 Loaded ${convertedMaps.length} maps from localStorage`);
      setMaps(convertedMaps);
    } catch (err) {
      console.error('❌ Error loading maps from localStorage:', err);
      setError('Failed to load mind maps from local storage.');
    } finally {
      setLoading(false);
    }
  };

  const loadMap = async (map: MindMap) => {
    try {
      setCurrentMap(map);
      setNodes(map.nodes);

      // Migrate connections to include type information
      const migratedConnections = migrateConnections(map.connections, map.nodes);
      setConnections(migratedConnections);

      setSelectedNodeId(null);
      setHasUnsavedChanges(false);
      setSidebarOpen(false);
    } catch (err) {
      setError('Failed to load mind map');
      console.error('Error loading map:', err);
    }
  };

  const createNewMap = async (title: string) => {
    try {
      const localMap = localStorageService.saveMap({
        title,
        nodes: [],
        connections: [],
      });
      const newMap: MindMap = {
        _id: localMap.id,
        title: localMap.title,
        nodes: localMap.nodes,
        connections: localMap.connections,
        createdAt: localMap.createdAt,
        updatedAt: localMap.updatedAt
      };

      setMaps(prev => [newMap, ...prev]);
      setCurrentMap(newMap);
      setNodes([]);
      setConnections([]);
      setSelectedNodeId(null);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError('Failed to create mind map');
      console.error('Error creating map:', err);
      throw err;
    }
  };

  const saveCurrentMap = async () => {
    if (!currentMap) return;

    setLoading(true);
    try {
      const localMap = localStorageService.updateMap(currentMap._id!, {
        title: currentMap.title,
        nodes,
        connections,
      });
      const updatedMap: MindMap = {
        _id: localMap.id,
        title: localMap.title,
        nodes: localMap.nodes,
        connections: localMap.connections,
        createdAt: localMap.createdAt,
        updatedAt: localMap.updatedAt
      };

      setCurrentMap(updatedMap);
      setMaps(prev => prev.map(map =>
        map._id === updatedMap._id ? updatedMap : map
      ));
      setHasUnsavedChanges(false);
    } catch (err) {
      setError('Failed to save mind map');
      console.error('Error saving map:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMap = async (mapId: string) => {
    try {
      // Delete from localStorage
      localStorageService.deleteMap(mapId);
      const localMaps = localStorageService.getAllMaps();
      const convertedMaps: MindMap[] = localMaps.map(map => ({
        _id: map.id,
        title: map.title,
        nodes: map.nodes,
        connections: map.connections,
        createdAt: map.createdAt,
        updatedAt: map.updatedAt
      }));
      setMaps(convertedMaps);

      // If deleted map is currently loaded, clear it
      if (currentMap?._id === mapId || currentMap?.id === mapId) {
        setCurrentMap(null);
        setNodes([]);
        setConnections([]);
        setSelectedNodeId(null);
        setHasUnsavedChanges(false);
      }

      console.log(`✅ Mind map ${mapId} deleted successfully`);
    } catch (err) {
      setError('Failed to delete mind map');
      console.error('Error deleting map:', err);
      throw err;
    }
  };

  const handleCanvasClick = useCallback((x: number, y: number) => {
    const newNode = createNewNode(x - 60, y - 20); // Center the node on click
    setNodes(prev => [...prev, newNode]);
  }, []);

  const handleAddNode = useCallback(() => {
    // Add a node at the center of the visible area or at a default position
    const canvasCenter = { x: 400, y: 300 }; // Default center position
    const newNode = createNewNode(
      canvasCenter.x + Math.random() * 100 - 50, // Add some randomness
      canvasCenter.y + Math.random() * 100 - 50,
      'New Node'
    );
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id); // Select the newly created node
  }, []);

  const handleAddChildNode = useCallback(() => {
    if (!selectedNodeId) return;

    const parentNode = nodes.find(node => node.id === selectedNodeId);
    if (!parentNode) return;

    // Calculate position for child node (below and to the right of parent)
    const existingChildren = findChildren(selectedNodeId, nodes);
    const childOffset = {
      x: 150 + (existingChildren.length * 50), // Spread children horizontally
      y: 80
    };

    const childNode = createChildNode(parentNode, childOffset, 'Child Node');
    setNodes(prev => [...prev, childNode]);

    // Auto-create connection between parent and child
    const newConnection: Connection = {
      from: selectedNodeId,
      to: childNode.id,
      type: 'parent-child'
    };
    setConnections(prev => [...prev, newConnection]);

    setSelectedNodeId(childNode.id); // Select the newly created child node
  }, [selectedNodeId, nodes]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    if (connectionMode && nodeId) {
      if (!connectingFrom) {
        // First node selected for connection
        setConnectingFrom(nodeId);
        setSelectedNodeId(nodeId);
      } else if (connectingFrom !== nodeId) {
        // Second node selected, create connection
        const newConnection: Connection = {
          from: connectingFrom,
          to: nodeId,
          type: 'regular'
        };

        // Check if connection already exists
        const exists = connections.some(conn =>
          (conn.from === connectingFrom && conn.to === nodeId) ||
          (conn.from === nodeId && conn.to === connectingFrom)
        );

        if (!exists) {
          setConnections(prev => [...prev, newConnection]);
        }

        // Exit connection mode
        setConnectionMode(false);
        setConnectingFrom(null);
        setSelectedNodeId(nodeId);
      }
    } else {
      setSelectedNodeId(nodeId);
    }
  }, [connectionMode, connectingFrom, connections]);

  const toggleConnectionMode = useCallback(() => {
    setConnectionMode(prev => !prev);
    setConnectingFrom(null);
    if (connectionMode) {
      setSelectedNodeId(null);
    }
  }, [connectionMode]);

  const handleNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, x, y } : node
    ));
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => removeNodeConnections(nodeId, prev));
    setSelectedNodeId(null);
  }, []);

  const handleExportJSON = () => {
    if (currentMap) {
      downloadJSON(currentMap.title, nodes, connections);
    }
  };

  const handleExportPNG = async () => {
    if (!currentMap) return;

    try {
      const canvasContainer = document.querySelector('[data-export-target="mindmap-canvas"]') as HTMLElement;
      if (!canvasContainer) {
        console.error('Canvas container not found');
        return;
      }

      const cleanup = prepareElementForExport(canvasContainer);

      // Wait a brief moment for any UI changes to take effect
      await new Promise(resolve => setTimeout(resolve, 100));

      await exportMindMap(canvasContainer, 'png', {
        filename: currentMap.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        quality: 2,
        backgroundColor: '#ffffff'
      });

      cleanup();
    } catch (error) {
      console.error('Failed to export PNG:', error);
      alert('Failed to export PNG. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    if (!currentMap) return;

    try {
      const canvasContainer = document.querySelector('[data-export-target="mindmap-canvas"]') as HTMLElement;
      if (!canvasContainer) {
        console.error('Canvas container not found');
        return;
      }

      const cleanup = prepareElementForExport(canvasContainer);

      // Wait a brief moment for any UI changes to take effect
      await new Promise(resolve => setTimeout(resolve, 100));

      await exportMindMap(canvasContainer, 'pdf', {
        filename: currentMap.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        quality: 2,
        backgroundColor: '#ffffff'
      });

      cleanup();
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const selectedNode = selectedNodeId ? nodes.find(node => node.id === selectedNodeId) || null : null;
  const canvasBounds = getCanvasBounds(nodes);

  return (
    <AppContainer>
      <Header data-export-hide>
        <HeaderTitle>🧠 Mind Map Studio</HeaderTitle>
        <HeaderActions>
          {currentMap && (
            <>
              <span style={{ color: 'white', fontSize: '0.875rem' }}>
                {currentMap.title}
                {hasUnsavedChanges && ' *'}
              </span>
              <Button onClick={handleAddNode}>
                + Add Node
              </Button>
              {selectedNodeId && (
                <Button onClick={handleAddChildNode}>
                  + Add Child
                </Button>
              )}
              <Button
                onClick={toggleConnectionMode}
                style={{
                  backgroundColor: connectionMode ? '#ef4444' : '#6366f1',
                  color: 'white'
                }}
              >
                {connectionMode ? 'Cancel Connect' : '🔗 Connect Nodes'}
              </Button>
              <Button onClick={saveCurrentMap} disabled={!hasUnsavedChanges || loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <ExportControls
                onExportJSON={handleExportJSON}
                onExportPNG={handleExportPNG}
                onExportPDF={handleExportPDF}
                disabled={loading}
              />
            </>
          )}
          <Button onClick={() => setSidebarOpen(true)}>
            My Maps
          </Button>
          {user && (
            <>
              <Button onClick={() => setShowProfile(!showProfile)}>
                👤 {user.username}
              </Button>
              <Button
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
                variant="secondary"
              >
                Sign Out
              </Button>
            </>
          )}
        </HeaderActions>
      </Header>

      <MainContent>
        {error && <ErrorMessage data-export-hide>{error}</ErrorMessage>}

        {connectionMode && (
          <div data-export-hide style={{
            background: '#10b981',
            color: 'white',
            padding: '0.75rem 1rem',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {connectingFrom ?
              '🔗 Click on another node to create a connection' :
              '🔗 Connection Mode: Click on a node to start connecting'
            }
          </div>
        )}

        {!currentMap ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'white'
          }}>
            <h2>Welcome to Mind Map Studio!</h2>
            <p>Create a new mind map or open an existing one to get started.</p>
            <Button
              variant="primary"
              onClick={() => setSidebarOpen(true)}
              style={{ marginTop: '1rem' }}
            >
              Get Started
            </Button>
          </div>
        ) : (
          <>
            {showProfile && user ? (
              <UserProfile
                user={user}
                onLogout={async () => {
                  await logout();
                  window.location.reload();
                }}
              />
            ) : (
              <>
                {!currentMap && user && (
                  <UserDashboard
                    mapsCount={maps.filter(map =>
                      map.user === user.id || // Mapas del usuario
                      (!map.user && !map.isPublic) // Mapas sin dueño (legacy) - estos se podrían asignar al usuario actual
                    ).length}
                    lastLoginFormatted={user.lastActivity ? new Date(user.lastActivity).toLocaleDateString('es-ES') : undefined}
                  />
                )}
                <CanvasContainer data-export-target="mindmap-canvas">
                  <MindMapCanvas
                    nodes={nodes}
                    connections={connections}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={handleNodeSelect}
                    onNodeDrag={handleNodeDrag}
                    onCanvasClick={handleCanvasClick}
                    width={canvasBounds.width}
                    height={canvasBounds.height}
                    connectionMode={connectionMode}
                    connectingFrom={connectingFrom}
                  />
                </CanvasContainer>

                {/* Connection Legend */}
                <ConnectionLegend data-export-hide>
                  <LegendItem>
                    <LegendLine type="parent-child" />
                    <span>Parent-Child Connection</span>
                  </LegendItem>
                  <LegendItem>
                    <LegendLine type="regular" />
                    <span>Regular Connection</span>
                  </LegendItem>
                </ConnectionLegend>

                <div data-export-hide style={{ marginTop: '1rem' }}>
                  <NodeEditorPanel
                    selectedNode={selectedNode}
                    onNodeUpdate={handleNodeUpdate}
                    onNodeDelete={handleNodeDelete}
                  />
                </div>
              </>
            )}
          </>
        )}
      </MainContent>

      <MapListSidebar
        data-export-hide
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        maps={maps}
        onMapSelect={loadMap}
        onMapCreate={createNewMap}
        onMapDelete={deleteMap}
        loading={loading}
        error={error}
      />
    </AppContainer>
  );
}

function App() {
  return (
    <UserProvider>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </UserProvider>
  );
}

export default App;
