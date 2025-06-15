enum ImageType : uint8_t {
    NoImage = 0,
    UncompressedIndexed = 1,
    UncompressedRgb = 2,
    UncompressedGray = 3,
    RleIndexed = 9,
    RleRgb = 10,
    RleGray = 11,
};

struct Colormap {
    uint32_t colors[width*height];
};

struct Header {
    uint8_t     idLength;
    uint8_t     colormapType;
    ImageType   imageType;
    uint16_t    colormapOrigin;
    uint16_t    colormapLength;
    uint8_t     colormapDepth;
    uint16_t    xOrigin;
    uint16_t    yOrigin;
    uint16_t    width;
    uint16_t    height;
    uint8_t     bitsPerPixel;
    uint8_t     imageDescriptor;
    char        imageId[idLength];
    Colormap    colormap[colormapType != 0];
};

struct Root {
    Header header;
};
