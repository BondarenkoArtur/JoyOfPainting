// NBT Parser for Joy of Painting .paint files
class NBTParser {
    constructor(buffer) {
        this.buffer = new Uint8Array(buffer);
        this.offset = 0;
    }

    readByte() {
        return this.buffer[this.offset++];
    }

    readShort() {
        const value = (this.buffer[this.offset] << 8) | this.buffer[this.offset + 1];
        this.offset += 2;
        return value;
    }

    readInt() {
        const value = (this.buffer[this.offset] << 24) | 
                     (this.buffer[this.offset + 1] << 16) | 
                     (this.buffer[this.offset + 2] << 8) | 
                     this.buffer[this.offset + 3];
        this.offset += 4;
        return value;
    }

    readLong() {
        // Read as two 32-bit integers (high, low)
        const high = this.readInt();
        const low = this.readInt();
        return (high * 0x100000000) + (low >>> 0);
    }

    readFloat() {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        for (let i = 0; i < 4; i++) {
            view.setUint8(i, this.buffer[this.offset + i]);
        }
        this.offset += 4;
        return view.getFloat32(0, false); // big-endian
    }

    readDouble() {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        for (let i = 0; i < 8; i++) {
            view.setUint8(i, this.buffer[this.offset + i]);
        }
        this.offset += 8;
        return view.getFloat64(0, false); // big-endian
    }

    readString() {
        const length = this.readShort();
        const bytes = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return new TextDecoder('utf-8').decode(bytes);
    }

    readByteArray() {
        const length = this.readInt();
        const array = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return array;
    }

    readIntArray() {
        const length = this.readInt();
        const array = [];
        for (let i = 0; i < length; i++) {
            array.push(this.readInt());
        }
        return array;
    }

    readLongArray() {
        const length = this.readInt();
        const array = [];
        for (let i = 0; i < length; i++) {
            array.push(this.readLong());
        }
        return array;
    }

    readTag() {
        const type = this.readByte();
        
        if (type === 0) { // TAG_End
            return { type: 'end', value: null };
        }

        const name = this.readString();
        const value = this.readTagPayload(type);
        
        return { type: this.getTagTypeName(type), name, value };
    }

    readTagPayload(type) {
        switch (type) {
            case 1: return this.readByte(); // TAG_Byte
            case 2: return this.readShort(); // TAG_Short
            case 3: return this.readInt(); // TAG_Int
            case 4: return this.readLong(); // TAG_Long
            case 5: return this.readFloat(); // TAG_Float
            case 6: return this.readDouble(); // TAG_Double
            case 7: return this.readByteArray(); // TAG_Byte_Array
            case 8: return this.readString(); // TAG_String
            case 9: return this.readList(); // TAG_List
            case 10: return this.readCompound(); // TAG_Compound
            case 11: return this.readIntArray(); // TAG_Int_Array
            case 12: return this.readLongArray(); // TAG_Long_Array
            default:
                throw new Error(`Unknown tag type: ${type}`);
        }
    }

    readList() {
        const elementType = this.readByte();
        const length = this.readInt();
        const list = [];
        
        for (let i = 0; i < length; i++) {
            list.push(this.readTagPayload(elementType));
        }
        
        return { elementType: this.getTagTypeName(elementType), elements: list };
    }

    readCompound() {
        const compound = {};
        
        while (true) {
            const tag = this.readTag();
            if (tag.type === 'end') break;
            compound[tag.name] = tag.value;
        }
        
        return compound;
    }

    getTagTypeName(type) {
        const types = {
            0: 'end', 1: 'byte', 2: 'short', 3: 'int', 4: 'long',
            5: 'float', 6: 'double', 7: 'byteArray', 8: 'string',
            9: 'list', 10: 'compound', 11: 'intArray', 12: 'longArray'
        };
        return types[type] || 'unknown';
    }

    parse() {
        const rootTag = this.readTag();
        return rootTag.value;
    }
}

// NBT Writer for creating .paint files
class NBTWriter {
    constructor() {
        this.buffer = [];
    }

    writeByte(value) {
        this.buffer.push(value & 0xFF);
    }

    writeShort(value) {
        this.buffer.push((value >> 8) & 0xFF);
        this.buffer.push(value & 0xFF);
    }

    writeInt(value) {
        this.buffer.push((value >> 24) & 0xFF);
        this.buffer.push((value >> 16) & 0xFF);
        this.buffer.push((value >> 8) & 0xFF);
        this.buffer.push(value & 0xFF);
    }

    writeLong(value) {
        const high = Math.floor(value / 0x100000000);
        const low = value & 0xFFFFFFFF;
        this.writeInt(high);
        this.writeInt(low);
    }

    writeFloat(value) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, value, false); // big-endian
        for (let i = 0; i < 4; i++) {
            this.buffer.push(view.getUint8(i));
        }
    }

    writeDouble(value) {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, value, false); // big-endian
        for (let i = 0; i < 8; i++) {
            this.buffer.push(view.getUint8(i));
        }
    }

    writeString(value) {
        const bytes = new TextEncoder().encode(value);
        this.writeShort(bytes.length);
        for (const byte of bytes) {
            this.buffer.push(byte);
        }
    }

    writeByteArray(array) {
        this.writeInt(array.length);
        for (const byte of array) {
            this.buffer.push(byte);
        }
    }

    writeIntArray(array) {
        this.writeInt(array.length);
        for (const int of array) {
            this.writeInt(int);
        }
    }

    writeLongArray(array) {
        this.writeInt(array.length);
        for (const long of array) {
            this.writeLong(long);
        }
    }

    writeTag(type, name, value) {
        this.writeByte(type);
        if (type !== 0) { // Not TAG_End
            this.writeString(name);
            this.writeTagPayload(type, value);
        }
    }

    writeTagPayload(type, value) {
        switch (type) {
            case 1: this.writeByte(value); break;
            case 2: this.writeShort(value); break;
            case 3: this.writeInt(value); break;
            case 4: this.writeLong(value); break;
            case 5: this.writeFloat(value); break;
            case 6: this.writeDouble(value); break;
            case 7: this.writeByteArray(value); break;
            case 8: this.writeString(value); break;
            case 9: this.writeList(value); break;
            case 10: this.writeCompound(value); break;
            case 11: this.writeIntArray(value); break;
            case 12: this.writeLongArray(value); break;
        }
    }

    writeList(list) {
        const elementType = this.getTagTypeId(list.elementType);
        this.writeByte(elementType);
        this.writeInt(list.elements.length);
        
        for (const element of list.elements) {
            this.writeTagPayload(elementType, element);
        }
    }

    writeCompound(compound) {
        for (const [name, value] of Object.entries(compound)) {
            const type = this.inferTagType(value);
            this.writeTag(type, name, value);
        }
        this.writeByte(0); // TAG_End
    }

    inferTagType(value) {
        if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                if (value >= -128 && value <= 127) return 1; // byte
                if (value >= -32768 && value <= 32767) return 2; // short
                if (value >= -2147483648 && value <= 2147483647) return 3; // int
                return 4; // long
            }
            return 6; // double
        }
        if (typeof value === 'string') return 8;
        if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'number' && Number.isInteger(value[0])) {
                return 11; // int array
            }
            return 9; // list
        }
        if (typeof value === 'object') return 10; // compound
        return 8; // default to string
    }

    getTagTypeId(typeName) {
        const types = {
            'end': 0, 'byte': 1, 'short': 2, 'int': 3, 'long': 4,
            'float': 5, 'double': 6, 'byteArray': 7, 'string': 8,
            'list': 9, 'compound': 10, 'intArray': 11, 'longArray': 12
        };
        return types[typeName] || 8;
    }

    build() {
        return new Uint8Array(this.buffer);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NBTParser, NBTWriter };
}
