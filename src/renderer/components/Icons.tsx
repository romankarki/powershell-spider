import React from 'react';

type IconProps = { size?: number; style?: React.CSSProperties };

const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 14, style, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.3}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    aria-hidden
  >
    {children}
  </svg>
);

export const IconMinimize: React.FC<IconProps> = (p) => <Svg {...p}><path d="M3 8h10" /></Svg>;
export const IconMaximize: React.FC<IconProps> = (p) => <Svg {...p}><rect x="3" y="3" width="10" height="10" rx="1" /></Svg>;
export const IconRestore: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="3" y="5" width="8" height="8" rx="1" /><path d="M5.5 5V3.8c0-.4.4-.8.8-.8h5.9c.4 0 .8.4.8.8v5.9c0 .4-.4.8-.8.8H11" /></Svg>
);
export const IconClose: React.FC<IconProps> = (p) => <Svg {...p}><path d="M4 4l8 8M12 4l-8 8" /></Svg>;
export const IconPlus: React.FC<IconProps> = (p) => <Svg {...p}><path d="M8 3v10M3 8h10" /></Svg>;
export const IconSplitRight: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M8 3v10" /></Svg>
);
export const IconSplitDown: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M2 8h12" /></Svg>
);
export const IconZoom: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5L9 7M2.5 13.5L7 9" /></Svg>
);
export const IconUnzoom: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M13.5 6.5h-4v-4M2.5 9.5h4v4M9.5 6.5L14 2M6.5 9.5L2 14" /></Svg>
);
export const IconSearch: React.FC<IconProps> = (p) => (
  <Svg {...p}><circle cx="7" cy="7" r="4.2" /><path d="M10.2 10.2L13.5 13.5" /></Svg>
);
export const IconSettings: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.8v1.6M8 12.6v1.6M14.2 8h-1.6M3.4 8H1.8M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1M12.4 12.4l-1.1-1.1M4.7 4.7L3.6 3.6" />
  </Svg>
);
export const IconAgent: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="1.6" />
    <path d="M5 5a4.2 4.2 0 000 6M11 5a4.2 4.2 0 010 6M3 3a7 7 0 000 10M13 3a7 7 0 010 10" />
  </Svg>
);
export const IconSidebar: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M6 3v10" /></Svg>
);
export const IconKeyboard: React.FC<IconProps> = (p) => (
  <Svg {...p}><rect x="1.5" y="4" width="13" height="8" rx="1.5" /><path d="M4 6.5h.01M6.5 6.5h.01M9 6.5h.01M11.5 6.5h.01M5 9.5h6" /></Svg>
);
export const IconTerminal: React.FC<IconProps> = (p) => (
  <Svg {...p}><path d="M3 4.5l3.5 3.5L3 11.5M8 12h5" /></Svg>
);
export const IconChevronUp: React.FC<IconProps> = (p) => <Svg {...p}><path d="M4 10l4-4 4 4" /></Svg>;
export const IconChevronDown: React.FC<IconProps> = (p) => <Svg {...p}><path d="M4 6l4 4 4-4" /></Svg>;
