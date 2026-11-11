import { Sprout } from "lucide-react";
import { styles } from "../styles";
import { WeatherPanel } from "./WeatherPanel";

type PanelProps = Parameters<typeof WeatherPanel>[0];

export function Header(props: PanelProps) {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>
            <Sprout size={26} color="#fff" aria-hidden="true" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>そだてる庭</h1>
            <p style={styles.brandSub}>HOME FARM ALMANAC</p>
          </div>
        </div>
        <WeatherPanel {...props} />
      </div>
    </header>
  );
}
