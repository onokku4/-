import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import type { Crop, GardenState, SoilTypeId } from "../types";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { newId } from "../ui/id";
import { styles } from "../styles";
import { Modal } from "./Modal";
import { StepBed } from "./wizard/StepBed";
import { StepCrop } from "./wizard/StepCrop";
import { StepVariety, type PlantDraft } from "./wizard/StepVariety";

interface Props {
  beds: GardenState["beds"];
  plants: GardenState["plants"];
  today: string;
  /** 場所を決めてから開いたとき。手順1を飛ばす */
  initialBedId?: string | null;
  dispatch: (a: Action) => void;
  onClose: () => void;
}

type Step = 1 | 2 | 3;
const STEPS: readonly { n: Step; label: string }[] = [
  { n: 1, label: "土を選ぶ" },
  { n: 2, label: "作物を選ぶ" },
  { n: 3, label: "品種・詳細" },
];

export function AddWizard({ beds, plants, today, initialBedId = null, dispatch, onClose }: Props) {
  const [step, setStep] = useState<Step>(initialBedId ? 2 : 1);
  const [pickedBed, setPickedBed] = useState<string | null>(initialBedId);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [newType, setNewType] = useState<SoilTypeId>("planter");
  const [newMix, setNewMix] = useState<string>("veg");

  // 選択が未指定・無効なら先頭の場所。追加直後は pickedBed に新IDが入る
  const bed = beds.find((b) => b.id === pickedBed) ?? beds[0];

  const addBed = (soil: SoilTypeId) => {
    const id = newId();
    dispatch({ type: "addBed", id, soil, soilMix: soil === "hydro" ? undefined : newMix, today: localDate() });
    setPickedBed(id);
  };

  const plant = (crop: Crop, draft: PlantDraft) => {
    if (!bed) return;
    dispatch({
      type: "plant",
      uid: newId(),
      cropId: crop.id,
      varietyId: draft.varietyId,
      projectName: draft.projectName,
      plantedDate: draft.plantedDate,
      bedId: bed.id,
      today: localDate(),
    });
    onClose();
  };

  return (
    <Modal title="🌱 新しいプロジェクト" onClose={onClose}>
      <ol style={{ ...styles.stepBar, listStyle: "none", margin: "0 0 18px", padding: 0 }} aria-label="手順">
        {STEPS.map(({ n, label }, i) => (
          <li key={n} style={{ ...styles.stepDot, gap: 8 }} aria-current={step === n ? "step" : undefined}>
            {i > 0 && <ChevronRight size={14} color="var(--dim)" aria-hidden="true" />}
            <span style={{ ...styles.stepNum, background: step >= n ? "var(--mint)" : "var(--line)" }}>
              {step > n ? <Check size={13} aria-hidden="true" /> : n}
            </span>
            <span style={{ ...styles.stepLabel, color: step >= n ? "var(--text)" : "var(--dim)" }}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <StepBed
          beds={beds}
          bedId={bed?.id ?? null}
          newType={newType}
          newMix={newMix}
          onPick={setPickedBed}
          onPickType={setNewType}
          onPickMix={setNewMix}
          onAddBed={addBed}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepCrop
          bed={bed}
          onPick={(c) => {
            setCrop(c);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && crop && (
        <StepVariety
          crop={crop}
          plants={plants}
          today={today}
          initialVarietyId={crop.varieties[0].id}
          onSubmit={(draft) => plant(crop, draft)}
          onBack={() => setStep(2)}
        />
      )}
    </Modal>
  );
}
