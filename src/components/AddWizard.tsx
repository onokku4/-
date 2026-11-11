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
  dispatch: (a: Action) => void;
  onClose: () => void;
}

type Step = 1 | 2 | 3;
const STEPS: readonly { n: Step; label: string }[] = [
  { n: 1, label: "土を選ぶ" },
  { n: 2, label: "作物を選ぶ" },
  { n: 3, label: "品種・詳細" },
];

export function AddWizard({ beds, plants, today, dispatch, onClose }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [pickedBed, setPickedBed] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [newType, setNewType] = useState<SoilTypeId>("planter");

  // 選択が未指定・無効なら先頭の場所。追加直後は pickedBed に新IDが入る
  const bed = beds.find((b) => b.id === pickedBed) ?? beds[0];

  const addBed = (soil: SoilTypeId) => {
    const id = newId();
    dispatch({ type: "addBed", id, soil });
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
            {i > 0 && <ChevronRight size={14} color="#c9c2af" aria-hidden="true" />}
            <span style={{ ...styles.stepNum, background: step >= n ? "#6b9d4f" : "#d6cfbb" }}>
              {step > n ? <Check size={13} aria-hidden="true" /> : n}
            </span>
            <span style={{ ...styles.stepLabel, color: step >= n ? "#3d4a35" : "#a8ac98" }}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <StepBed
          beds={beds}
          bedId={bed?.id ?? null}
          newType={newType}
          onPick={setPickedBed}
          onPickType={setNewType}
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
