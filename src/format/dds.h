enum PixelFormatFlags : uint32_t {
    AlphaPixels = 0x1,
    FourCC      = 0x4,
    RGB         = 0x40,
    Luminance   = 0x20000,
};

struct PixelFormat {
    uint32_t size;
    uint32_t flags;
    uint32_t fourCC;
    uint32_t RGBBitCount;
    uint32_t RBitMask;
    uint32_t GBitMask;
    uint32_t BBitMask;
    uint32_t ABitMask;
};

struct Header {
    uint32_t    size;
    uint32_t    flags;
    uint32_t    height;
    uint32_t    width;
    uint32_t    pitchOrLinearSize;
    uint32_t    depth;
    uint32_t    mipMapCount;
    uint32_t    reserved1[11];
    PixelFormat ddspf;
    uint32_t    caps;
    uint32_t    caps2;
    uint32_t    caps3;
    uint32_t    caps4;
    uint32_t    reserved2;
};

struct DX10Header {
    uint32_t dxgiFormat;
    uint32_t resourceDimension;
    uint32_t miscFlag;
    uint32_t arraySize;
    uint32_t miscFlags2;
};

struct Root {
    Header header;
    DX10Header dx10Header;
    uint8_t data[100]; // This is a flexible array member, used to store the actual pixel data.
}