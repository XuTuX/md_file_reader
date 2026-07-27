"use client";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  rect: Rect;
  onAsk: () => void;
}

export default function SelectionTooltip({ rect, onAsk }: Props) {
  // 툴팁 위치 계산 (선택 영역 중앙 상단)
  const top = Math.max(10, rect.top - 42);
  const left = Math.max(10, rect.left + rect.width / 2);

  return (
    <div
      style={{
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
      className="animate-in fade-in zoom-in-95 duration-150"
    >
      <button
        type="button"
        onClick={onAsk}
        className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all"
      >
        <span>💡</span>
        <span>이게 뭐야?</span>
      </button>
    </div>
  );
}
