import styled from 'styled-components';

export const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

export const Header = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 1rem;
  }
`;

export const HeaderTitle = styled.h1`
  color: white;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 0.5rem;
    justify-content: center;
  }
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  
  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #4f46e5;
          color: white;
          &:hover { background: #4338ca; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.2);
          color: white;
          backdrop-filter: blur(10px);
          &:hover { background: rgba(255, 255, 255, 0.3); }
        `;
    }
  }}
`;

export const MainContent = styled.main`
  padding: 2rem;
  min-height: calc(100vh - 80px);

  @media (max-width: 768px) {
    padding: 1rem;
    min-height: calc(100vh - 120px);
  }
`;

export const CanvasContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  height: 600px;

  @media (max-width: 768px) {
    height: 400px;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
`;

export const Sidebar = styled.aside<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-400px'};
  width: 400px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  transition: right 0.3s ease;
  z-index: 1000;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 100%;
    padding: 1rem;
    right: ${props => props.isOpen ? '0' : '-100%'};
  }
`;

export const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

export const SidebarTitle = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  &:hover { color: #374151; }
`;

export const MapList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const MapCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #4f46e5;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
  }
`;

export const MapTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1rem;
`;

export const MapMeta = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

export const NodeEditor = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

export const NodeEditorTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
`;

export const ColorPicker = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }
`;

export const ColorOption = styled.button<{ color: string; isSelected: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid ${props => props.isSelected ? '#4f46e5' : '#d1d5db'};
  background: ${props => props.color};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    width: 25px;
    height: 25px;
  }
`;

export const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const ErrorMessage = styled.div`
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #fecaca;
  margin-bottom: 1rem;
  text-align: center;
`;

export const SuccessMessage = styled.div`
  background: #f0fdf4;
  color: #16a34a;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  margin-bottom: 1rem;
  text-align: center;
`;

export const ConnectionLegend = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #374151;
`;

export const LegendLine = styled.div<{ type: 'parent-child' | 'regular' }>`
  width: 40px;
  height: 3px;
  border-radius: 2px;
  
  ${props => props.type === 'parent-child' ? `
    background: #10b981;
  ` : `
    background: #6b7280;
    background-image: repeating-linear-gradient(
      90deg,
      #6b7280,
      #6b7280 5px,
      transparent 5px,
      transparent 10px
    );
  `}
`;