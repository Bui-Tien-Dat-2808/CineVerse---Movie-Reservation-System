export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#09090e] py-10">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#e8b84b" />
            <path
              d="M7 20 L14 8 L21 20"
              stroke="#09090e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line x1="9.5" y1="16" x2="18.5" y2="16" stroke="#09090e" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-display font-black text-base tracking-tight flex items-center">
            <span className="text-[#f0ede8]">Cine</span>
            <span className="bg-gradient-to-r from-[#f5d061] via-[#e8b84b] to-[#c9972a] text-transparent bg-clip-text font-black">
              Verse
            </span>
          </span>
        </div>
        <p className="font-mono-data text-[11px] text-[#6e6c68] tracking-widest uppercase">
          © 2025 CineVerse · All rights reserved
        </p>
        <div className="flex gap-5">
          {['Về chúng tôi', 'Điều khoản', 'Liên hệ'].map((item) => (
            <button
              key={item}
              className="bg-transparent border-0 cursor-pointer text-[#6e6c68] text-xs hover:text-[#a09e9a] transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}
