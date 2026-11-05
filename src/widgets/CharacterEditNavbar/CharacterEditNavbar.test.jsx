import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CharacterEditNavbar } from "./CharacterEditNavbar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "proj-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
}

describe("CharacterEditNavbar", () => {
  it("renders a unified dropdown for upload and project assets with both menu items matching ElementEditNavbar", () => {
    const onUpload = vi.fn();
    const onOpenAssets = vi.fn();

    renderWithClient(
      <CharacterEditNavbar
        onUpload={onUpload}
        onOpenAssets={onOpenAssets}
        importMenuOpen={true}
      />
    );

    // Dropdown trigger is rendered as a simple icon-only '+' button without text or bg
    const trigger = screen.getByTestId("import-dropdown-trigger");
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toBe("add");
    expect(trigger.textContent).not.toContain("Importer");
    expect(trigger.className).toContain("bg-transparent");

    // Both options are in the dropdown menu
    const uploadItem = screen.getByText("Importer depuis l'ordinateur");
    const assetsItem = screen.getByText("Depuis le projet");
    expect(uploadItem).toBeDefined();
    expect(assetsItem).toBeDefined();

    // Verify standardized width and compact item sizing
    const menuContent = uploadItem.closest('[data-slot="dropdown-menu-content"]');
    expect(menuContent.className).toContain("w-52");

    const uploadMenuItem = uploadItem.closest('[data-slot="dropdown-menu-item"]');
    expect(uploadMenuItem.className).toContain("min-h-[2.125rem]");
    expect(uploadMenuItem.className).toContain("rounded-sm");
    expect(uploadMenuItem.className).toContain("text-[14px]");

    // Clicking options triggers callbacks
    fireEvent.click(uploadItem);
    expect(onUpload).toHaveBeenCalledTimes(1);

    fireEvent.click(assetsItem);
    expect(onOpenAssets).toHaveBeenCalledTimes(1);
  });

  it("renders favorite toggle button when onToggleLike is provided", () => {
    const onToggleLike = vi.fn();
    renderWithClient(
      <CharacterEditNavbar
        onToggleLike={onToggleLike}
        isLiked={true}
      />
    );

    const likeBtn = screen.getByTestId("like-character-button");
    expect(likeBtn).toBeDefined();
    fireEvent.click(likeBtn);
    expect(onToggleLike).toHaveBeenCalledTimes(1);
  });
});
