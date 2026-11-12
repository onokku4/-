import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "../src/App";
import { formatDays, formatMonths } from "../src/ui/format";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

const plantBlueberry = (variety: RegExp) => {
  click("植える");
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.click(dialog.getByRole("button", { name: /次へ：作物を選ぶ/ }));
  fireEvent.click(dialog.getByRole("button", { name: /ブルーベリー/ }));
  fireEvent.click(dialog.getByRole("radio", { name: variety }));
  fireEvent.click(dialog.getByRole("button", { name: /このプロジェクトを始める/ }));
};

const dismissPopups = () => {
  while (screen.queryByRole("dialog")) click("やったー！");
};

/** 「場所」タブ → 最初の場所 → 作物タブ */
const openBedPlants = () => {
  click("場所");
  click(/を開く$/);
  fireEvent.click(screen.getByRole("tab", { name: /作物/ }));
};

describe("そだてる庭", () => {
  it("初期表示でタイトルと空状態が出る", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("そだてる庭");
    expect(screen.getByText("まだ何も植えていません。")).toBeTruthy();
  });

  it("メニュータブで画面が切り替わる", () => {
    render(<App />);
    click("カレンダー");
    expect(screen.getByRole("grid")).toBeTruthy();
    click("場所");
    expect(screen.getByRole("button", { name: /プランターAを開く/ })).toBeTruthy();
    click("設定");
    expect(screen.getByRole("region", { name: "バックアップ" })).toBeTruthy();
    click("ホーム");
    expect(screen.getByText("まだ何も植えていません。")).toBeTruthy();
  });

  it("ブルーベリーはティフブルー単独で「受粉相手が必要」、ホームベルを足すと両方「受粉相手がいます」＋縁結びバッジ", () => {
    render(<App />);
    plantBlueberry(/^ティフブルー/);
    // 手が要る株はホームにも出る
    expect(screen.getByText("受粉相手が必要")).toBeTruthy();
    expect(screen.getByRole("region", { name: "受粉チェック" })).toBeTruthy();
    dismissPopups();

    plantBlueberry(/^ホームベル/);
    expect(screen.queryByRole("region", { name: "受粉チェック" })).toBeNull();
    expect(screen.getByRole("dialog", { name: /縁結び/ })).toBeTruthy();
    dismissPopups();
    // 解決した株は「場所」→ 作物タブで見る
    openBedPlants();
    expect(screen.getAllByText("受粉相手がいます")).toHaveLength(2);
    expect(screen.queryByText("受粉相手が必要")).toBeNull();
  });

  it("気温の「＋」で21℃になる", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "今日の天気" }).textContent).toContain("晴れ 20℃");
    click("今日の天気");
    click("気温を1℃上げる");
    expect(screen.getByRole("button", { name: "今日の天気" }).textContent).toContain("晴れ 21℃");
    expect((screen.getByLabelText("気温") as HTMLInputElement).value).toBe("21");
  });

  it("片付けは2回押して初めて実行される", () => {
    render(<App />);
    plantBlueberry(/^ティフブルー/);
    dismissPopups();
    openBedPlants();
    click(/を片付ける/);
    expect(screen.getByText("受粉相手が必要")).toBeTruthy();
    click("本当に片付ける？");
    expect(screen.getByText("この場所にはまだ何も植えていません。")).toBeTruthy();
  });

  it("Escape でウィザードが閉じる", () => {
    render(<App />);
    click("植える");
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("新しい場所を追加", { exact: false })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("天気の自動取得トグルは role=switch（設定タブ）", () => {
    render(<App />);
    click("設定");
    const sw = screen.getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(sw);
    expect(sw.getAttribute("aria-checked")).toBe("true");
  });
});

describe("整形", () => {
  it("収穫月", () => {
    expect(formatMonths([6, 7, 8])).toBe("6〜8月");
    expect(formatMonths([6, 7, 9, 10])).toBe("6・7・9・10月");
    expect(formatMonths([5])).toBe("5月");
    expect(formatMonths([10, 11, 12, 1, 2])).toBe("10〜2月");
    expect(formatMonths([12, 1, 2])).toBe("12〜2月");
    expect(formatMonths(undefined)).toBe("");
  });
  it("初収穫までの目安", () => {
    expect(formatDays({ days: 90 }, false)).toBe("約90日");
    expect(formatDays({ days: 365 }, true)).toBe("約1年で初収穫");
    expect(formatDays({ days: 1095 }, true)).toBe("約3年で初収穫");
    expect(formatDays({ days: 200 }, true)).toBe("約200日");
  });
});
