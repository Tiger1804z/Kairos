import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div>
            <div className="text-sm font-semibold tracking-wide">KAIROS</div>
            <p className="mt-2 max-w-xs text-sm text-white/50">
              Profit intelligence for Shopify brands that want real numbers.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <div className="mb-3 font-medium text-white/70">Product</div>
              <ul className="space-y-2 text-white/40">
                <li>Dashboard</li>
                <li>Insights</li>
                <li>AI Chat</li>
              </ul>
            </div>

            <div>
              <div className="mb-3 font-medium text-white/70">Account</div>
              <ul className="space-y-2 text-white/40">
                <li>
                  <Link to="/auth?mode=login" className="hover:text-white/70">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link to="/auth?mode=signup" className="hover:text-white/70">
                    Join the private beta
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-xs text-white/30">
          © {new Date().getFullYear()} Kairos. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
