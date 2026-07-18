import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PrimeSearch from "./PrimeSearch";

// 1. Mock the raw JSON data
vi.mock("../utils/dataValidation", () => ({
  validatedItemData: {
    "Ash Prime": {},
    "Braton Prime": {},
    "Trinity Prime": {},
  },
}));

describe("PrimeSearch Component", () => {
  const mockOnAddItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search input and button", () => {
    render(<PrimeSearch onAddItem={mockOnAddItem} />);
    expect(
      screen.getByPlaceholderText(/Search Prime Items/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Item/i }),
    ).toBeInTheDocument();
  });

  it("shows suggestions when typing a valid substring", async () => {
    const user = userEvent.setup();
    render(<PrimeSearch onAddItem={mockOnAddItem} />);

    const input = screen.getByPlaceholderText(/Search Prime Items/i);
    await user.type(input, "Pri");

    expect(screen.getByText("Ash Prime")).toBeInTheDocument();
    expect(screen.getByText("Braton Prime")).toBeInTheDocument();
    expect(screen.getByText("Trinity Prime")).toBeInTheDocument();
  });

  it("shows an error when trying to add an item not in the database", async () => {
    const user = userEvent.setup();
    render(<PrimeSearch onAddItem={mockOnAddItem} />);

    const input = screen.getByPlaceholderText(/Search Prime Items/i);
    const button = screen.getByRole("button", { name: /Add Item/i });

    await user.type(input, "Excalibur Prime");
    await user.click(button);

    expect(screen.getByText(/not found in the database/i)).toBeInTheDocument();
    expect(mockOnAddItem).not.toHaveBeenCalled();
  });

  it("calls onAddItem and clears input when a valid item is added", async () => {
    const user = userEvent.setup();
    render(<PrimeSearch onAddItem={mockOnAddItem} />);

    const input = screen.getByPlaceholderText(/Search Prime Items/i);
    const button = screen.getByRole("button", { name: /Add Item/i });

    await user.type(input, "Trinity Prime");
    await user.click(button);

    expect(mockOnAddItem).toHaveBeenCalledWith("Trinity Prime");
    expect(input).toHaveValue("");
    expect(
      screen.queryByText(/not found in the database/i),
    ).not.toBeInTheDocument();
  });
});
