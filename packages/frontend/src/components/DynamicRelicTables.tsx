import { validatedItemData } from "../utils/dataValidation";
import { validatedRelicData } from "../utils/dataValidation";
import type ComponentInstance from "../types/ComponentInstance";
import type ItemInstance from "../types/ItemInstance";
import type DesiredItem from "../types/DesiredItem";

const itemData = validatedItemData;
const relicData = validatedRelicData;

interface DynamicTableProps {
  desiredItems: DesiredItem[];
  onRemoveItem: (id: string) => void;
  relicInventory: Record<string, number>;
  completedCells: Set<string>;
  onToggleCell: (cellId: string) => void;
}

interface GroupedItemSchema {
  components: ComponentInstance[];
  items: ItemInstance[];
}

const getComponentSchema = (itemName: string): ComponentInstance[] => {
  const components = itemData[itemName] || {};

  return Object.entries(components)
    .flatMap(([componentName, componentData]) => {
      if (componentData.count === 1) {
        return [
          {
            componentName,
            displayName: componentName,
          },
        ];
      }

      return Array.from({ length: componentData.count }, (_, index) => ({
        componentName,
        displayName: `${componentName} #${index + 1}`,
        instanceNumber: index + 1,
      }));
    })
    .sort((a, b) => a.componentName.localeCompare(b.componentName));
};

const getSchemaKey = (schema: ComponentInstance[]): string => {
  return schema.map((component) => component.displayName).join("|");
};

const getRarityClass = (relicName: string, componentName: string): string => {
  const schema = relicData[relicName];
  if (!schema) return "text-gray-400";

  if (schema.common?.includes(componentName)) {
    return "text-[#CD7F32]";
  }
  if (schema.uncommon?.includes(componentName)) {
    return "text-[#C0C0C0]";
  }
  if (schema.rare?.includes(componentName)) {
    return "text-[#FFD700]";
  }

  return "text-gray-400";
};

const getRelicColumns = (relics: string[], itemsPerColumn = 8): string[][] => {
  return Array.from(
    { length: Math.ceil(relics.length / itemsPerColumn) },
    (_, index) =>
      relics.slice(index * itemsPerColumn, (index + 1) * itemsPerColumn),
  );
};

const getCellId = (
  item: ItemInstance,
  component: ComponentInstance,
): string => {
  const componentId = `${component.componentName}-${component.instanceNumber ?? 1}`;
  return `${item.id}__${componentId}`;
};

export default function DynamicRelicTables({
  desiredItems,
  onRemoveItem,
  relicInventory,
  completedCells,
  onToggleCell,
}: DynamicTableProps) {
  const totalItemCounts = desiredItems.reduce(
    (acc, item) => {
      acc[item.itemName] = (acc[item.itemName] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const currentItemCounts: Record<string, number> = {};

  const groupedItems = desiredItems.reduce(
    (acc, desiredItem) => {
      const itemName = desiredItem.itemName;
      const totalCount = totalItemCounts[itemName];
      const instanceNumber = (currentItemCounts[itemName] ?? 0) + 1;

      currentItemCounts[itemName] = instanceNumber;

      const item: ItemInstance = {
        id: desiredItem.id,
        itemName,
        displayName:
          totalCount > 1 ? `${itemName} #${instanceNumber}` : itemName,
        instanceNumber: totalCount > 1 ? instanceNumber : undefined,
      };

      const componentSchema = getComponentSchema(itemName);
      const schemaKey = getSchemaKey(componentSchema);

      if (!acc[schemaKey]) {
        acc[schemaKey] = { components: componentSchema, items: [] };
      }

      acc[schemaKey].items.push(item);
      return acc;
    },
    {} as Record<string, GroupedItemSchema>,
  );

  return (
    <div className="space-y-12">
      {Object.keys(groupedItems).length > 0 && (
        <p className="text-gray-400 italic text-sm text-center mb-6">
          <span className="font-bold text-orokin-gold">Tip:</span> Click an
          item's column header to remove it. Click a table cell to mark a
          component as complete.
        </p>
      )}

      {Object.entries(groupedItems).map(([schemaKey, group]) => {
        const { components, items } = group;

        return (
          // Mobile scroll wrapper
          <div
            key={schemaKey}
            className="overflow-x-auto pb-4 custom-scrollbar rounded-lg"
          >
            <table className="w-full sm:w-max table-auto text-left border-collapse border border-gray-800">
              <thead>
                <tr>
                  {/* Sticky Header */}
                  <th className="sticky left-0 z-10 p-4 border border-gray-800 bg-orokin-dark text-white shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                    Component
                  </th>

                  {items.map((item) => (
                    <th
                      key={item.displayName}
                      onClick={() => onRemoveItem(item.id)}
                      className="p-4 border border-gray-800 bg-void-dark text-white cursor-pointer transition-colors hover:bg-gray-800"
                    >
                      {item.displayName}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {components.map((component) => (
                  <tr key={component.displayName}>
                    {/* Sticky Row Title */}
                    <td className="sticky left-0 z-10 p-4 border border-gray-800 bg-void-dark text-white font-bold shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                      {component.displayName}
                    </td>

                    {items.map((item) => {
                      const cellId = getCellId(item, component);
                      const isCompleted = completedCells.has(cellId);
                      const componentData =
                        itemData[item.itemName]?.[component.componentName];
                      const rawRelicList = componentData?.relics ?? [];

                      // Sort by inventory count (descending), falling back to alphabetical order
                      const relicList = [...rawRelicList].sort((a, b) => {
                        const countDiff =
                          (relicInventory[b] ?? 0) - (relicInventory[a] ?? 0);
                        return countDiff !== 0 ? countDiff : a.localeCompare(b);
                      });

                      return (
                        <td
                          key={cellId}
                          onClick={() => onToggleCell(cellId)}
                          className={`p-2 border border-gray-800 text-base cursor-pointer transition-colors ${
                            isCompleted
                              ? "bg-[#90EE90]"
                              : "hover:bg-gray-800/50"
                          }`}
                        >
                          {isCompleted ? (
                            <span className="flex items-center justify-center text-2xl font-bold text-[#006400]">
                              ✓
                            </span>
                          ) : (
                            <div className="flex">
                              {getRelicColumns(relicList).map(
                                (column, columnIndex) => (
                                  <div
                                    key={columnIndex}
                                    className="flex flex-col"
                                  >
                                    {column.map((relic) => (
                                      <span
                                        key={relic}
                                        className={`block whitespace-nowrap px-1.5 font-medium tracking-wide ${getRarityClass(
                                          relic,
                                          `${item.itemName} ${component.componentName}`,
                                        )}`}
                                      >
                                        {relic +
                                          ` (${relicInventory[relic] ?? 0})`}
                                      </span>
                                    ))}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
