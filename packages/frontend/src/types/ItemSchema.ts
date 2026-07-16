import type ComponentData from "./ComponentData";

export default interface ItemSchema {
  [component: string]: ComponentData;
}
