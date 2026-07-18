import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { validatedItemData } from "../utils/dataValidation";

// Extract the top-level keys (the prime items) from the JSON[cite: 1]
const primeItems: string[] = Object.keys(validatedItemData);

interface PrimeSearchProps {
  onAddItem: (itemName: string) => void;
}

export default function PrimeSearch({ onAddItem }: PrimeSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // New state for handling validation errors
  const [error, setError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear any previous errors as soon as the user starts typing again
    if (error) setError(null);

    if (value.trim().length > 0) {
      const filtered = primeItems.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (item: string) => {
    setInputValue(item);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  const handleAddItem = () => {
    const trimmedInput = inputValue.trim();

    // 1. Instantly hide and clear the suggestion box
    setSuggestions([]);
    setShowSuggestions(false);

    if (trimmedInput === "") return;

    // 2. Validate the item (case-insensitive check against your JSON keys)
    const matchedItem = primeItems.find(
      (item) => item.toLowerCase() === trimmedInput.toLowerCase(),
    );

    if (!matchedItem) {
      // 3. Pop an error if the item doesn't exist in the codex
      setError(`Item "${trimmedInput}" not found in the database.`);
      return;
    }

    // 4. Add the successfully validated item
    onAddItem(matchedItem);

    // Reset the input field
    setInputValue("");
    setError(null);
  };

  // Close the dropdown if the user clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto my-16">
      <div
        ref={wrapperRef}
        className="relative w-full flex flex-col items-center"
      >
        <p className="text-gray-400 italic text-sm mb-3 text-center">
          Search for a Prime Warframe, Weapon, or Companion to begin tracking
          its relics.
        </p>

        <div className="flex w-full gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddItem();
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search Prime Items (e.g., Trinity)..."
            // FIX: Used placeholder:text-gray-500 and switched to ring utilities
            className="w-full px-4 py-3 bg-void-dark text-gray-200 placeholder:text-gray-500 font-sans tracking-wide
                       rounded-lg outline-hidden ring-1 ring-orokin-gold focus:ring-2 
                       shadow-lg shadow-orokin-dark
                       transition-all duration-200"
          />

          <button
            onClick={handleAddItem}
            className="shrink-0 px-6 py-3 bg-orokin-gold text-orokin-dark font-bold uppercase tracking-wider
                       rounded-lg shadow-lg shadow-orokin-dark hover:bg-yellow-400 active:scale-95 transition-all cursor-pointer"
          >
            Add Item
          </button>
        </div>

        {/* Validation Error Message */}
        {error && (
          <div className="w-full text-left mt-2 pl-2">
            <span className="text-red-400 text-sm font-bold tracking-wide">
              {error}
            </span>
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul
            className="absolute top-full left-0 right-0 mt-3 z-20 bg-void-dark outline-1 outline-gray-700 
                         rounded-lg overflow-hidden shadow-[0_4px_20px_var(--color-orokin-dark)] max-h-60 overflow-y-auto custom-scrollbar"
          >
            {suggestions.map((item) => (
              <li
                key={item}
                onClick={() => handleSelect(item)}
                className="px-4 py-3 cursor-pointer text-gray-300 border-b border-gray-800 last:border-0
                           hover:bg-gray-800 hover:text-orokin-gold transition-colors duration-150"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desired Items List Display */}
      {/* {desiredItems.length > 0 && (
        <div className="w-full mt-10 p-6 rounded-lg outline-1 outline-gray-800 bg-void-dark/50 shadow-xl shadow-orokin-dark">
          <h2 className="text-lg font-bold text-orokin-gold mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">
            Target Acquisitions
          </h2>
          <ul className="space-y-3">
            {desiredItems.map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-gray-200 font-sans"
              >
                <span className="w-2 h-2 bg-orokin-gold rotate-45 inline-block shadow-[0_0_5px_var(--color-orokin-gold)]"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
}
