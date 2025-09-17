import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
    filename?: string;
    quality?: number;
    backgroundColor?: string;
}

/**
 * Export an HTML element to PNG format
 */
export const exportToPNG = async (
    element: HTMLElement,
    options: ExportOptions = {}
): Promise<void> => {
    try {
        const {
            filename = 'mindmap',
            quality = 1,
            backgroundColor = '#ffffff'
        } = options;

        // Configure html2canvas options
        const canvas = await html2canvas(element, {
            backgroundColor,
            scale: quality,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: element.scrollWidth,
            height: element.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });

        // Create download link
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('✅ PNG export completed successfully');
    } catch (error) {
        console.error('❌ PNG export failed:', error);
        throw new Error('Failed to export PNG');
    }
};

/**
 * Export an HTML element to PDF format
 */
export const exportToPDF = async (
    element: HTMLElement,
    options: ExportOptions = {}
): Promise<void> => {
    try {
        const {
            filename = 'mindmap',
            quality = 1,
            backgroundColor = '#ffffff'
        } = options;

        // First convert to canvas
        const canvas = await html2canvas(element, {
            backgroundColor,
            scale: quality,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: element.scrollWidth,
            height: element.scrollHeight,
            scrollX: 0,
            scrollY: 0
        });

        const imgData = canvas.toDataURL('image/png');

        // Calculate PDF dimensions
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // A4 size in mm
        const pdfWidth = 210;
        const pdfHeight = 297;

        // Calculate scale to fit content in PDF
        const scaleX = pdfWidth / (imgWidth * 0.264583); // Convert px to mm
        const scaleY = pdfHeight / (imgHeight * 0.264583);
        const scale = Math.min(scaleX, scaleY);

        const finalWidth = imgWidth * 0.264583 * scale;
        const finalHeight = imgHeight * 0.264583 * scale;

        // Center the image on the page
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        // Create PDF
        const pdf = new jsPDF({
            orientation: finalWidth > finalHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Add the image to PDF
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

        // Save the PDF
        pdf.save(`${filename}.pdf`);

        console.log('✅ PDF export completed successfully');
    } catch (error) {
        console.error('❌ PDF export failed:', error);
        throw new Error('Failed to export PDF');
    }
};

/**
 * Export mind map with both formats
 */
export const exportMindMap = async (
    element: HTMLElement,
    format: 'png' | 'pdf' | 'both' = 'both',
    options: ExportOptions = {}
): Promise<void> => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
    const defaultFilename = `mindmap_${timestamp}`;

    const exportOptions = {
        filename: defaultFilename,
        quality: 2, // Higher quality for exports
        backgroundColor: '#ffffff',
        ...options
    };

    try {
        if (format === 'png' || format === 'both') {
            await exportToPNG(element, exportOptions);
        }

        if (format === 'pdf' || format === 'both') {
            await exportToPDF(element, exportOptions);
        }
    } catch (error) {
        console.error('❌ Mind map export failed:', error);
        throw error;
    }
};

/**
 * Prepare element for export (hide UI elements, etc.)
 */
export const prepareElementForExport = (element: HTMLElement): () => void => {
    const elementsToHide: HTMLElement[] = [];

    // Hide elements with data-export-hide attribute
    const hideElements = element.querySelectorAll('[data-export-hide]') as NodeListOf<HTMLElement>;
    hideElements.forEach(el => {
        if (el.style.display !== 'none') {
            elementsToHide.push(el);
            el.style.display = 'none';
        }
    });

    // Hide scrollbars
    const originalOverflow = element.style.overflow;
    element.style.overflow = 'hidden';

    // Return cleanup function
    return () => {
        // Restore hidden elements
        elementsToHide.forEach(el => {
            el.style.display = '';
        });

        // Restore overflow
        element.style.overflow = originalOverflow;
    };
};