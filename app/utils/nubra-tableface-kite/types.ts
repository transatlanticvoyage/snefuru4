// Types for NubraTablefaceKite component

export interface NubraTablefaceKiteProps {
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

export interface NubraConfig {
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