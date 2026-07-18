import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DynamicRelicTables from "./DynamicRelicTables";

// 1. Mock the raw JSON data to isolate the component
vi.mock("../utils/dataValidation", () => ({
  validatedItemData: {
    "Test Prime": {
      Blueprint: { count: 1, relics: ["Lith T1"] },
      Systems: { count: 2, relics: ["Meso T2"] },
    },
  },
  validatedRelicData: {
    "Lith T1": { common: ["Test Prime Blueprint"] },
    "Meso T2": { rare: ["Test Prime Systems"] },
  },
}));

describe("DynamicRelicTables Component", () => {
  const mockOnRemoveItem = vi.fn();
  const mockOnToggleCell = vi.fn();

  const defaultProps = {
    desiredItems: [{ id: "item-1", itemName: "Test Prime" }],
    onRemoveItem: mockOnRemoveItem,
    relicInventory: { "Lith T1": 5, "Meso T2": 0 },
    completedCells: new Set<string>(),
    onToggleCell: mockOnToggleCell,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the tip, item header, and component rows", () => {
    render(<DynamicRelicTables {...defaultProps} />);

    // Check for the tip text
    expect(
      screen.getByText(/Click an item's column header to remove it/i),
    ).toBeInTheDocument();

    // Check for headers and row labels
    expect(screen.getByText("Test Prime")).toBeInTheDocument();
    expect(screen.getByText("Blueprint")).toBeInTheDocument();
    expect(screen.getByText("Systems #1")).toBeInTheDocument();
    expect(screen.getByText("Systems #2")).toBeInTheDocument();
  });

  it("displays correct relic counts and handles cell clicks", async () => {
    const user = userEvent.setup();
    render(<DynamicRelicTables {...defaultProps} />);

    // Blueprint should show the Lith T1 relic with 5 inventory
    const blueprintCellText = screen.getByText("Lith T1 (5)");
    expect(blueprintCellText).toBeInTheDocument();

    await user.click(blueprintCellText);

    // Cell ID format: [itemId]__[componentName]-[instanceNumber]
    expect(mockOnToggleCell).toHaveBeenCalledWith("item-1__Blueprint-1");
  });

  it("calls onRemoveItem when clicking an item header", async () => {
    const user = userEvent.setup();
    render(<DynamicRelicTables {...defaultProps} />);

    const header = screen.getByText("Test Prime");
    await user.click(header);

    expect(mockOnRemoveItem).toHaveBeenCalledWith("item-1");
  });

  it("renders a checkmark for completed cells", () => {
    const completedProps = {
      ...defaultProps,
      completedCells: new Set(["item-1__Blueprint-1"]),
    };

    render(<DynamicRelicTables {...completedProps} />);

    // The checkmark should appear, and the relic text for that specific cell should be hidden
    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.queryByText("Lith T1 (5)")).not.toBeInTheDocument();
  });
});
