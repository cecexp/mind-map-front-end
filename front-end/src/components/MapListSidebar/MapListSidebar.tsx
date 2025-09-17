import React, { useState } from 'react';
import styled from 'styled-components';
import { MindMap } from '../../types';
import { useUser } from '../../contexts/UserContext';
import {
    Sidebar,
    SidebarHeader,
    SidebarTitle,
    CloseButton,
    MapList,
    MapCard,
    MapTitle,
    MapMeta,
    Input,
    Button,
    LoadingSpinner,
    ErrorMessage,
    SuccessMessage,
} from '../styled/GlobalStyles';

const CategorySection = styled.div`
  margin-bottom: 1.5rem;
`;

const CategoryTitle = styled.h3`
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem 0;
  padding: 0 0.5rem;
`;

const OwnerBadge = styled.span<{ isOwner: boolean; isPublic?: boolean }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
  margin-left: 8px;
  ${props => {
        if (props.isOwner) {
            return 'background: #e0f2fe; color: #01579b;';
        } else if (props.isPublic) {
            return 'background: #f3e8ff; color: #6b21a8;';
        } else {
            return 'background: #f0f4f8; color: #475569;';
        }
    }}
`;

const EmptyCategory = styled.div`
  text-align: center;
  color: #9ca3af;
  padding: 1rem;
  font-size: 0.875rem;
  font-style: italic;
`;

const DeleteButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const MapActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MapCardStyled = styled(MapCard)`
  position: relative;
  
  ${DeleteButton} {
    opacity: 0;
    transform: translateX(8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  
  &:hover {
    ${DeleteButton} {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

interface MapListSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    maps: MindMap[];
    onMapSelect: (map: MindMap) => void;
    onMapCreate: (title: string) => void;
    onMapDelete: (mapId: string) => void;
    loading: boolean;
    error: string | null;
}

const MapListSidebar: React.FC<MapListSidebarProps> = ({
    isOpen,
    onClose,
    maps,
    onMapSelect,
    onMapCreate,
    onMapDelete,
    loading,
    error,
}) => {
    const { user } = useUser();
    const [newMapTitle, setNewMapTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Categorize maps
    const myMaps = maps.filter(map => map.user === user?.id);
    const publicMaps = maps.filter(map => map.isPublic && map.user !== user?.id);
    const sharedMaps = maps.filter(map => !map.user && !map.isPublic); // Legacy maps without owner

    const handleCreateMap = async () => {
        if (!newMapTitle.trim()) return;

        setCreating(true);
        try {
            await onMapCreate(newMapTitle.trim());
            setNewMapTitle('');
            setSuccessMessage('Mind map created successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error creating map:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteMap = async (mapId: string, mapTitle: string, event: React.MouseEvent) => {
        event.stopPropagation();

        const confirmMessage = `¿Estás seguro de que quieres eliminar el mapa mental "${mapTitle}"?\n\nEsta acción no se puede deshacer.`;

        if (window.confirm(confirmMessage)) {
            try {
                await onMapDelete(mapId);
                setSuccessMessage(`Mapa mental "${mapTitle}" eliminado exitosamente!`);
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error) {
                console.error('Error deleting map:', error);
                setSuccessMessage(`Error al eliminar el mapa mental "${mapTitle}"`);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        }
    };

    const renderMapCategory = (categoryMaps: MindMap[], categoryTitle: string) => {
        if (categoryMaps.length === 0) {
            return (
                <CategorySection>
                    <CategoryTitle>{categoryTitle}</CategoryTitle>
                    <EmptyCategory>No hay mapas en esta categoría</EmptyCategory>
                </CategorySection>
            );
        }

        return (
            <CategorySection>
                <CategoryTitle>{categoryTitle} ({categoryMaps.length})</CategoryTitle>
                {categoryMaps.map((map) => (
                    <MapCardStyled key={map._id || map.id} onClick={() => onMapSelect(map)}>
                        <MapTitle>
                            {map.title}
                            <OwnerBadge
                                isOwner={map.user === user?.id}
                                isPublic={map.isPublic}
                            >
                                {map.user === user?.id ? 'Tuyo' :
                                    map.isPublic ? 'Público' : 'Compartido'}
                            </OwnerBadge>
                        </MapTitle>
                        <MapMeta>
                            <span>{map.nodes.length} nodos</span>
                            <MapActions>
                                <span style={{ marginRight: '1rem' }}>
                                    {map.updatedAt ? formatDate(map.updatedAt) : 'Desconocido'}
                                </span>
                                {map.user === user?.id && (
                                    <DeleteButton
                                        onClick={(e) => handleDeleteMap(map._id || map.id!, map.title, e)}
                                        title={`Eliminar "${map.title}"`}
                                    >
                                        <span>🗑️</span>
                                        <span>Eliminar</span>
                                    </DeleteButton>
                                )}
                            </MapActions>
                        </MapMeta>
                    </MapCardStyled>
                ))}
            </CategorySection>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Sidebar isOpen={isOpen}>
            <SidebarHeader>
                <SidebarTitle>Mind Maps</SidebarTitle>
                <CloseButton onClick={onClose}>&times;</CloseButton>
            </SidebarHeader>

            {/* Create new map section */}
            <div style={{ marginBottom: '2rem' }}>
                <Input
                    type="text"
                    placeholder="Enter mind map title..."
                    value={newMapTitle}
                    onChange={(e) => setNewMapTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateMap()}
                />
                <Button
                    variant="primary"
                    onClick={handleCreateMap}
                    disabled={!newMapTitle.trim() || creating}
                    style={{ width: '100%' }}
                >
                    {creating ? 'Creating...' : 'Create New Mind Map'}
                </Button>
            </div>

            {/* Messages */}
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

            {/* Maps list */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <div>
                    {maps.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                            ¡No se encontraron mapas mentales. Crea tu primero arriba!
                        </div>
                    ) : (
                        <>
                            {user && myMaps.length > 0 && renderMapCategory(myMaps, 'Mis mapas mentales')}
                            {publicMaps.length > 0 && renderMapCategory(publicMaps, 'Mapas públicos')}
                            {sharedMaps.length > 0 && renderMapCategory(sharedMaps, 'Mapas compartidos')}
                        </>
                    )}
                </div>
            )}
        </Sidebar>
    );
};

export default MapListSidebar;