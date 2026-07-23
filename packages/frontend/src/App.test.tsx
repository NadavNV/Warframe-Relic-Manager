import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import App from "./App";

// Mock child components to isolate App's state logic
vi.mock("./components/PrimeSearch", () => ({
  default: ({ onAddItem }: { onAddItem: (item: string) => void }) => (
    <button onClick={() => onAddItem("Mocked Prime")}>Mock Add Item</button>
  ),
}));

vi.mock("./components/DynamicRelicTables", () => ({
  default: () => <div data-testid="dynamic-tables" />,
}));

vi.mock("./components/RelicInventoryManager", () => ({
  default: ({ onTogglePin }: { onTogglePin: (relic: string) => void }) => (
    <div data-testid="relic-manager">
      <button onClick={() => onTogglePin("Mocked Relic")}>
        Mock Toggle Pin
      </button>
    </div>
  ),
}));

describe("App Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    // Bypass window.confirm for our tests, always returning true
    window.confirm = vi.fn(() => true);
  });

  it("initializes with empty state if localStorage is empty", () => {
    render(<App />);
    expect(screen.getByText("Warframe Relic Tracker")).toBeInTheDocument();

    // Clear buttons should NOT be visible initially
    expect(screen.queryByText("CLEAR ITEMS")).not.toBeInTheDocument();
    expect(screen.queryByText("CLEAR RELIC INVENTORY")).not.toBeInTheDocument();
  });

  it("loads desiredItems from localStorage on mount", () => {
    const mockItems = [{ id: "123", itemName: "Trinity Prime" }];
    localStorage.setItem("warframe_desiredItems", JSON.stringify(mockItems));

    render(<App />);

    // Because items exist, the CLEAR ITEMS button should appear
    expect(screen.getByText("CLEAR ITEMS")).toBeInTheDocument();
  });

  it("adds an item and updates localStorage", async () => {
    const user = userEvent.setup();
    render(<App />);

    const addButton = screen.getByText("Mock Add Item");
    await user.click(addButton);

    // Wait for the state to update and CLEAR ITEMS to appear
    expect(screen.getByText("CLEAR ITEMS")).toBeInTheDocument();

    // Check localStorage
    const saved = JSON.parse(
      localStorage.getItem("warframe_desiredItems") || "[]",
    );
    expect(saved).toHaveLength(1);
    expect(saved[0].itemName).toBe("Mocked Prime");
  });

  it("clears items when the clear button is clicked", async () => {
    const mockItems = [{ id: "123", itemName: "Trinity Prime" }];
    localStorage.setItem("warframe_desiredItems", JSON.stringify(mockItems));

    const user = userEvent.setup();
    render(<App />);

    const clearButton = screen.getByText("CLEAR ITEMS");
    await user.click(clearButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(screen.queryByText("CLEAR ITEMS")).not.toBeInTheDocument();

    const saved = JSON.parse(
      localStorage.getItem("warframe_desiredItems") || "[]",
    );
    expect(saved).toHaveLength(0);
  });

  it("loads pinnedRelics from localStorage and updates when toggled", async () => {
    // Setup initial local storage
    localStorage.setItem(
      "warframe_pinnedRelics",
      JSON.stringify(["Existing Pinned Relic"]),
    );

    const user = userEvent.setup();
    render(<App />);

    const pinButton = screen.getByText("Mock Toggle Pin");
    await user.click(pinButton);

    // Check localStorage to see if the new relic was added and the old one was kept
    const saved = JSON.parse(
      localStorage.getItem("warframe_pinnedRelics") || "[]",
    );
    expect(saved).toContain("Existing Pinned Relic");
    expect(saved).toContain("Mocked Relic");
    expect(saved).toHaveLength(2);
  });
});
