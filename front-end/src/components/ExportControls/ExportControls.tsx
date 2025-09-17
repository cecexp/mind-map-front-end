import React from 'react';
import styled from 'styled-components';
import { Button } from '../styled/GlobalStyles';

const ExportButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const ExportButton = styled(Button)`
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  min-width: auto;
  
  @media (max-width: 768px) {
    width: 100%;
    font-size: 0.75rem;
    padding: 0.4rem 0.6rem;
  }
`;

interface ExportControlsProps {
    onExportJSON: () => void;
    onExportPNG: () => Promise<void>;
    onExportPDF: () => Promise<void>;
    disabled?: boolean;
}

const ExportControls: React.FC<ExportControlsProps> = ({
    onExportJSON,
    onExportPNG,
    onExportPDF,
    disabled = false
}) => {
    const [exporting, setExporting] = React.useState<string | null>(null);

    const handleExport = async (type: 'json' | 'png' | 'pdf', handler: () => void | Promise<void>) => {
        if (disabled || exporting) return;

        setExporting(type);
        try {
            await handler();
        } catch (error) {
            console.error(`Export ${type} failed:`, error);
        } finally {
            setExporting(null);
        }
    };

    return (
        <ExportButtonGroup>
            <ExportButton
                onClick={() => handleExport('json', onExportJSON)}
                disabled={disabled || exporting !== null}
            >
                {exporting === 'json' ? '⏳' : '📄'} JSON
            </ExportButton>
            <ExportButton
                onClick={() => handleExport('png', onExportPNG)}
                disabled={disabled || exporting !== null}
            >
                {exporting === 'png' ? '⏳' : '🖼️'} PNG
            </ExportButton>
            <ExportButton
                onClick={() => handleExport('pdf', onExportPDF)}
                disabled={disabled || exporting !== null}
            >
                {exporting === 'pdf' ? '⏳' : '📑'} PDF
            </ExportButton>
        </ExportButtonGroup>
    );
};

export default ExportControls;