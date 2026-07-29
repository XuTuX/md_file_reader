import type { StoredBook } from "../_lib/bookStorage";

interface Props {
  books: StoredBook[];
  onOpen: (book: StoredBook) => void;
  onDelete: (id: string) => void;
}

const COVER_COLORS = [
  "from-[#51463b] to-[#25211d]",
  "from-[#536156] to-[#27302a]",
  "from-[#815d38] to-[#372a20]",
  "from-[#515967] to-[#272b32]",
];

export default function Bookshelf({ books, onOpen, onDelete }: Props) {
  if (!books.length) return null;

  return (
    <section className="mt-14 w-full border-t border-[#d8cdbd] pt-8" aria-labelledby="bookshelf-heading">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.2em] text-[#a07038] uppercase">Library</span>
          <h2 id="bookshelf-heading" className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#302b26]">
            내 책장
          </h2>
          <p className="mt-1 text-xs text-[#7f7469]">이 브라우저에 저장된 책입니다.</p>
        </div>
        <span className="font-serif text-xs italic text-[#9a8b7b]">{books.length}권의 책</span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book, index) => {
          const progress = Math.round(((book.lastChapterIndex + 1) / book.chapters.length) * 100);
          return (
            <div key={book.id} className="group relative min-w-0">
              <button type="button" onClick={() => onOpen(book)} className="block w-full text-left">
                <div
                  className={`relative aspect-[3/4] overflow-hidden rounded-r-[14px] rounded-l-[3px] bg-gradient-to-br ${COVER_COLORS[index % COVER_COLORS.length]} px-5 py-6 text-stone-100 shadow-[8px_12px_25px_rgba(50,42,32,0.2)] ring-1 ring-black/10 transition-all duration-300 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-white/10 group-hover:-translate-y-1.5 group-hover:shadow-[10px_18px_32px_rgba(50,42,32,0.24)]`}
                >
                  <div className="h-px w-7 bg-amber-300/70" />
                  <p className="mt-6 line-clamp-4 font-serif text-lg font-semibold leading-snug tracking-tight">
                    {book.title}
                  </p>
                  {book.author ? <p className="mt-3 text-[10px] text-stone-300">{book.author}</p> : null}
                </div>
                <p className="mt-3 truncate font-serif text-[15px] font-semibold text-[#403830]">{book.title}</p>
                <p className="mt-1 text-[11px] text-[#918476]">
                  {book.chapters.length}장 · {progress}% 읽음
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(book.id)}
                className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] text-white opacity-0 backdrop-blur transition-opacity hover:bg-red-800 group-hover:opacity-100 focus:opacity-100"
                aria-label={`${book.title} 책장에서 삭제`}
              >
                삭제
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
