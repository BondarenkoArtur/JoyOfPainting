// Joy of Painting Converter
class JopConverter {
    static CANVAS_TYPES = {
        0: { name: 'Small', width: 16, height: 16 },
        1: { name: 'Large', width: 32, height: 32 },
        2: { name: 'Long', width: 32, height: 16 },
        3: { name: 'Tall', width: 16, height: 32 }
    };

    static ROOT_UUID = "d1ebe29f-f4e9-4572-83cd-8b2cdbfc2420";
    static CANVAS_GEN = 1;
    static CANVAS_VER = 2;

    // Parse .paint file
    static parsePaintFile(arrayBuffer) {
        try {
            const parser = new NBTParser(arrayBuffer);
            const nbtData = parser.parse();
            
            // Extract paint data
            const paintData = {
                canvasType: nbtData.ct,
                author: nbtData.author || '',
                title: nbtData.title || '',
                name: nbtData.name || '',
                pixels: nbtData.pixels || []
            };

            // Only add generation and version if they exist in the file
            if (nbtData.generation !== undefined) {
                paintData.generation = nbtData.generation;
            }
            if (nbtData.v !== undefined) {
                paintData.version = nbtData.v;
            }

            // Convert pixel integers to hex colors
            paintData.pixelColors = paintData.pixels.map(pixel => {
                // Convert signed int to unsigned, then to hex
                const unsigned = pixel >>> 0;
                const hex = unsigned.toString(16).padStart(8, '0');
                return hex.substring(2); // Remove alpha channel (first 2 chars)
            });

            return paintData;
        } catch (error) {
            throw new Error(`Failed to parse .paint file: ${error.message}`);
        }
    }

    // Convert paint data to image
    static paintToImage(paintData, scale = 1) {
        const canvasInfo = this.CANVAS_TYPES[paintData.canvasType];
        if (!canvasInfo) {
            throw new Error(`Unknown canvas type: ${paintData.canvasType}`);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvasInfo.width * scale;
        canvas.height = canvasInfo.height * scale;

        // Create image data
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        for (let y = 0; y < canvasInfo.height; y++) {
            for (let x = 0; x < canvasInfo.width; x++) {
                const pixelIndex = y * canvasInfo.width + x;
                const colorHex = paintData.pixelColors[pixelIndex] || '000000';
                
                // Convert hex to RGB
                const r = parseInt(colorHex.substring(0, 2), 16);
                const g = parseInt(colorHex.substring(2, 4), 16);
                const b = parseInt(colorHex.substring(4, 6), 16);

                // Fill scaled pixels
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const scaledX = x * scale + sx;
                        const scaledY = y * scale + sy;
                        const dataIndex = (scaledY * canvas.width + scaledX) * 4;
                        
                        data[dataIndex] = r;     // Red
                        data[dataIndex + 1] = g; // Green
                        data[dataIndex + 2] = b; // Blue
                        data[dataIndex + 3] = 255; // Alpha
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    // Convert image to paint data
    static imageToPaint(imageElement, canvasType, title, author, name = null) {
        const canvasInfo = this.CANVAS_TYPES[canvasType];
        if (!canvasInfo) {
            throw new Error(`Unknown canvas type: ${canvasType}`);
        }

        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvasInfo.width;
        canvas.height = canvasInfo.height;

        // Draw and resize image to canvas size
        ctx.imageSmoothingEnabled = false; // Pixel art style
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to pixel array
        const pixels = [];
        const pixelColors = [];

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to hex
            const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
            pixelColors.push(hex);
            
            // Convert to signed integer with alpha channel
            const pixelInt = (0xFF << 24) | (r << 16) | (g << 8) | b;
            pixels.push(pixelInt);
        }

        // Generate name if not provided
        if (!name) {
            name = `${this.ROOT_UUID}_${Math.floor(Date.now() / 1000)}`;
        }

        return {
            canvasType,
            author: author || '',
            title: title || '',
            name,
            generation: this.CANVAS_GEN,
            version: this.CANVAS_VER,
            pixels,
            pixelColors
        };
    }

    // Create .paint file from paint data
    static createPaintFile(paintData) {
        const writer = new NBTWriter();
        
        // Create compound structure - only include non-empty fields
        const compound = {
            generation: paintData.generation,
            ct: paintData.canvasType,
            pixels: paintData.pixels,
            v: paintData.version,
            name: paintData.name
        };

        // Only add author and title if BOTH have values (mod requirement)
        const hasTitle = paintData.title && paintData.title.trim();
        const hasAuthor = paintData.author && paintData.author.trim();
        
        if (hasTitle && hasAuthor) {
            compound.author = paintData.author;
            compound.title = paintData.title;
        }

        // Write root compound tag
        writer.writeTag(10, '', compound);
        
        return writer.build();
    }

    // Utility: Constrain image to power of 2
    static constrainToPowerOfTwo(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const width = imageElement.naturalWidth || imageElement.width;
        const height = imageElement.naturalHeight || imageElement.height;
        
        // Calculate nearest power of 2
        const newWidth = Math.pow(2, Math.ceil(Math.log2(width)));
        const newHeight = Math.pow(2, Math.ceil(Math.log2(height)));
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(imageElement, 0, 0, newWidth, newHeight);
        
        return canvas;
    }

    // Multi-canvas support: Split large image
    static splitImageToMultiCanvas(imageElement, canvasType, gridWidth, gridHeight, title, author, generation, version) {
        const canvasInfo = this.CANVAS_TYPES[canvasType];
        const totalWidth = canvasInfo.width * gridWidth;
        const totalHeight = canvasInfo.height * gridHeight;
        
        // Resize image to fit grid
        const resizedCanvas = document.createElement('canvas');
        const resizedCtx = resizedCanvas.getContext('2d');
        resizedCanvas.width = totalWidth;
        resizedCanvas.height = totalHeight;
        
        resizedCtx.imageSmoothingEnabled = false;
        resizedCtx.drawImage(imageElement, 0, 0, totalWidth, totalHeight);
        
        const paintFiles = [];
        
        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                // Extract canvas-sized section
                const sectionCanvas = document.createElement('canvas');
                const sectionCtx = sectionCanvas.getContext('2d');
                sectionCanvas.width = canvasInfo.width;
                sectionCanvas.height = canvasInfo.height;
                
                const sourceX = col * canvasInfo.width;
                const sourceY = row * canvasInfo.height;
                
                sectionCtx.drawImage(
                    resizedCanvas,
                    sourceX, sourceY, canvasInfo.width, canvasInfo.height,
                    0, 0, canvasInfo.width, canvasInfo.height
                );
                
                // Convert to paint data
                const sectionTitle = title ? `${title}_${row + 1}_${col + 1}` : '';
                const paintData = this.imageToPaint(sectionCanvas, canvasType, sectionTitle, author);
                paintData.generation = generation;
                paintData.version = version;
                
                // Generate unique name for each canvas part
                const baseTimestamp = Math.floor(Date.now() / 1000);
                const uniqueId = baseTimestamp + (row * gridWidth + col); // Add position offset to timestamp
                const baseName = paintData.name.split('_')[0]; // Get UUID part
                paintData.name = `${baseName}_${uniqueId}`;
                
                const filename = title ? `${title}_${row + 1}_${col + 1}.paint` : `canvas_${row + 1}_${col + 1}.paint`;
                
                paintFiles.push({
                    paintData,
                    filename,
                    position: { row, col }
                });
            }
        }
        
        return paintFiles;
    }

    // Download file helper
    static downloadFile(data, filename, mimeType = 'application/octet-stream') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    // Canvas to blob helper
    static canvasToBlob(canvas, format = 'image/png', quality = 0.9) {
        return new Promise(resolve => {
            canvas.toBlob(resolve, format, quality);
        });
    }
}
