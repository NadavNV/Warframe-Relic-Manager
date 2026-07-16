import { useState } from "react";
import PrimeSearch from "./PrimeSearch";
import DynamicRelicTables from "./DynamicRelicTables";
import type DesiredItem from "../types/DesiredItem";

export default function MainTable() {
  const [desiredItems, setDesiredItems] = useState<DesiredItem[]>([]);

  return (
    <div>
      <PrimeSearch setDesiredItems={setDesiredItems} />

      <DynamicRelicTables
        desiredItems={desiredItems}
        onRemoveItem={(itemId: string) => {
          setDesiredItems((previous) =>
            previous.filter((item) => item.id !== itemId),
          );
        }}
      />
    </div>
  );
}
