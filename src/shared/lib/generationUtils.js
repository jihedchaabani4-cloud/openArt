/**
 * Generation Utilities
 * Logic extracted from GeneratedMediaBlock for cleaner components.
 */

/**
 * Determines the Tailwind grid class for a generation group
 */
export function getGridClass(group, count, gridSize = 'lg') {
    const layoutProps = {
        sm: { container: "flex flex-wrap gap-1.5", maxHeight: "h-[250px]" },
        md: { container: "flex flex-wrap gap-2.5", maxHeight: "h-[350px]" },
        lg: { container: "flex flex-wrap gap-4",   maxHeight: "h-[450px]" }
    };

    const props = layoutProps[gridSize] || layoutProps.lg;
    
    return {
        gridClass: props.container,
        maxHeightClass: props.maxHeight
    };
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
