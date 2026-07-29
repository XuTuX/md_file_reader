import type { StoredDocument } from "../../../_lib/documentStorage";

interface Props {
  documents: StoredDocument[];
  onOpen: (document: StoredDocument) => void;
  onDelete: (id: string) => void;
}

export default function RecentDocuments({ documents, onOpen, onDelete }: Props) {
  if (!documents.length) return null;

  return (
    <section className="mt-8 w-full border-t border-stone-200 pt-6" aria-labelledby="recent-heading">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 id="recent-heading" className="text-sm font-semibold text-stone-800">
            최근 문서
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">이 브라우저에 자동 저장된 문서입니다.</p>
        </div>
        <span className="text-xs text-stone-400">{documents.length}개</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {documents.map((document) => (
          <div
            key={document.id}
            className="group flex min-w-0 items-center gap-2 rounded-xl border border-stone-200 bg-white p-2 shadow-sm transition-colors hover:border-stone-300"
          >
            <button
              type="button"
              onClick={() => onOpen(document)}
              className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            >
              <span className="block truncate text-sm font-medium text-stone-800">
                {document.title || document.fileName}
              </span>
              <span className="mt-0.5 block truncate text-[11.5px] text-stone-400">
                {document.fileName} · {new Date(document.updatedAt).toLocaleString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(document.id)}
              className="rounded-lg px-2 py-1.5 text-xs text-stone-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              aria-label={`${document.title || document.fileName} 최근 문서에서 삭제`}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

