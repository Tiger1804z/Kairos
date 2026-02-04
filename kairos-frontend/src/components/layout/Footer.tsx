export default function Footer() {
  return (
    <footer className="mt-40 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div>
            <div className="text-sm font-semibold">KAIROS</div>
            <p className="mt-2 max-w-xs text-sm text-white/50">
              The intelligent operating system for modern businesses.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <div className="mb-3 font-medium text-white/80">Product</div>
              <ul className="space-y-2 text-white/50">
                <li>Dashboard</li>
                <li>AI Assistant</li>
                <li>Security</li>
              </ul>
            </div>

            <div>
              <div className="mb-3 font-medium text-white/80">Company</div>
              <ul className="space-y-2 text-white/50">
                <li>About</li>
                <li>Pricing</li>
                <li>Careers</li>
              </ul>
            </div>

            <div>
              <div className="mb-3 font-medium text-white/80">Resources</div>
              <ul className="space-y-2 text-white/50">
                <li>Docs</li>
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 text-xs text-white/40">
          © {new Date().getFullYear()} Kairos. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
