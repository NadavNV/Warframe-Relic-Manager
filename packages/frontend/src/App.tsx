import { useState, useEffect } from "react";
import DynamicRelicTables from "./components/DynamicRelicTables";
import type DesiredItem from "./types/DesiredItem";
import PrimeSearch from "./components/PrimeSearch";
import RelicInventoryManager from "./components/RelicInventoryManager";
import Footer from "./components/Footer";

export default function App() {
  const [desiredItems, setDesiredItems] = useState<DesiredItem[]>(() => {
    const saved = localStorage.getItem("warframe_desiredItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [completedCells, setCompletedCells] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("warframe_completedCells");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [relicInventory, setRelicInventory] = useState<Record<string, number>>(
    () => {
      const saved = localStorage.getItem("warframe_relicInventory");
      return saved ? JSON.parse(saved) : {};
    },
  );

  useEffect(() => {
    localStorage.setItem("warframe_desiredItems", JSON.stringify(desiredItems));
  }, [desiredItems]);

  useEffect(() => {
    localStorage.setItem(
      "warframe_completedCells",
      JSON.stringify(Array.from(completedCells)),
    );
  }, [completedCells]);

  useEffect(() => {
    localStorage.setItem(
      "warframe_relicInventory",
      JSON.stringify(relicInventory),
    );
  }, [relicInventory]);

  // --- EVENT HANDLERS ---

  const handleAddItem = (itemName: string) => {
    const newItem: DesiredItem = { id: crypto.randomUUID(), itemName };
    setDesiredItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setDesiredItems((prevItems) => prevItems.filter((item) => item.id !== id));
    setCompletedCells((prevCells) => {
      const nextCells = new Set(prevCells);
      for (const cellId of nextCells) {
        if (cellId.startsWith(`${id}__`)) nextCells.delete(cellId);
      }
      return nextCells;
    });
  };

  const handleToggleCell = (cellId: string) => {
    setCompletedCells((prevCells) => {
      const nextCells = new Set(prevCells);
      if (nextCells.has(cellId)) nextCells.delete(cellId);
      else nextCells.add(cellId);
      return nextCells;
    });
  };

  const handleUpdateRelicCount = (relic: string, count: number) => {
    setRelicInventory((prev) => {
      const nextInventory = { ...prev };

      if (count === 0) {
        // Prune the key completely if the count is 0
        delete nextInventory[relic];
      } else {
        // Otherwise, update as normal
        nextInventory[relic] = count;
      }

      return nextInventory;
    });
  };

  const handleClearItems = () => {
    if (window.confirm("Are you sure you want to remove all tracked items?")) {
      setDesiredItems([]);
      setCompletedCells(new Set());
      // Notice we DO NOT clear relicInventory here!
    }
  };

  const handleResetRelicCounts = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all your owned relic counts to 0?",
      )
    ) {
      // An empty object acts as 0 for all relics thanks to our fallback ?? 0
      setRelicInventory({});
    }
  };

  return (
    <div className="min-h-screen bg-void-dark p-8 relative">
      <div className="flex flex-col items-center justify-center relative mb-8">
        <h1 className="text-3xl text-orokin-gold font-bold text-center uppercase tracking-widest mt-4 md:mt-0">
          Warframe Relic Tracker
        </h1>

        <div className="md:absolute right-0 top-0 flex gap-3 mt-6 md:mt-0">
          {Object.keys(relicInventory).length > 0 && (
            <button
              onClick={handleResetRelicCounts}
              className="px-3 py-1.5 bg-[#8B6508]/20 text-orokin-gold border border-[#8B6508] rounded hover:bg-[#8B6508]/40 transition-colors text-xs font-bold tracking-wide cursor-pointer"
            >
              CLEAR RELIC INVENTORY
            </button>
          )}

          {desiredItems.length > 0 && (
            <button
              onClick={handleClearItems}
              className="px-3 py-1.5 bg-red-900/30 text-red-400 border border-red-900 rounded hover:bg-red-900/60 transition-colors text-xs font-bold tracking-wide cursor-pointer"
            >
              CLEAR ITEMS
            </button>
          )}
        </div>
      </div>

      <PrimeSearch onAddItem={handleAddItem} />

      <DynamicRelicTables
        desiredItems={desiredItems}
        onRemoveItem={handleRemoveItem}
        relicInventory={relicInventory}
        completedCells={completedCells}
        onToggleCell={handleToggleCell}
      />

      <RelicInventoryManager
        relicInventory={relicInventory}
        onUpdateRelicCount={handleUpdateRelicCount}
        desiredItems={desiredItems}
        completedCells={completedCells}
      />
      <Footer />
    </div>
  );
}
