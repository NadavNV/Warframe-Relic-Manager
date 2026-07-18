import { useState, type ChangeEvent } from "react";
import { validatedItemData } from "../utils/dataValidation";
import { validatedRelicData } from "../utils/dataValidation";
import type DesiredItem from "../types/DesiredItem";

const itemData = validatedItemData;
const relicData = validatedRelicData;

interface RelicInventoryProps {
  relicInventory: Record<string, number>;
  onUpdateRelicCount: (relic: string, count: number) => void;
  desiredItems: DesiredItem[];
  completedCells: Set<string>;
}

interface TrackedReward {
  name: string;
  rarity: string;
}

type SortOption = "name" | "owned" | "rewards";
type EraOption = "Lith" | "Meso" | "Neo" | "Axi" | "Vanguard";

const allEras: EraOption[] = ["Lith", "Meso", "Neo", "Axi", "Vanguard"];

export default function RelicInventoryManager({
  relicInventory,
  onUpdateRelicCount,
  desiredItems,
  completedCells,
}: RelicInventoryProps) {
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [activeEras, setActiveEras] = useState<Set<EraOption>>(
    new Set(allEras),
  );

  const rewardsByRelic: Record<string, Map<string, TrackedReward>> = {};

  desiredItems.forEach((item) => {
    const components = itemData[item.itemName] || {};

    Object.entries(components).forEach(([compName, compData]) => {
      let isNeeded = false;

      for (let i = 0; i < (compData.count || 1); i++) {
        const cellId = `${item.id}__${compName}-${i + 1}`;
        if (!completedCells.has(cellId)) {
          isNeeded = true;
          break;
        }
      }

      if (isNeeded) {
        (compData.relics || []).forEach((relic) => {
          // Initialize map for this relic dynamically if it doesn't exist yet
          if (!rewardsByRelic[relic]) {
            rewardsByRelic[relic] = new Map();
          }

          const rewardName = `${item.itemName} ${compName}`;

          if (!rewardsByRelic[relic].has(rewardName)) {
            let currentRarity = "Unknown";
            const specificRelicData = relicData[relic];

            if (specificRelicData) {
              if (specificRelicData.common?.includes(rewardName)) {
                currentRarity = "Common";
              } else if (specificRelicData.uncommon?.includes(rewardName)) {
                currentRarity = "Uncommon";
              } else if (specificRelicData.rare?.includes(rewardName)) {
                currentRarity = "Rare";
              }
            }

            rewardsByRelic[relic].set(rewardName, {
              name: rewardName,
              rarity: currentRarity,
            });
          }
        });
      }
    });
  });

  const getRarityColor = (rarity: string) => {
    if (rarity === "Common") return "text-[#CD7F32]";
    if (rarity === "Uncommon") return "text-[#C0C0C0]";
    if (rarity === "Rare") return "text-[#FFD700]";
    return "text-gray-400";
  };

  const toggleEra = (era: EraOption) => {
    setActiveEras((prev) => {
      const next = new Set(prev);
      if (next.has(era)) next.delete(era);
      else next.add(era);
      return next;
    });
  };

  const filteredAndSortedRelics = Object.keys(rewardsByRelic)
    .filter((relic) => {
      return Array.from(activeEras).some((era) => relic.startsWith(era));
    })
    .sort((a, b) => {
      if (sortBy === "owned") {
        const countA = relicInventory[a] || 0;
        const countB = relicInventory[b] || 0;
        const diff = countB - countA;
        return diff !== 0 ? diff : a.localeCompare(b);
      }
      if (sortBy === "rewards") {
        const diff = rewardsByRelic[b].size - rewardsByRelic[a].size;
        return diff !== 0 ? diff : a.localeCompare(b);
      }
      return a.localeCompare(b);
    });

  // Hide the entire UI block if no items are currently being tracked
  if (Object.keys(rewardsByRelic).length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-12 p-6 rounded-lg outline-1 outline-gray-800 bg-void-dark/50 shadow-xl shadow-orokin-dark">
      <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-800 mb-6 pb-4 gap-4">
        <h2 className="text-xl font-bold text-orokin-gold uppercase tracking-widest m-0 mt-1">
          Relic Inventory
        </h2>

        {/* Controls Container */}
        <div className="flex flex-col gap-3">
          {/* Sorting Controls */}
          <div className="flex flex-wrap items-center gap-2 text-sm font-sans md:justify-end">
            <span className="text-gray-400 mr-2 uppercase tracking-wider font-bold text-xs">
              Sort By:
            </span>

            <button
              onClick={() => setSortBy("name")}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                sortBy === "name"
                  ? "bg-orokin-gold text-orokin-dark font-bold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Name
            </button>

            <button
              onClick={() => setSortBy("owned")}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                sortBy === "owned"
                  ? "bg-orokin-gold text-orokin-dark font-bold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Most Owned
            </button>

            <button
              onClick={() => setSortBy("rewards")}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                sortBy === "rewards"
                  ? "bg-orokin-gold text-orokin-dark font-bold"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Tracked Rewards
            </button>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-2 text-sm font-sans md:justify-end">
            <span className="text-gray-400 mr-2 uppercase tracking-wider font-bold text-xs">
              Era:
            </span>

            {allEras.map((era) => (
              <button
                key={era}
                onClick={() => toggleEra(era)}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                  activeEras.has(era)
                    ? "bg-void-blue text-void-dark font-bold"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {era}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="hidden sm:flex items-center py-2 border-b-2 border-gray-700 mb-2 text-xs text-gray-400 font-bold uppercase tracking-wider gap-4">
        <div className="w-32 shrink-0 pl-1">Relic</div>
        <div className="w-40 shrink-0 text-center">Owned</div>
        <div className="flex-1 ml-4">Tracked Rewards</div>
      </div>

      <div className="flex flex-col">
        {filteredAndSortedRelics.length === 0 ? (
          <div className="py-8 text-center text-gray-500 italic">
            No tracked relics found for the selected eras.
          </div>
        ) : (
          filteredAndSortedRelics.map((relic) => {
            const count = relicInventory[relic];
            const rewards = Array.from(rewardsByRelic[relic].values());

            return (
              <div
                key={relic}
                className="flex flex-col sm:flex-row items-start sm:items-center py-4 border-b border-gray-800 last:border-0 gap-4"
              >
                <div className="w-32 shrink-0 font-bold text-gray-200 tracking-wide">
                  {relic}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      onUpdateRelicCount(relic, Math.max(0, count - 1))
                    }
                    className="w-10 h-10 flex items-center justify-center bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    value={count}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateRelicCount(
                        relic,
                        isNaN(val) ? 0 : Math.max(0, val),
                      );
                    }}
                    className="w-16 h-10 text-center bg-void-dark border border-gray-600 rounded text-white focus:outline-hidden focus:border-orokin-gold"
                  />
                  <button
                    onClick={() => onUpdateRelicCount(relic, count + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-800 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 flex-1 ml-0 sm:ml-4">
                  {rewards.map((reward) => (
                    <span
                      key={reward.name}
                      className={`px-3 py-1 bg-gray-900/80 outline-1 outline-gray-700 rounded text-sm tracking-wide shadow-sm font-medium ${getRarityColor(reward.rarity)}`}
                    >
                      {reward.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
