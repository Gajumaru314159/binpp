struct TableRecord {
    char tag[4]; // 4-byte tag identifying the table
    uint32_t checksum; // Checksum of the table
    uint32_t offset; // Offset from the beginning of the file to the table
    uint32_t length; // Length of the table in bytes
};
struct Table {
    char tag[4];
    uint8_t data[tableRecords[$i].length-4];
};

struct OS2_V1 {
    float	xAvgCharWidth;
    uint16_t	usWeightClass;
    uint16_t	usWidthClass;
    uint16_t	fsType;
    float	ySubscriptXSize;
    float	ySubscriptYSize;
    float	ySubscriptXOffset;
    float	ySubscriptYOffset;
    float	ySuperscriptXSize;
    float	ySuperscriptYSize;
    float	ySuperscriptXOffset;
    float	ySuperscriptYOffset;
    float	yStrikeoutSize;
    float	yStrikeoutPosition;
    int16_t	sFamilyClass;
    int8_t	panose[10];
    uint32_t	ulUnicodeRange1;
    uint32_t	ulUnicodeRange2;
    uint32_t	ulUnicodeRange3;
    uint32_t	ulUnicodeRange4;
    char	achVendID[4];
    uint16_t	fsSelection;
    uint16_t	usFirstCharIndex;
    uint16_t	usLastCharIndex;
    float	sTypoAscender;
    float	sTypoDescender;
    float	sTypoLineGap;
    float	usWinAscent;
    float	usWinDescent;
    uint32_t	ulCodePageRange1;
    uint32_t	ulCodePageRange2;
};

struct OS2_V5 {
    float	xAvgCharWidth;	
    uint16_t	usWeightClass;
    uint16_t	usWidthClass;	
    uint16_t	fsType;
    float	ySubscriptXSize;	
    float	ySubscriptYSize;	
    float	ySubscriptXOffset;	
    float	ySubscriptYOffset;	
    float	ySuperscriptXSize;	
    float	ySuperscriptYSize;	
    float	ySuperscriptXOffset;	
    float	ySuperscriptYOffset;	
    float	yStrikeoutSize;	
    float	yStrikeoutPosition;	
    int16_t	sFamilyClass;	
    uint8_t	panose[10];	
    uint32_t	ulUnicodeRange1;
    uint32_t	ulUnicodeRange2;
    uint32_t	ulUnicodeRange3;
    uint32_t	ulUnicodeRange4;
    char achVendID[4];	
    uint16_t	fsSelection;	
    uint16_t	usFirstCharIndex;	
    uint16_t	usLastCharIndex;	
    float	sTypoAscender;	
    float	sTypoDescender;	
    float	sTypoLineGap;	
    float	usWinAscent;	
    float	usWinDescent;	
    uint32_t	ulCodePageRange1;
    uint32_t	ulCodePageRange2;
    float	sxHeight;	
    float	sCapHeight;	
    uint16_t	usDefaultChar;	
    uint16_t	usBreakChar;	
    uint16_t	usMaxContext;	
    uint16_t	usLowerOpticalPointSize;	
    uint16_t	usUpperOpticalPointSize;
};

struct OS2 {
    uint16_t	version; //	0x0005
    OS2_V1 data; // if version == 1
    OS2_V5 data; // if version == 5
};

enum class PlatformID : uint16_t{
    Unicode = 0,
    Macintosh = 1,
    ISO = 2,
    Microsoft = 3,
    Custom = 4
};
struct EncodingRecord {
    PlatformID platformID;
    uint16_t encodingID;
    uint32_t offset;
};
struct Cmap {
    uint16_t version;
    uint16_t numTables;
    EncodingRecord encodingRecords[numTables];
};

struct TableDirectory {
    uint32_t sfntVersion; // 65536 or 1330926671
    uint16_t numTables; // Number of tables
    uint16_t searchRange; // Maximum power of 2 less than or equal to numTables
    uint16_t entrySelector; // Log2 of the maximum power of 2
    uint16_t rangeShift; // numTables * 16 - searchRange
    TableRecord tableRecords[numTables];
    OS2 os2;
    Cmap cmap;
};

struct Root {
    TableDirectory tableDirectory;
};