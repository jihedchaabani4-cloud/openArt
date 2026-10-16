import { describe, it, expect } from "vitest";
import { getPrimaryMedia } from "../displayUtils";

describe("Characterization: Current Primary Media Resolution Behavior", () => {
  describe("Element cover resolution in displayUtils", () => {
    it("CHARACTERIZATION [BUG]: element cover uses string character hash modulo, ignoring primary_media_id", () => {
      const elementWorkflow = {
        id: "element-alpha",
        workflow_type: "ELEMENT_SHEET",
        primary_media_id: "elem-media-2",
        metadata: {
          primaryMediaId: "elem-media-2",
        },
        items: [
          { id: "elem-media-0", url: "https://example.com/item0.png", status: "success" },
          { id: "elem-media-1", url: "https://example.com/item1.png", status: "success" },
          { id: "elem-media-2", url: "https://example.com/item2.png", status: "success" },
        ],
      };

      // Hash of "element-alpha":
      // 'e'(101)+'l'(108)+'e'(101)+'m'(109)+'e'(101)+'n'(110)+'t'(116)+'-'(45)+'a'(97)+'l'(108)+'p'(112)+'h'(104)+'a'(97) = 1309
      // 1309 % 3 = 1 -> picks item[1] ("elem-media-1"), IGNORING primary_media_id ("elem-media-2")
      const result = getPrimaryMedia(elementWorkflow);

      expect(result.id).toBe("elem-media-1");
      expect(result.id).not.toBe(elementWorkflow.primary_media_id);
    });
  });

  describe("Character primary media in displayUtils", () => {
    it("returns detail media if primary_media_id explicitly points to it", () => {
      const charWorkflow = {
        id: "char-wf-1",
        workflow_type: "CHARACTER",
        primary_media_id: "detail-photo-9",
        metadata: {
          primaryMediaId: "detail-photo-9",
        },
        items: [
          {
            id: "turnaround-sheet",
            url: "https://example.com/sheet.png",
            step_id: "character_sheet",
            role: "sheet",
          },
          {
            id: "detail-photo-9",
            url: "https://example.com/detail.png",
            step_id: "character_detail",
            role: "detail",
          },
        ],
      };

      const result = getPrimaryMedia(charWorkflow);
      // In displayUtils: lines 328-333 checks primaryId first without checking step_id != 'character_detail'
      expect(result.id).toBe("detail-photo-9");
    });

    it("prioritizes turnaround sheet over detail photos when no primary_media_id is set", () => {
      const charWorkflow = {
        id: "char-wf-2",
        workflow_type: "CHARACTER",
        items: [
          {
            id: "detail-photo-1",
            url: "https://example.com/detail1.png",
            step_id: "character_detail",
          },
          {
            id: "sheet-turnaround-1",
            url: "https://example.com/sheet1.png",
            step_id: "character_sheet",
          },
        ],
      };

      const result = getPrimaryMedia(charWorkflow);
      expect(result.id).toBe("sheet-turnaround-1");
    });
  });

  describe("General fallbacks", () => {
    it("falls back to items[0] for standard workflows without primary_media_id", () => {
      const genericWorkflow = {
        id: "gen-wf-1",
        workflow_type: "GENERATION",
        items: [
          { id: "gen-0", url: "https://example.com/0.png", status: "completed" },
          { id: "gen-1", url: "https://example.com/1.png", status: "completed" },
        ],
      };

      const result = getPrimaryMedia(genericWorkflow);
      expect(result.id).toBe("gen-0");
    });

    it("returns placeholder item for workflows with zero items", () => {
      const emptyWorkflow = {
        id: "empty-wf-1",
        workflow_type: "GENERATION",
        items: [],
      };

      const result = getPrimaryMedia(emptyWorkflow);
      expect(result.id).toBe("empty-wf-1");
    });
  });
});
