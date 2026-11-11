import type { Bed, Plant } from "../types";
import type { Diagnosis } from "../lib/pollination";
import type { PlantStatus } from "../lib/watering";

/** App で1回だけ計算して各コンポーネントへ渡す、株ごとの派生値 */
export interface PlantView {
  plant: Plant;
  bed: Bed | undefined;
  status: PlantStatus;
  diagnosis: Diagnosis | undefined;
}
