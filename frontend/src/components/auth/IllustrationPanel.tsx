export default function IllustrationPanel() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-[#3B82F6]/[0.03] blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-[#8B5CF6]/[0.02] blur-3xl" />

      <svg
        width="520"
        height="420"
        viewBox="0 0 520 420"
        fill="none"
        className="relative z-10"
      >
        {/* Floating dashboard card */}
        <rect
          x="60"
          y="40"
          width="280"
          height="200"
          rx="16"
          fill="#0A0A0A"
          stroke="#1F1F23"
          strokeWidth="1"
        />
        {/* Card top bar */}
        <rect x="76" y="60" width="80" height="6" rx="3" fill="#27272A" />
        <rect x="164" y="60" width="40" height="6" rx="3" fill="#27272A" />
        {/* Chart bars */}
        <rect x="76" y="140" width="20" height="60" rx="4" fill="#2563EB" opacity="0.6" />
        <rect x="106" y="110" width="20" height="90" rx="4" fill="#2563EB" opacity="0.8" />
        <rect x="136" y="130" width="20" height="70" rx="4" fill="#2563EB" opacity="0.7" />
        <rect x="166" y="90" width="20" height="110" rx="4" fill="#3B82F6" opacity="0.9" />
        <rect x="196" y="120" width="20" height="80" rx="4" fill="#2563EB" opacity="0.6" />
        {/* Grid lines */}
        <line x1="76" y1="200" x2="320" y2="200" stroke="#1F1F23" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="76" y1="170" x2="320" y2="170" stroke="#1F1F23" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="76" y1="140" x2="320" y2="140" stroke="#1F1F23" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="76" y1="110" x2="320" y2="110" stroke="#1F1F23" strokeWidth="0.5" strokeDasharray="4 4" />

        {/* Floating kanban card */}
        <rect
          x="290"
          y="100"
          width="180"
          height="240"
          rx="14"
          fill="#0D0D0D"
          stroke="#1F1F23"
          strokeWidth="1"
        />
        <rect x="306" y="122" width="60" height="4" rx="2" fill="#27272A" />
        <rect x="306" y="142" width="148" height="50" rx="8" fill="#111" stroke="#1F1F23" strokeWidth="0.5" />
        <rect x="314" y="152" width="80" height="4" rx="2" fill="#27272A" />
        <rect x="314" y="162" width="50" height="4" rx="2" fill="#1F1F23" />
        <rect x="306" y="204" width="148" height="50" rx="8" fill="#111" stroke="#1F1F23" strokeWidth="0.5" />
        <rect x="314" y="214" width="100" height="4" rx="2" fill="#27272A" />
        <rect x="314" y="224" width="60" height="4" rx="2" fill="#1F1F23" />
        <rect x="306" y="266" width="148" height="50" rx="8" fill="#111" stroke="#1F1F23" strokeWidth="0.5" />
        <rect x="314" y="276" width="70" height="4" rx="2" fill="#27272A" />
        <rect x="314" y="286" width="40" height="4" rx="2" fill="#1F1F23" />

        {/* User avatars */}
        <circle cx="80" cy="290" r="18" fill="#1F1F23" stroke="#27272A" strokeWidth="1" />
        <circle cx="80" cy="290" r="14" fill="#2563EB" opacity="0.3" />
        <circle cx="108" cy="290" r="18" fill="#1F1F23" stroke="#27272A" strokeWidth="1" />
        <circle cx="108" cy="290" r="14" fill="#8B5CF6" opacity="0.3" />
        <circle cx="136" cy="290" r="18" fill="#1F1F23" stroke="#27272A" strokeWidth="1" />
        <circle cx="136" cy="290" r="14" fill="#3B82F6" opacity="0.3" />

        {/* Floating elements */}
        <rect x="420" y="50" width="60" height="60" rx="12" fill="#0D0D0D" stroke="#1F1F23" strokeWidth="1" />
        <rect x="430" y="62" width="40" height="4" rx="2" fill="#27272A" />
        <circle cx="440" cy="82" r="12" fill="none" stroke="#2563EB" strokeWidth="2" opacity="0.5" />

        {/* Abstract dots pattern */}
        <circle cx="440" cy="340" r="2" fill="#1F1F23" />
        <circle cx="452" cy="332" r="1.5" fill="#1F1F23" />
        <circle cx="460" cy="344" r="1" fill="#1F1F23" />
        <circle cx="448" cy="354" r="1.5" fill="#1F1F23" />
        <circle cx="436" cy="350" r="1" fill="#1F1F23" />

        {/* Checkmark circle */}
        <circle cx="200" cy="340" r="22" fill="none" stroke="#22C55E" strokeWidth="1.5" opacity="0.3" />
        <path d="M190 340l6 6 12-12" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </svg>
    </div>
  );
}
