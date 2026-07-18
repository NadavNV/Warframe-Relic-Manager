export default function Footer() {
  return (
    <footer className="w-full mt-16 pb-8 text-center text-gray-500 font-sans text-sm border-t border-gray-800 pt-8 relative z-10">
      <div className="flex flex-col items-center justify-center gap-4 max-w-3xl mx-auto px-4">
        {/* Project Links */}
        <div className="flex flex-wrap justify-center gap-6 text-gray-400">
          <a
            href="https://github.com/NadavNV/Warframe-Relic-Manager"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-orokin-gold transition-colors font-medium tracking-wide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            Source Code
          </a>

          <span className="hidden sm:inline text-gray-700">|</span>

          <a
            href="https://github.com/NadavNV/Warframe-Relic-Manager/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orokin-gold transition-colors font-medium tracking-wide"
          >
            Report a Bug / Request a Feature
          </a>
        </div>

        {/* Disclaimer */}
        <p className="text-xs leading-relaxed opacity-70 max-w-xl">
          This is an unofficial fan project and is not affiliated with, endorsed
          by, or connected to Digital Extremes. Warframe and the Warframe logo
          are registered trademarks of Digital Extremes Ltd.
        </p>
      </div>
    </footer>
  );
}
