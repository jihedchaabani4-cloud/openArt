import JSZip from "jszip";
import { api } from "./client";
import { downloadBlob } from "../lib/utils";

/**
 * Downloads multiple assets in a zip file.
 * @param {Array<Object>} entries - Array of asset objects
 * @param {Function} buildDownloadFilename - Function to build the download filename for a single entry
 * @param {string} [zipFilename] - Optional filename for the generated ZIP. If not provided, a default one is generated.
 */
export async function downloadAssetsAsZip(entries, buildDownloadFilename, zipFilename) {
    const zip = new JSZip();
    const usedNames = new Set();

    for (const entry of entries) {
        const url = entry?.primary_media?.url;
        if (!url) continue;

        const blob = await api.getBlob(url);
        const originalName = buildDownloadFilename(entry);
        let finalName = originalName;
        let duplicateIndex = 1;

        while (usedNames.has(finalName)) {
            const dotIndex = originalName.lastIndexOf(".");
            const hasExtension = dotIndex > 0;
            const basename = hasExtension ? originalName.slice(0, dotIndex) : originalName;
            const extension = hasExtension ? originalName.slice(dotIndex) : "";
            finalName = `${basename}-${duplicateIndex}${extension}`;
            duplicateIndex += 1;
        }

        usedNames.add(finalName);
        zip.file(finalName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    let finalZipFilename = zipFilename;
    if (!finalZipFilename) {
        const now = new Date();
        const timestamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
            String(now.getHours()).padStart(2, "0"),
            String(now.getMinutes()).padStart(2, "0"),
        ].join("-");
        const appName = (process.env.NEXT_PUBLIC_APP_NAME || "Labveil").toLowerCase();
        finalZipFilename = `${appName}-assets-${timestamp}.zip`;
    }

    downloadBlob(zipBlob, finalZipFilename);
}
