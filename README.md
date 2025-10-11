# Joy of Painting Web Converter

A web-based tool for converting images to and from the .paint format used by the "Joy of Painting" Minecraft mod.  
Available by [bondarenkoartur.github.io/JoyOfPainting](https://bondarenkoartur.github.io/JoyOfPainting/)  

## Features

- **Import/Export**: Convert between .paint files and standard image formats (PNG, JPG)
- **Canvas Types**: Support for Small (16x16), Large (32x32), Long (32x16), and Tall (16x32) canvases
- **NBT Editing**: Edit painting metadata (title, author, name, generation, version) directly in the browser
- **Multi-Canvas Support**: Split large images across multiple canvases for higher resolution artwork with visual grid preview
- **Preview**: Real-time preview of conversions with painting information
- **Clipboard Support**: Paste images directly with Ctrl+V
- **Static Hosting**: Runs entirely in the browser - perfect for GitHub Pages

## Usage

### Converting .paint to Image

1. Drag and drop or select a .paint file
2. Choose output format (PNG or JPG)
3. Select desired image size (native or scaled)
4. Click "Convert" to download the image

### Converting Image to .paint

1. Drag and drop, paste (Ctrl+V), or select an image file
2. Choose canvas type that matches your desired aspect ratio
3. Fill in painting metadata (title, author) - both required together or leave both empty
4. Select ".paint File" as output format
5. Click "Convert" to download the .paint file

### Multi-Canvas Conversion

For creating high-resolution artwork:

1. Upload a large image
2. Select canvas type and adjust grid dimensions
3. Preview shows actual image sections for each canvas
4. Click "Generate Multi-Canvas"
5. Multiple .paint files will be downloaded, each representing a section

### NBT Field Editing

The tool allows editing of these .paint file fields:
- **Title**: Display name of the painting (optional - leave empty for in-game editing)
- **Author**: Creator's name (optional - leave empty for in-game editing)
- **Name**: Internal UUID_timestamp identifier (auto-generated if empty)
- **Generation**: Canvas generation number (use 0 for in-game editable paintings)
- **Version**: Canvas version number (use 99 for in-game editable paintings)

**For in-game editable paintings**: Set Generation=0, Version=99, and leave Title/Author empty. This creates paintings that can be edited directly in Minecraft using the Joy of Painting mod interface.

**Important**: Title and Author must both be filled or both be empty - the mod requires both fields together for signed canvases.

## Technical Details

### File Format Support

- **Input**: .paint files (NBT format), PNG, JPG, GIF, BMP, clipboard images
- **Output**: .paint files, PNG, JPG

### Canvas Types

| Type | Dimensions | Best For |
|------|------------|----------|
| Small | 16x16 | Icons, simple art |
| Large | 32x32 | Detailed square art |
| Long | 32x16 | Landscape/banner art |
| Tall | 16x32 | Portrait/vertical art |

### NBT Structure

The .paint files use Minecraft's NBT format with this structure:
```
{
  "generation": <0 for editable, 1 for locked>,
  "ct": <canvas_type>,
  "pixels": [<pixel_array>],
  "v": <99 for editable, 2 for locked>,
  "author": "<author_name>", // optional - only if title also present
  "name": "<uuid>_<timestamp>",
  "title": "<painting_title>" // optional - only if author also present
}
```

**Note**: Author and title fields are only included in the NBT if both have values. Empty fields are omitted to allow in-game editing.

## Deployment

### GitHub Pages

1. Fork or clone this repository
2. Enable GitHub Pages in repository settings
3. Select source as "Deploy from a branch" → main branch
4. Your converter will be available at `https://yourusername.github.io/repository-name/`

### Local Development

Simply open `index.html` in a modern web browser. No build process required.

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Requires support for:
- File API
- Canvas API
- ArrayBuffer
- TextEncoder/TextDecoder
- Clipboard API (for paste functionality)

## Limitations

- Maximum file size depends on browser memory limits
- Multi-canvas downloads may trigger popup blockers
- NBT parsing is implemented in JavaScript (may be slower than native Python)

## Related Projects

- [JoP-Conversion-Tool](https://github.com/SorcerioTheWizard/JoP-Conversion-Tool) - Python command-line version
- [Joy of Painting Mod](https://github.com/ercanserteli/xercamods) - The original Minecraft mod

## License

This project follows the same license as the original JoP-Conversion-Tool.
