import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RelicInventoryManager from "./RelicInventoryManager";

// 1. Mock the raw JSON data
vi.mock("../utils/dataValidation", () => ({
  validatedItemData: {
    "Test Prime": {
      Blueprint: { count: 1, relics: ["Lith T1"] },
    },
  },
  validatedRelicData: {
    "Lith T1": { common: ["Test Prime Blueprint"] },
  },
}));

describe("RelicInventoryManager Component", () => {
  const mockOnUpdateRelicCount = vi.fn();

  const defaultProps = {
    relicInventory: { "Lith T1": 2 },
    onUpdateRelicCount: mockOnUpdateRelicCount,
    desiredItems: [{ id: "item-1", itemName: "Test Prime" }],
    completedCells: new Set<string>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing if there are no desired items", () => {
    const { container } = render(
      <RelicInventoryManager {...defaultProps} desiredItems={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing if all tracked items are marked as completed", () => {
    const { container } = render(
      <RelicInventoryManager
        {...defaultProps}
        completedCells={new Set(["item-1__Blueprint-1"])}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the required relics and inventory inputs when tracking an item", () => {
    render(<RelicInventoryManager {...defaultProps} />);

    expect(screen.getByText("Relic Inventory")).toBeInTheDocument();
    expect(screen.getByText("Lith T1")).toBeInTheDocument();

    // The tracked reward should be displayed
    expect(screen.getByText("Test Prime Blueprint")).toBeInTheDocument();

    // The input should default to the inventory count
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("2");
  });

  it("calls onUpdateRelicCount when increment and decrement buttons are clicked", async () => {
    const user = userEvent.setup();
    render(<RelicInventoryManager {...defaultProps} />);

    const decrementBtn = screen.getByText("-");
    const incrementBtn = screen.getByText("+");

    // Click increment (+)
    await user.click(incrementBtn);
    expect(mockOnUpdateRelicCount).toHaveBeenCalledWith("Lith T1", 3);

    // Click decrement (-)
    await user.click(decrementBtn);
    expect(mockOnUpdateRelicCount).toHaveBeenCalledWith("Lith T1", 1);
  });

  it("calls onUpdateRelicCount when typing in the input field", async () => {
    const user = userEvent.setup();
    render(<RelicInventoryManager {...defaultProps} />);

    const input = screen.getByRole("textbox");

    // Because our mock function doesn't update the actual React state,
    // the input's DOM value stubbornly remains "2".
    // Typing "5" will append it, resulting in "25".
    await user.type(input, "5");

    // It should trigger the callback with the appended integer value
    expect(mockOnUpdateRelicCount).toHaveBeenCalledWith("Lith T1", 25);
  });
});
