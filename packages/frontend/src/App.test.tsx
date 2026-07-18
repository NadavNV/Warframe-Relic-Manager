// src/App.test.tsx
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
  default: () => <div data-testid="relic-manager" />,
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
});
