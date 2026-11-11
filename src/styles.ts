import type { CSSProperties } from "react";

/** 旧UIの見た目を踏襲したインラインスタイル。グローバルな指定は global.css */
export const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 15% 0%, #f4efe2 0%, transparent 45%), radial-gradient(circle at 90% 10%, #eaf0df 0%, transparent 40%), #f7f3e9",
    fontFamily: "var(--body)",
    color: "#3d4a35",
    paddingBottom: 40,
  },
  /* header */
  header: {
    background: "linear-gradient(135deg, #4a6b3a 0%, #3a5630 100%)",
    borderBottom: "4px solid #2e4426",
    boxShadow: "0 4px 20px rgba(58,86,48,.25)",
  },
  headerInner: {
    maxWidth: 1100, margin: "0 auto", padding: "18px 22px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: 16,
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandMark: {
    width: 46, height: 46, borderRadius: 14,
    background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandTitle: { margin: 0, fontFamily: "var(--display)", fontSize: 26, color: "#fff", letterSpacing: 1 },
  brandSub: { margin: 0, fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,.55)", fontWeight: 700 },
  /* weather panel */
  weatherBox: { display: "flex", flexDirection: "column", gap: 9, maxWidth: "100%" },
  weatherLabel: { fontSize: 11, color: "rgba(255,255,255,.7)", letterSpacing: 1 },
  weatherBtn: {
    width: 38, height: 38, borderRadius: 10, border: "1.5px solid",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all .18s", backdropFilter: "blur(4px)",
  },
  tempBtn: {
    width: 30, height: 30, borderRadius: 9, border: "1.5px solid rgba(255,255,255,.3)",
    background: "rgba(255,255,255,.12)", color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
  },
  tempInput: {
    width: 56, height: 30, borderRadius: 9, border: "1.5px solid rgba(255,255,255,.3)",
    background: "rgba(255,255,255,.95)", color: "#3d4a35", textAlign: "center",
    fontFamily: "var(--body)", fontWeight: 700, fontSize: 14,
  },
  tempUnit: { color: "#fff", fontWeight: 700, fontSize: 13 },
  tempLabel: {
    background: "rgba(255,255,255,.18)", color: "#fff", borderRadius: 7,
    padding: "2px 9px", fontSize: 11, fontWeight: 700,
  },
  autoToggle: {
    display: "flex", alignItems: "center", gap: 7, background: "transparent",
    border: "none", cursor: "pointer", padding: 0,
  },
  toggleTrack: {
    width: 34, height: 18, borderRadius: 10, position: "relative",
    transition: "background .2s", display: "inline-block", flexShrink: 0,
  },
  toggleKnob: {
    position: "absolute", top: 2, left: 2, width: 14, height: 14, borderRadius: "50%",
    background: "#fff", transition: "transform .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
  },
  autoToggleLabel: { fontSize: 11.5, color: "rgba(255,255,255,.9)", fontWeight: 700 },
  autoFetchBtn: {
    background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.3)",
    color: "#fff", borderRadius: 9, padding: "5px 11px",
    fontWeight: 700, fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap",
  },
  autoInfo: { fontSize: 11.5, color: "rgba(255,255,255,.85)", fontWeight: 700 },
  adjustedChip: {
    background: "#e0a32e", color: "#fff", borderRadius: 7, padding: "1px 8px",
    fontSize: 10.5, fontWeight: 700,
  },
  resetBtn: {
    background: "transparent", border: "1px solid rgba(255,255,255,.4)", color: "#fff",
    borderRadius: 8, padding: "3px 9px", fontWeight: 700, fontSize: 11, cursor: "pointer",
  },
  autoNote: { fontSize: 10, color: "rgba(255,255,255,.6)" },
  main: { maxWidth: 1100, margin: "0 auto", padding: "26px 22px" },
  /* status */
  levelCard: {
    background: "#fff", borderRadius: 18, padding: "18px 20px",
    border: "1.5px solid #e8e1d0", boxShadow: "0 6px 18px rgba(120,110,80,.08)",
  },
  levelTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  levelLv: { fontFamily: "var(--display)", fontSize: 30, color: "#3a5630", lineHeight: 1 },
  levelTitle: { fontSize: 13, color: "#8a9479", marginTop: 4, fontWeight: 700 },
  xpTrack: { height: 10, background: "#eceadd", borderRadius: 6, marginTop: 14, overflow: "hidden" },
  xpFill: { height: "100%", background: "linear-gradient(90deg,#7fb04f,#c98b3a)", borderRadius: 6, transition: "width .5s" },
  xpText: { fontSize: 11.5, color: "#9aa089", marginTop: 6 },
  miniStat: {
    background: "#fff", borderRadius: 18, padding: "16px 10px",
    border: "1.5px solid #e8e1d0", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    boxShadow: "0 6px 18px rgba(120,110,80,.06)",
  },
  miniNum: { fontFamily: "var(--display)", fontSize: 26, color: "#3d4a35", lineHeight: 1 },
  miniLabel: { fontSize: 10.5, color: "#9aa089", fontWeight: 700 },
  /* alerts */
  alertBox: {
    background: "linear-gradient(135deg,#5b8aa6,#456f87)", borderRadius: 18,
    padding: "16px 20px", marginBottom: 20, boxShadow: "0 8px 22px rgba(70,110,135,.3)",
  },
  alertHead: { display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 700, fontSize: 14.5, marginBottom: 12 },
  alertChips: { display: "flex", flexWrap: "wrap", gap: 8 },
  alertChip: {
    border: "none", borderRadius: 10, padding: "8px 14px",
    fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
    boxShadow: "0 3px 8px rgba(0,0,0,.12)",
  },
  urgentTag: { fontSize: 10, background: "rgba(255,255,255,.25)", padding: "1px 6px", borderRadius: 6 },
  pollAlert: {
    background: "#fff8ec", border: "1.5px solid #ecd9ae", borderRadius: 18,
    padding: "16px 20px", marginBottom: 20,
  },
  pollAlertHead: { display: "flex", alignItems: "center", gap: 8, color: "#8a6315", fontWeight: 700, fontSize: 14.5, marginBottom: 10 },
  pollAlertList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 },
  pollAlertItem: { fontSize: 12.5, color: "#5a4a25", lineHeight: 1.6 },
  pollAlertSuggest: { fontSize: 11.5, color: "#8a7a55", margin: "2px 0 0", paddingLeft: 18 },
  /* section */
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10, flexWrap: "wrap" },
  sectionTitle: { fontFamily: "var(--display)", fontSize: 20, color: "#3a5630", margin: 0, display: "flex", alignItems: "center", gap: 8 },
  btnRow: { display: "flex", gap: 8 },
  addBtn: {
    background: "#6b9d4f", color: "#fff", border: "none", borderRadius: 11,
    padding: "9px 16px", fontWeight: 700, fontSize: 13.5,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
    boxShadow: "0 4px 12px rgba(107,157,79,.35)",
  },
  histBtn: {
    background: "#fff", color: "#7a6a45", border: "1.5px solid #e3ddcf", borderRadius: 11,
    padding: "9px 14px", fontWeight: 700, fontSize: 13,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  },
  /* tags */
  tagRow: { display: "flex", gap: 5, flexWrap: "wrap", margin: "3px 0 4px" },
  catTag: { background: "#3a5630", color: "#fff", borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 700 },
  varTagSm: { background: "#f0ece0", color: "#8a6a3a", borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 700 },
  seasonTag: { background: "#fdecc8", color: "#8a6315", borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 700 },
  harvestTag: { background: "#eaf4e2", color: "#3f7a36", borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 700 },
  bedTag: {
    display: "inline-flex", alignItems: "center", gap: 3, background: "#f0ece0",
    color: "#9c7a4a", borderRadius: 6, padding: "1px 7px", fontWeight: 700, fontSize: 10,
  },
  /* wizard */
  stepBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  stepDot: { display: "flex", alignItems: "center", gap: 6 },
  stepNum: {
    width: 22, height: 22, borderRadius: "50%", color: "#fff", fontSize: 12, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  stepLabel: { fontSize: 12, fontWeight: 700 },
  stepHint: { fontSize: 12.5, color: "#7a6a45", marginBottom: 14, fontWeight: 700 },
  bedList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  bedRowPick: {
    display: "flex", alignItems: "center", gap: 12, border: "2px solid", borderRadius: 12,
    padding: "11px 14px", cursor: "pointer", transition: "all .15s", width: "100%",
  },
  bedPickName: { fontWeight: 700, fontSize: 13.5, color: "#3d4a35" },
  bedPickHealth: { fontSize: 10.5, color: "#9aa089", marginTop: 2 },
  newBedBox: { background: "#faf7ee", borderRadius: 14, padding: 14, border: "1.5px dashed #d6cfbb" },
  newBedTitle: { fontSize: 12.5, fontWeight: 700, color: "#7a6a45", marginBottom: 10 },
  soilTypeRow: { display: "flex", gap: 8, marginBottom: 8 },
  soilTypeBtn: {
    flex: 1, border: "2px solid", borderRadius: 11, padding: "10px 4px", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all .15s",
  },
  soilTypeLabel: { fontSize: 11.5, fontWeight: 700, color: "#3d4a35" },
  soilTypeDesc: { fontSize: 11, color: "#9aa089", lineHeight: 1.5, margin: "0 0 10px" },
  mixField: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 },
  mixLabel: { fontSize: 11.5, fontWeight: 700, color: "#7a6a45" },
  mixSelect: {
    width: "100%", fontFamily: "var(--body)", fontSize: 13, padding: "8px 10px", borderRadius: 9,
    border: "1.5px solid #d6cfbb", background: "#fff", color: "#3d4a35",
  },
  addBedConfirm: {
    width: "100%", background: "#fff", border: "1.5px solid #d6cfbb", borderRadius: 10,
    padding: "9px 0", fontWeight: 700, fontSize: 12.5, color: "#6b9d4f",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  catRow: { display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 },
  catChip: {
    border: "1.5px solid", borderRadius: 20, padding: "6px 14px",
    fontWeight: 700, fontSize: 12.5, cursor: "pointer", transition: "all .15s",
  },
  backBtn: {
    width: "100%", marginTop: 10, background: "transparent", border: "none", color: "#9aa089",
    fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: "8px 0",
  },
  cropPicker: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 10 },
  cropOption: {
    border: "2px solid #e3ddcf", background: "#fff", borderRadius: 14, padding: "12px 6px", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all .15s",
  },
  cropOptName: { fontWeight: 700, fontSize: 12.5, color: "#3d4a35" },
  cropOptSeason: { fontSize: 9.5, color: "#9aa089" },
  cropHeadRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  cropHeadName: { fontFamily: "var(--display)", fontSize: 21, color: "#3a5630" },
  varLabel: { fontSize: 12.5, fontWeight: 700, color: "#5a6b4d", marginBottom: 8 },
  varList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 },
  varCard: {
    border: "2px solid", borderRadius: 12, padding: "11px 14px", cursor: "pointer",
    textAlign: "left", transition: "all .15s", display: "block", width: "100%",
  },
  varTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  varName: { fontWeight: 700, fontSize: 14, color: "#3d4a35" },
  varDays: { fontSize: 11, color: "#9c7a4a", fontWeight: 700, flexShrink: 0 },
  varTip: { display: "block", fontSize: 11.5, color: "#7a6a45", lineHeight: 1.6, marginTop: 8, paddingTop: 8, borderTop: "1px solid #e0dccd" },
  diagLine: { display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11.5, fontWeight: 700 },
  diagDetail: { display: "block", fontSize: 11.5, lineHeight: 1.6, marginTop: 6, fontWeight: 400 },
  dateLabel: { display: "flex", flexDirection: "column", gap: 7, fontSize: 12.5, fontWeight: 700, color: "#5a6b4d" },
  dateInput: { border: "1.5px solid #d6cfbb", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--body)", fontSize: 14, marginTop: 2, width: "100%" },
  confirmBtn: {
    marginTop: 16, width: "100%", background: "#6b9d4f", color: "#fff", border: "none",
    borderRadius: 12, padding: "13px 0", fontWeight: 700, fontSize: 15,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    boxShadow: "0 4px 14px rgba(107,157,79,.35)",
  },
  /* notify */
  notifyCard: {
    background: "#fff", borderRadius: 18, padding: "16px 20px", border: "1.5px solid #e8e1d0",
    boxShadow: "0 6px 18px rgba(120,110,80,.06)", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 14, flexWrap: "wrap",
  },
  notifyLeft: { display: "flex", alignItems: "center", gap: 12 },
  notifyTitle: { fontFamily: "var(--display)", fontSize: 17, color: "#3d4a35" },
  notifySub: { fontSize: 11.5, color: "#9aa089", marginTop: 2 },
  notifyRight: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  timeWrap: {
    display: "flex", alignItems: "center", gap: 6, background: "#faf7ee",
    border: "1.5px solid #e3ddcf", borderRadius: 10, padding: "7px 11px",
  },
  timeInput: { border: "none", background: "transparent", fontFamily: "var(--body)", fontSize: 14, color: "#3d4a35" },
  notifyToggleBtn: {
    color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px",
    fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  /* beds */
  bedGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(290px,100%),1fr))", gap: 16 },
  bedCard: {
    background: "#fff", borderRadius: 18, padding: 18, border: "2px solid #e3ddcf",
    boxShadow: "0 6px 18px rgba(120,110,80,.08)", display: "flex", flexDirection: "column", gap: 13,
  },
  bedHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  bedName: { fontFamily: "var(--display)", fontSize: 18, color: "#3d4a35" },
  bedSub: { fontSize: 11, color: "#9aa089", marginTop: 2 },
  bedHealthBadge: { color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" },
  usesRow: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7a6a45",
    background: "#faf6ea", borderRadius: 9, padding: "8px 11px", border: "1px solid #f0e8d2",
  },
  usesWarn: { marginLeft: "auto", background: "#fbe9e4", color: "#c0432a", borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 700 },
  npkBox: { display: "flex", flexDirection: "column", gap: 9 },
  npkRow: { display: "flex", alignItems: "center", gap: 10 },
  npkBadge: {
    width: 26, height: 26, borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  npkInfo: { flex: 1 },
  npkLabelRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 },
  npkLabel: { fontSize: 11.5, color: "#5a6b4d", fontWeight: 700 },
  npkRole: { fontSize: 9.5, color: "#a8ac98", fontWeight: 400 },
  npkVal: { fontSize: 12.5, fontWeight: 700 },
  npkTrack: { height: 7, background: "#eceadd", borderRadius: 4, overflow: "hidden" },
  npkFill: { height: "100%", borderRadius: 4, transition: "width .5s" },
  soilAdvice: { fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, lineHeight: 1.5 },
  soilMixRow: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#5a6b4d", flexWrap: "wrap",
  },
  soilMixLink: {
    background: "transparent", border: "none", color: "#6b9d4f", fontWeight: 700, fontSize: 11.5,
    cursor: "pointer", padding: 0, textDecoration: "underline",
  },
  feedBox: {
    display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, borderRadius: 9,
    padding: "8px 11px", border: "1px solid", lineHeight: 1.5,
  },
  feedBtn: {
    background: "#6b9d4f", color: "#fff", border: "none", borderRadius: 10,
    padding: "9px 0", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  pickList: { display: "flex", flexDirection: "column", gap: 6 },
  pickTitle: { fontSize: 12, fontWeight: 700, color: "#7a6a45", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pickItem: {
    textAlign: "left", background: "#fff", border: "1.5px solid #e3ddcf", borderRadius: 10,
    padding: "8px 11px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2,
  },
  pickName: { fontSize: 12.5, fontWeight: 700, color: "#3d4a35" },
  pickDesc: { fontSize: 10.5, color: "#9aa089", lineHeight: 1.45 },
  acidWarn: {
    display: "flex", gap: 7, alignItems: "flex-start", background: "#fbe9e4", color: "#c0432a",
    borderRadius: 9, padding: "8px 11px", fontSize: 11.5, fontWeight: 700, lineHeight: 1.5,
  },
  refreshBtn: {
    background: "#f0ece0", color: "#8a6a3a", border: "1.5px solid #e0d6bf", borderRadius: 10,
    padding: "9px 0", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  hydroBox: {
    display: "flex", gap: 8, alignItems: "flex-start", background: "#eef5f8", borderRadius: 10,
    padding: "11px 13px", fontSize: 11.5, color: "#3f6f87", lineHeight: 1.6, border: "1px solid #d8e6ed",
  },
  hydroRefreshBtn: { color: "#3f6f87", borderColor: "#cfe0e8", background: "#eef5f8" },
  /* history */
  histList: { display: "flex", flexDirection: "column", gap: 9 },
  histItem: {
    display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12,
    padding: "11px 14px", border: "1.5px solid #e8e1d0",
  },
  histEmoji: { fontSize: 26 },
  histName: { fontFamily: "var(--display)", fontSize: 15, color: "#3d4a35" },
  histMeta: { fontSize: 11, color: "#9aa089", marginTop: 1 },
  histDate: { fontSize: 13, fontWeight: 700, color: "#9c7a4a" },
  histEmpty: { textAlign: "center", padding: "30px 10px", color: "#9aa089" },
  empty: { textAlign: "center", padding: "44px 20px", background: "#fff", borderRadius: 18, border: "1.5px dashed #d6cfbb" },
  emptyText: { color: "#9aa089", marginBottom: 16 },
  addBtnBig: {
    background: "#6b9d4f", color: "#fff", border: "none", borderRadius: 12,
    padding: "12px 22px", fontWeight: 700, fontSize: 14.5,
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
    boxShadow: "0 4px 14px rgba(107,157,79,.35)",
  },
  /* plant card */
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(270px,100%),1fr))", gap: 16 },
  card: {
    background: "#fff", borderRadius: 18, padding: 18, border: "2px solid #e3ddcf",
    boxShadow: "0 6px 18px rgba(120,110,80,.08)", display: "flex", flexDirection: "column", gap: 12,
  },
  cardTop: { display: "flex", alignItems: "center", gap: 12 },
  cropEmoji: { fontSize: 38, lineHeight: 1 },
  cropName: { margin: 0, fontFamily: "var(--display)", fontSize: 19, color: "#3d4a35", overflowWrap: "anywhere" },
  cropMeta: { fontSize: 11, color: "#9aa089", display: "flex", alignItems: "center", gap: 4, marginTop: 3, flexWrap: "wrap" },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10, border: "1.5px solid #e3ddcf",
    background: "#faf7ee", cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0,
  },
  growRow: { display: "flex", alignItems: "center", gap: 8 },
  growLabel: { fontSize: 11, color: "#9aa089", fontWeight: 700, width: 30 },
  growTrack: { flex: 1, height: 8, background: "#eceadd", borderRadius: 5, overflow: "hidden" },
  growFill: { height: "100%", background: "linear-gradient(90deg,#a7c97a,#6b9d4f)", borderRadius: 5, transition: "width .5s" },
  growPct: { fontSize: 11.5, color: "#6b9d4f", fontWeight: 700, width: 34, textAlign: "right" },
  perennialRow: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11.5, color: "#5a6b4d", fontWeight: 700 },
  frostWarn: {
    background: "#eef3fb", color: "#2f5483", border: "1px solid #cfdcf0", borderRadius: 10,
    padding: "8px 12px", fontSize: 12, fontWeight: 700, lineHeight: 1.5,
  },
  waterStatus: {
    borderRadius: 10, padding: "8px 12px", fontSize: 12.5, fontWeight: 700,
    display: "flex", alignItems: "center", gap: 6,
  },
  cardActions: { display: "flex", gap: 8, alignItems: "stretch" },
  waterBtn: {
    flex: 1, background: "#5b8aa6", color: "#fff", border: "none", borderRadius: 10,
    padding: "9px 0", fontWeight: 700, fontSize: 13.5,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    boxShadow: "0 3px 10px rgba(91,138,166,.3)",
  },
  removeBtn: {
    marginLeft: "auto", background: "transparent", color: "#9aa089", border: "1.5px solid #e3ddcf",
    borderRadius: 10, padding: "8px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 5,
  },
  removeBtnConfirm: { background: "#c0432a", color: "#fff", borderColor: "#c0432a" },
  tip: {
    background: "#faf6ea", borderRadius: 10, padding: "10px 12px", fontSize: 11.5,
    color: "#7a6a45", lineHeight: 1.6, display: "flex", gap: 7, border: "1px solid #f0e8d2",
  },
  /* pollination badge */
  pollBtn: {
    width: "100%", border: "1px solid", borderRadius: 10, padding: "8px 12px", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 8, textAlign: "left", fontSize: 12.5, fontWeight: 700,
  },
  pollMark: { fontFamily: "var(--display)", fontSize: 16, lineHeight: 1 },
  pollBody: { fontSize: 11.5, lineHeight: 1.6, padding: "8px 12px 0", margin: 0 },
  /* badges */
  badgeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginTop: 14 },
  badge: {
    background: "#fff", borderRadius: 16, padding: "16px 12px", textAlign: "center",
    border: "1.5px solid #e8e1d0", transition: "all .3s", position: "relative",
  },
  badgeEmoji: { fontSize: 34 },
  badgeName: { fontFamily: "var(--display)", fontSize: 14, color: "#3d4a35", marginTop: 6 },
  badgeDesc: { fontSize: 10.5, color: "#9aa089", marginTop: 3, lineHeight: 1.4 },
  badgeGot: {
    marginTop: 8, fontSize: 10.5, color: "#6b9d4f", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
  },
  footer: { textAlign: "center", marginTop: 34, fontSize: 12, color: "#a8ac98" },
  /* modal */
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(45,55,38,.55)", backdropFilter: "blur(3px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50,
  },
  modal: {
    background: "#f7f3e9", borderRadius: 22, padding: 22, maxWidth: 560, width: "100%",
    maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)",
  },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "var(--display)", fontSize: 22, color: "#3a5630", margin: 0 },
  closeBtn: { background: "#fff", border: "1.5px solid #e3ddcf", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  /* toast */
  toastWrap: {
    position: "fixed", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center",
    padding: "0 16px", pointerEvents: "none", zIndex: 60,
  },
  toast: {
    background: "#3a5630", color: "#fff", padding: "13px 24px", borderRadius: 14,
    fontWeight: 700, fontSize: 14, boxShadow: "0 10px 30px rgba(0,0,0,.3)",
    animation: "toastIn .3s ease", maxWidth: "100%", textAlign: "center", lineHeight: 1.5,
  },
  /* badge popup */
  popupOverlay: {
    position: "fixed", inset: 0, background: "rgba(45,55,38,.6)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 16,
  },
  popupCard: {
    background: "linear-gradient(160deg,#fffdf6,#f3ecd9)", borderRadius: 24, padding: "32px 36px",
    textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.35)", border: "2px solid #e8d9b0",
    animation: "popIn .4s ease", maxWidth: 320,
  },
  popupBurst: { fontSize: 64, animation: "burst .6s ease" },
  popupTitle: { fontSize: 12, letterSpacing: 3, color: "#c98b3a", fontWeight: 700, marginTop: 8 },
  popupName: { fontFamily: "var(--display)", fontSize: 26, color: "#3a5630", margin: "6px 0" },
  popupDesc: { fontSize: 13, color: "#8a7a55", marginBottom: 20 },
  popupBtn: {
    background: "#c98b3a", color: "#fff", border: "none", borderRadius: 12, padding: "11px 30px",
    fontWeight: 700, fontSize: 14.5, cursor: "pointer",
    boxShadow: "0 5px 16px rgba(201,139,58,.4)",
  },
} satisfies Record<string, CSSProperties>;
