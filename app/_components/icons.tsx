type IconProps = { className?: string };

const base = "h-4 w-4 shrink-0";

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? base}
    >
      {children}
    </svg>
  );
}

export const FileIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
);

export const UploadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

export const PrintIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9V3h12v6" />
    <path d="M6 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1" />
    <path d="M6 14h12v7H6z" />
  </Svg>
);

export const ExpandIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9V4h5" />
    <path d="M20 15v5h-5" />
    <path d="M15 4h5v5" />
    <path d="M9 20H4v-5" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Svg>
);

export const ResetIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </Svg>
);

export const SlidersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h10" />
    <path d="M18 6h2" />
    <path d="M4 12h4" />
    <path d="M12 12h8" />
    <path d="M4 18h10" />
    <path d="M18 18h2" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="16" cy="18" r="2" />
  </Svg>
);

export const ClipboardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </Svg>
);

export const EditIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const WidthIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h16" />
    <path d="m7 9-3 3 3 3" />
    <path d="m17 9 3 3-3 3" />
  </Svg>
);

export const TextSizeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 19V6.5a2.5 2.5 0 0 1 5 0V19" />
    <path d="M4 13h5" />
    <path d="M14 19v-8a2 2 0 0 1 4 0v8" />
    <path d="M14 15h4" />
  </Svg>
);

export const TocIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M7 12h14" />
    <path d="M11 18h10" />
  </Svg>
);


