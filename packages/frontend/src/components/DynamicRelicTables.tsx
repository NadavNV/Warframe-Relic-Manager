import { useState } from "react";
import itemDataRaw from "../../../../data/master_items.json";
import relicDataRaw from "../../../../data/relic_drops.json";
import type ItemSchema from "../types/ItemSchema";
import type ComponentInstance from "../types/ComponentInstance";
import type ItemInstance from "../types/ItemInstance";
import type DesiredItem from "../types/DesiredItem";
import type RelicSchema from "../types/RelicSchema";

// Cast the raw JSON to the explicit type
const itemData = itemDataRaw as Record<string, ItemSchema>;
const relicData = relicDataRaw as Record<string, RelicSchema>;

interface ItemTableProps {
  desiredItems: DesiredItem[];
  onRemoveItem: (itemName: string, instanceNumber?: number) => void;
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
  if (!schema) {
    // Fallback if relic isn't found
    return "bg-gray-100";
  }
  if (schema.common.includes(componentName)) {
    return "bg-[#CD7F32]";
  }
  if (schema.uncommon.includes(componentName)) {
    return "bg-[#808080]";
  }
  if (schema.rare.includes(componentName)) {
    return "bg-[#FFD700]";
  }

  return "bg-gray-100"; // Fallback if component isn't matched
};

const getRelicColumns = (relics: string[], itemsPerColumn = 8): string[][] => {
  return Array.from(
    {
      length: Math.ceil(relics.length / itemsPerColumn),
    },
    (_, index) =>
      relics.slice(index * itemsPerColumn, (index + 1) * itemsPerColumn),
  );
};

const getCellId = (
  item: ItemInstance,
  component: ComponentInstance,
): string => {
  const componentId = `${component.componentName}-${
    component.instanceNumber ?? 1
  }`;

  return `${item.id}__${componentId}`;
};

export default function DynamicRelicTables({
  desiredItems,
  onRemoveItem,
}: ItemTableProps) {
  const [completedCells, setCompletedCells] = useState<Set<string>>(new Set());

  /*
   * Count how many times each item occurs.
   *
   * Example:
   *
   * ["Akstiletto", "Braton", "Akstiletto"]
   *
   * becomes:
   *
   * {
   *   Akstiletto: 2,
   *   Braton: 1
   * }
   */
  const totalItemCounts = desiredItems.reduce(
    (acc, item) => {
      acc[item.itemName] = (acc[item.itemName] ?? 0) + 1;

      return acc;
    },
    {} as Record<string, number>,
  );

  /*
   * Track the current duplicate number for each item.
   */
  const currentItemCounts: Record<string, number> = {};

  /*
   * Group item instances by their component schema.
   */
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
        acc[schemaKey] = {
          components: componentSchema,
          items: [],
        };
      }

      acc[schemaKey].items.push(item);

      return acc;
    },
    {} as Record<string, GroupedItemSchema>,
  );

  const toggleCell = (cellId: string) => {
    setCompletedCells((previous) => {
      const next = new Set(previous);

      if (next.has(cellId)) {
        next.delete(cellId);
      } else {
        next.add(cellId);
      }

      return next;
    });
  };

  const removeItem = (item: ItemInstance) => {
    onRemoveItem(item.id);
  };

  return (
    <div className="space-y-12">
      {Object.entries(groupedItems).map(([schemaKey, group]) => {
        const { components, items } = group;

        return (
          <table
            key={schemaKey}
            className="w-max table-auto text-left border-collapse border border-gray-800"
          >
            <thead>
              <tr>
                <th className="p-4 border border-gray-800 bg-void-dark text-white">
                  Component
                </th>

                {items.map((item) => (
                  <th
                    key={item.displayName}
                    onClick={() => removeItem(item)}
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
                  <td className="p-4 border border-gray-800 bg-void-dark text-white font-bold">
                    {component.displayName}
                  </td>

                  {items.map((item) => {
                    const cellId = getCellId(item, component);

                    const isCompleted = completedCells.has(cellId);

                    const componentData =
                      itemData[item.itemName]?.[component.componentName];

                    const relicList = componentData?.relics ?? [];

                    return (
                      <td
                        key={cellId}
                        onClick={() => toggleCell(cellId)}
                        className={`p-2 border border-gray-800 text-base cursor-pointer transition-colors`}
                      >
                        {isCompleted ? (
                          <span className="flex items-center justify-center text-2xl font-bold text-[#006400] bg-[#90EE90]">
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
                                      className={`block whitespace-nowrap text-black ${getRarityClass(
                                        relic,
                                        item.itemName +
                                          " " +
                                          component.componentName,
                                      )}`}
                                    >
                                      {relic}
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
        );
      })}
    </div>
  );
}
