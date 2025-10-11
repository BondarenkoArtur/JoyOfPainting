// Main Application Logic
class JopApp {
    constructor() {
        this.currentFile = null;
        this.currentPaintData = null;
        this.currentImage = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.fileDropArea = document.getElementById('fileDropArea');
        this.conversionOptions = document.getElementById('conversionOptions');
        this.metadataEditor = document.getElementById('metadataEditor');
        this.previewSection = document.getElementById('previewSection');
        this.multiCanvasSection = document.getElementById('multiCanvasSection');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.previewInfo = document.getElementById('previewInfo');
        
        // Form elements
        this.canvasTypeSelect = document.getElementById('canvasType');
        this.outputFormatSelect = document.getElementById('outputFormat');
        this.imageSizeSelect = document.getElementById('imageSize');
        this.imageSizeGroup = document.getElementById('imageSizeGroup');
        this.canvasGridSelect = document.getElementById('canvasGrid');
        
        // Multi-canvas elements
        this.multiCanvasType = document.getElementById('multiCanvasType');
        this.gridWidth = document.getElementById('gridWidth');
        this.gridHeight = document.getElementById('gridHeight');
        this.resolutionInfo = document.getElementById('resolutionInfo');
        this.totalResolution = document.getElementById('totalResolution');
        this.canvasCount = document.getElementById('canvasCount');
        this.gridPreview = document.getElementById('gridPreview');
        this.gridContainer = document.getElementById('gridContainer');
        
        // Metadata inputs
        this.titleInput = document.getElementById('paintingTitle');
        this.authorInput = document.getElementById('paintingAuthor');
        this.nameInput = document.getElementById('paintingName');
        this.generationInput = document.getElementById('paintingGeneration');
        this.versionInput = document.getElementById('paintingVersion');
        
        // Buttons
        this.convertBtn = document.getElementById('convertBtn');
        this.multiConvertBtn = document.getElementById('multiConvertBtn');
    }

    bindEvents() {
        // File input events
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        this.fileDropArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileDropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileDropArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Clipboard paste
        document.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Output format change
        this.outputFormatSelect.addEventListener('change', () => this.updateOutputOptions());
        
        // Convert buttons
        this.convertBtn.addEventListener('click', () => this.handleConvert());
        this.multiConvertBtn.addEventListener('click', () => this.handleMultiConvert());
        
        // Canvas type change for images
        this.canvasTypeSelect.addEventListener('change', () => this.updatePreview());
        
        // Multi-canvas controls
        this.multiCanvasType.addEventListener('change', () => this.updateMultiCanvasInfo());
        this.gridWidth.addEventListener('input', () => this.updateMultiCanvasInfo());
        this.gridHeight.addEventListener('input', () => this.updateMultiCanvasInfo());
        
        // Title/Author validation
        this.titleInput.addEventListener('input', () => this.validateTitleAuthor());
        this.authorInput.addEventListener('input', () => this.validateTitleAuthor());
        
        // Recalculate grid on window resize
        window.addEventListener('resize', () => {
            if (this.currentImage) {
                const width = parseInt(this.gridWidth.value);
                const height = parseInt(this.gridHeight.value);
                this.updateGridPreview(width, height);
            }
        });
    }

    validateTitleAuthor() {
        const title = this.titleInput.value.trim();
        const author = this.authorInput.value.trim();
        
        // Remove existing validation messages
        const existingMessages = document.querySelectorAll('.title-author-warning');
        existingMessages.forEach(msg => msg.remove());
        
        if ((title && !author) || (!title && author)) {
            const warning = document.createElement('div');
            warning.className = 'title-author-warning';
            warning.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 5px; font-style: italic;';
            warning.textContent = 'Both title and author must be filled together, or leave both empty for in-game editing';
            
            if (title && !author) {
                this.authorInput.parentNode.appendChild(warning);
            } else {
                this.titleInput.parentNode.appendChild(warning);
            }
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.fileDropArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.fileDropArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.fileDropArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handlePaste(e) {
        const items = Array.from(e.clipboardData.items);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (imageItem) {
            e.preventDefault();
            const file = imageItem.getAsFile();
            this.processFiles([file]);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        if (files.length === 0) return;
        
        try {
            const file = files[0]; // Process first file
            this.currentFile = file;
            
            if (file.name.endsWith('.paint')) {
                await this.loadPaintFile(file);
            } else if (file.type.startsWith('image/')) {
                await this.loadImageFile(file);
            } else {
                this.showError('Unsupported file type. Please select a .paint file or image.');
                return;
            }
            
            this.showConversionOptions();
            this.updatePreview();
            
        } catch (error) {
            this.showError(`Error processing file: ${error.message}`);
        }
    }

    async loadPaintFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        this.currentPaintData = JopConverter.parsePaintFile(arrayBuffer);
        this.currentImage = null;
        
        // Populate metadata fields
        this.titleInput.value = this.currentPaintData.title || '';
        this.authorInput.value = this.currentPaintData.author || '';
        this.nameInput.value = this.currentPaintData.name || '';
        this.generationInput.value = this.currentPaintData.generation !== undefined ? this.currentPaintData.generation : 0;
        this.versionInput.value = this.currentPaintData.version !== undefined ? this.currentPaintData.version : 99;
        this.canvasTypeSelect.value = this.currentPaintData.canvasType;
        
        // Set default output format for .paint files
        this.outputFormatSelect.value = 'png';
        
        this.metadataEditor.style.display = 'block';
    }

    async loadImageFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.currentPaintData = null;
                
                // Set default metadata for in-game editing
                this.titleInput.value = '';
                this.authorInput.value = '';
                this.nameInput.value = '';
                this.generationInput.value = 0;
                this.versionInput.value = 99;
                
                // Set default output format for images
                this.outputFormatSelect.value = 'paint';
                
                this.metadataEditor.style.display = 'block';
                this.updateMultiCanvasInfo(); // Initialize grid preview
                resolve();
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    showConversionOptions() {
        this.conversionOptions.style.display = 'block';
        this.updateOutputOptions();
    }

    updateOutputOptions() {
        const format = this.outputFormatSelect.value;
        this.imageSizeGroup.style.display = format === 'paint' ? 'none' : 'block';
        
        // Show multi-canvas section for images
        if (this.currentImage) {
            this.multiCanvasSection.style.display = 'block';
            this.updateMultiCanvasInfo();
        }
    }

    updateMultiCanvasInfo() {
        const canvasType = parseInt(this.multiCanvasType.value);
        const width = parseInt(this.gridWidth.value) || 1;
        const height = parseInt(this.gridHeight.value) || 1;
        const canvasInfo = JopConverter.CANVAS_TYPES[canvasType];
        
        const totalWidth = canvasInfo.width * width;
        const totalHeight = canvasInfo.height * height;
        const count = width * height;
        
        this.totalResolution.textContent = `${totalWidth}x${totalHeight}`;
        this.canvasCount.textContent = count;
        
        this.updateGridPreview(width, height);
    }

    updateGridPreview(width, height) {
        const canvasType = parseInt(this.multiCanvasType.value);
        const canvasInfo = JopConverter.CANVAS_TYPES[canvasType];
        
        // Get available width from container, max height is min of 1.2x width or 70% viewport height
        const containerWidth = this.gridContainer.parentElement.clientWidth - 40; // padding
        const maxHeight = Math.min(containerWidth * 1.2, window.innerHeight * 0.7);
        
        const totalWidth = canvasInfo.width * width;
        const totalHeight = canvasInfo.height * height;
        const scale = Math.min(containerWidth / totalWidth, maxHeight / totalHeight);
        
        const cellWidth = Math.floor(canvasInfo.width * scale);
        const cellHeight = Math.floor(canvasInfo.height * scale);
        
        this.gridContainer.style.gridTemplateColumns = `repeat(${width}, ${cellWidth}px)`;
        this.gridContainer.style.gridTemplateRows = `repeat(${height}, ${cellHeight}px)`;
        this.gridContainer.innerHTML = '';
        
        if (this.currentImage) {
            const canvasType = parseInt(this.multiCanvasType.value);
            const canvasInfo = JopConverter.CANVAS_TYPES[canvasType];
            
            // Create preview canvas with the full grid
            const previewCanvas = document.createElement('canvas');
            const previewCtx = previewCanvas.getContext('2d');
            previewCanvas.width = canvasInfo.width * width;
            previewCanvas.height = canvasInfo.height * height;
            
            previewCtx.imageSmoothingEnabled = false;
            previewCtx.drawImage(this.currentImage, 0, 0, previewCanvas.width, previewCanvas.height);
            
            // Create grid cells with image sections
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    
                    // Extract section
                    const sectionCanvas = document.createElement('canvas');
                    const sectionCtx = sectionCanvas.getContext('2d');
                    sectionCanvas.width = canvasInfo.width;
                    sectionCanvas.height = canvasInfo.height;
                    
                    const sourceX = col * canvasInfo.width;
                    const sourceY = row * canvasInfo.height;
                    
                    sectionCtx.drawImage(
                        previewCanvas,
                        sourceX, sourceY, canvasInfo.width, canvasInfo.height,
                        0, 0, canvasInfo.width, canvasInfo.height
                    );
                    
                    cell.appendChild(sectionCanvas);
                    this.gridContainer.appendChild(cell);
                }
            }
        } else {
            // Fallback to numbers if no image
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.textContent = `${row + 1},${col + 1}`;
                    this.gridContainer.appendChild(cell);
                }
            }
        }
        
        this.gridPreview.style.display = 'block';
    }

    updatePreview() {
        if (!this.currentPaintData && !this.currentImage) return;
        
        try {
            let canvas;
            
            if (this.currentPaintData) {
                // Preview paint file
                canvas = JopConverter.paintToImage(this.currentPaintData, 8);
                this.updatePreviewInfo(this.currentPaintData);
            } else if (this.currentImage) {
                // Preview image as paint
                const canvasType = parseInt(this.canvasTypeSelect.value);
                const title = this.titleInput.value || '';
                const author = this.authorInput.value || '';
                const generation = parseInt(this.generationInput.value) || 0;
                const version = parseInt(this.versionInput.value) || 99;
                
                const tempPaintData = JopConverter.imageToPaint(this.currentImage, canvasType, title, author);
                tempPaintData.generation = generation;
                tempPaintData.version = version;
                canvas = JopConverter.paintToImage(tempPaintData, 8);
                this.updatePreviewInfo(tempPaintData);
            }
            
            // Update preview canvas
            const ctx = this.previewCanvas.getContext('2d');
            this.previewCanvas.width = canvas.width;
            this.previewCanvas.height = canvas.height;
            ctx.drawImage(canvas, 0, 0);
            
            this.previewSection.style.display = 'block';
            
        } catch (error) {
            this.showError(`Preview error: ${error.message}`);
        }
    }

    updatePreviewInfo(paintData) {
        const canvasInfo = JopConverter.CANVAS_TYPES[paintData.canvasType];
        
        this.previewInfo.innerHTML = `
            <h3>Painting Information</h3>
            <p><strong>Title:</strong> ${paintData.title || '<empty - editable in-game>'}</p>
            <p><strong>Author:</strong> ${paintData.author || '<empty - editable in-game>'}</p>
            <p><strong>Canvas Type:</strong> ${canvasInfo.name} (${canvasInfo.width}x${canvasInfo.height})</p>
            <p><strong>Name:</strong> ${paintData.name}</p>
            <p><strong>Generation:</strong> ${paintData.generation !== undefined ? paintData.generation : '<not set>'} ${paintData.generation === 0 ? '(in-game editable)' : ''}</p>
            <p><strong>Version:</strong> ${paintData.version !== undefined ? paintData.version : '<not set>'} ${paintData.version === 99 ? '(in-game editable)' : ''}</p>
            <p><strong>Pixels:</strong> ${paintData.pixels.length}</p>
        `;
    }

    async handleConvert() {
        if (!this.currentPaintData && !this.currentImage) {
            this.showError('No file loaded');
            return;
        }
        
        try {
            this.convertBtn.disabled = true;
            this.convertBtn.textContent = 'Converting...';
            
            const format = this.outputFormatSelect.value;
            const title = this.titleInput.value.trim();
            const author = this.authorInput.value.trim();
            const name = this.nameInput.value.trim() || null;
            const generation = parseInt(this.generationInput.value) || 0;
            const version = parseInt(this.versionInput.value) || 99;
            
            if (format === 'paint') {
                // Convert to .paint file
                let paintData;
                
                if (this.currentPaintData) {
                    // Update metadata
                    paintData = { ...this.currentPaintData };
                    paintData.title = title;
                    paintData.author = author;
                    paintData.generation = generation;
                    paintData.version = version;
                    if (name) paintData.name = name;
                } else {
                    // Convert image to paint
                    const canvasType = parseInt(this.canvasTypeSelect.value);
                    paintData = JopConverter.imageToPaint(this.currentImage, canvasType, title, author, name);
                    paintData.generation = generation;
                    paintData.version = version;
                }
                
                const paintFile = JopConverter.createPaintFile(paintData);
                const filename = `${(title || 'painting').replace(/[^a-zA-Z0-9]/g, '_')}.paint`;
                JopConverter.downloadFile(paintFile, filename);
                
            } else {
                // Convert to image
                let canvas;
                
                if (this.currentPaintData) {
                    const scale = this.getImageScale();
                    canvas = JopConverter.paintToImage(this.currentPaintData, scale);
                } else {
                    // Direct image download with processing
                    const canvasType = parseInt(this.canvasTypeSelect.value);
                    const tempPaintData = JopConverter.imageToPaint(this.currentImage, canvasType, title, author, name);
                    tempPaintData.generation = generation;
                    tempPaintData.version = version;
                    const scale = this.getImageScale();
                    canvas = JopConverter.paintToImage(tempPaintData, scale);
                }
                
                const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                const blob = await JopConverter.canvasToBlob(canvas, mimeType);
                const filename = `${(title || 'painting').replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
                JopConverter.downloadFile(blob, filename, mimeType);
            }
            
            this.showSuccess('Conversion completed successfully!');
            
        } catch (error) {
            this.showError(`Conversion failed: ${error.message}`);
        } finally {
            this.convertBtn.disabled = false;
            this.convertBtn.textContent = 'Convert';
        }
    }

    async handleMultiConvert() {
        if (!this.currentImage) {
            this.showError('Multi-canvas conversion requires an image file');
            return;
        }
        
        try {
            this.multiConvertBtn.disabled = true;
            this.multiConvertBtn.textContent = 'Generating...';
            
            const canvasType = parseInt(this.multiCanvasType.value);
            const title = this.titleInput.value.trim();
            const author = this.authorInput.value.trim();
            const generation = parseInt(this.generationInput.value) || 0;
            const version = parseInt(this.versionInput.value) || 99;
            const gridWidth = parseInt(this.gridWidth.value) || 1;
            const gridHeight = parseInt(this.gridHeight.value) || 1;
            
            const paintFiles = JopConverter.splitImageToMultiCanvas(
                this.currentImage, canvasType, gridWidth, gridHeight, title, author, generation, version
            );
            
            // Download all files
            for (const paintFile of paintFiles) {
                const data = JopConverter.createPaintFile(paintFile.paintData);
                JopConverter.downloadFile(data, paintFile.filename);
                
                // Small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.showSuccess(`Generated ${paintFiles.length} canvas files successfully!`);
            
        } catch (error) {
            this.showError(`Multi-canvas conversion failed: ${error.message}`);
        } finally {
            this.multiConvertBtn.disabled = false;
            this.multiConvertBtn.textContent = 'Generate Multi-Canvas';
        }
    }

    getImageScale() {
        const sizeValue = this.imageSizeSelect.value;
        if (sizeValue === 'native') return 1;
        
        const targetSize = parseInt(sizeValue);
        const canvasType = this.currentPaintData ? 
            this.currentPaintData.canvasType : 
            parseInt(this.canvasTypeSelect.value);
        
        const canvasInfo = JopConverter.CANVAS_TYPES[canvasType];
        return Math.floor(targetSize / Math.max(canvasInfo.width, canvasInfo.height));
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.error, .success');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        this.conversionOptions.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JopApp();
});
