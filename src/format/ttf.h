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

struct TableDirectory {
    uint32_t sfntVersion; // 65536 or 1330926671
    uint16_t numTables; // Number of tables
    uint16_t searchRange; // Maximum power of 2 less than or equal to numTables
    uint16_t entrySelector; // Log2 of the maximum power of 2
    uint16_t rangeShift; // numTables * 16 - searchRange
    TableRecord tableRecords[numTables];
    Table tables[numTables];
};

struct Root {
    TableDirectory tableDirectory;
};