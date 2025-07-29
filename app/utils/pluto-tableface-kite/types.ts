// Types for PlutoTablefaceKite component

export interface PlutoTablefaceKiteProps {
  text?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export interface PlutoConfig {
  defaultText: string;
  styles: {
    backgroundColor: string;
    border: string;
    borderRadius: string;
    padding: string;
    fontSize: string;
    fontWeight: string;
    color: string;
  };
}