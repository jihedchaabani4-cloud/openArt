/**
 * Generation Utilities
 * Logic extracted from GeneratedMediaBlock for cleaner components.
 */

/**
 * Determines the Tailwind grid class for a generation group
 */
export function getGridClass(group, count, gridSize = 'lg') {
    if (gridSize === 'sm') return "grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 max-w-full";
    if (gridSize === 'md') return "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 max-w-full";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 max-w-full"; // lg
}

/**
 * Formats generation dates
 */
export function formatGenerationDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        }).format(date);
    } catch (e) {
        return '';
    }
}

/**
 * Extracts metadata and derived properties for a generation item
 */
export function getItemMetadata(item, group) {
    const isVideo = item.asset_type === 'video' || item.asset?.asset_type === 'video' || item._displayType === 'shot';
    const isAudio = item.asset_type === 'audio' || item.asset?.asset_type === 'audio';
    const url = item._displayType === 'shot' ? item.video_url : (item.file_url || item.asset?.file_url);
    const ratioStr = item.params?.ratio || group?.params?.ratio || (item._displayType === 'shot' ? "16:9" : "1:1");
    
    let aspect = "3/4";
    if (isAudio) aspect = "4/1";
    else if (ratioStr === "16:9") aspect = "16/9";
    else if (ratioStr === "9:16") aspect = "9/16";
    else if (ratioStr === "1:1") aspect = "1/1";
    else if (ratioStr === "4:3") aspect = "4/3";
    else if (ratioStr === "3:4") aspect = "3/4";
    else if (ratioStr === "2:3") aspect = "2/3";
    else if (ratioStr === "3:2") aspect = "3/2";
    else if (ratioStr === "21:9") aspect = "21/9";

    return { isVideo, isAudio, url, aspect, ratioStr, status: item.status };
}
