import { describe, it, expect, vi } from "vitest";
import { getTrashMenuItems } from "../trashMenuConfig";

describe("trashMenuConfig", () => {
  it("builds restore and delete permanently menu items", () => {
    const onRestore = vi.fn();
    const onDeletePermanently = vi.fn();

    const items = getTrashMenuItems({ onRestore, onDeletePermanently, isRestoring: false });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      key: "restore",
      label: "Restaurer",
      icon: "restore_from_trash",
      disabled: false,
    });
    expect(items[1]).toMatchObject({
      key: "delete_permanently",
      label: "Supprimer définitivement",
      icon: "delete_forever",
      variant: "destructive",
    });

    items[0].onClick();
    expect(onRestore).toHaveBeenCalledTimes(1);

    items[1].onClick();
    expect(onDeletePermanently).toHaveBeenCalledTimes(1);
  });

  it("disables restore item when isRestoring is true", () => {
    const items = getTrashMenuItems({
      onRestore: vi.fn(),
      onDeletePermanently: vi.fn(),
      isRestoring: true,
    });

    expect(items[0].disabled).toBe(true);
  });
});
