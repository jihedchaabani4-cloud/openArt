import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserDropdown } from "../UserDropdown";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock auth APIs
const mockAuthSession = vi.fn();
const mockWalletBalance = vi.fn();
vi.mock("@/shared/api/auth", () => ({
  useAuthSession: () => mockAuthSession(),
  useWalletBalance: () => mockWalletBalance(),
}));

// Mock API client
const mockApiPost = vi.fn();
vi.mock("@/shared/api/client", () => ({
  api: {
    post: (...args) => mockApiPost(...args),
  },
}));

// Mock child dialogs
vi.mock("@/components/LoginDialog", () => ({
  LoginDialog: ({ open }) => (open ? <div data-testid="login-dialog">Login Dialog</div> : null),
}));

vi.mock("@/features/payments/ui/PackageSelectionDialog", () => ({
  PackageSelectionDialog: ({ open }) => (open ? <div data-testid="pricing-dialog">Pricing Dialog</div> : null),
}));

function renderWithQueryClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("UserDropdown Widget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a loading skeleton when auth is loading", () => {
    mockAuthSession.mockReturnValue({ data: null, isLoading: true });
    mockWalletBalance.mockReturnValue({ data: 0 });

    const { container } = renderWithQueryClient(<UserDropdown />);
    expect(container.querySelector(".animate-pulse")).toBeDefined();
  });

  it("renders a Login button when unauthenticated and opens LoginDialog on click", () => {
    mockAuthSession.mockReturnValue({ data: null, isLoading: false });
    mockWalletBalance.mockReturnValue({ data: 0 });

    renderWithQueryClient(<UserDropdown />);
    const loginBtn = screen.getByRole("button", { name: "Login" });
    expect(loginBtn).toBeDefined();

    expect(screen.queryByTestId("login-dialog")).toBeNull();
    fireEvent.click(loginBtn);
    expect(screen.getByTestId("login-dialog")).toBeDefined();
  });

  it("renders user avatar and initials when authenticated", () => {
    mockAuthSession.mockReturnValue({
      data: { name: "Alice Walker", email: "alice@example.com" },
      isLoading: false,
    });
    mockWalletBalance.mockReturnValue({ data: 120 });

    renderWithQueryClient(<UserDropdown />);
    const avatarTrigger = screen.getByRole("button", { name: "Open user menu" });
    expect(avatarTrigger).toBeDefined();
    expect(screen.getByText("AW")).toBeDefined();
  });

  it("supports className prop on trigger button", () => {
    mockAuthSession.mockReturnValue({
      data: { name: "Bob Martin", email: "bob@example.com" },
      isLoading: false,
    });
    mockWalletBalance.mockReturnValue({ data: 250 });

    renderWithQueryClient(<UserDropdown className="custom-user-class" />);
    const avatarTrigger = screen.getByRole("button", { name: "Open user menu" });
    expect(avatarTrigger.className).toContain("custom-user-class");
  });
});
