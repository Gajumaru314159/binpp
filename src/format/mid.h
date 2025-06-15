struct Header {
    char magic[4]; // "MIDI"
    uint32_t length; // Length of the header
    uint16_t formatType; // Format type (0, 1, or 2)
    uint16_t numTracks; // Number of tracks
    uint16_t division; // Time division
};
struct TrackHeader {
    char magic[4]; // "MTrk"
    uint32_t length; // Length of the track data
};
struct Root {
    Header header;
    TrackHeader trackHeaders[header.numTracks];
};