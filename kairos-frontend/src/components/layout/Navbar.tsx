import logo from "../../assets/kairos_logo(3).png"
import { Link } from "react-router-dom";

export default function Navbar(){
    return(
    <header className="sticky top-0 z-50 border-b border-white/5 bg-bg/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src= {logo}  alt="Kairos logo"  className="h-9 w-auto opacity-90 transition hover:opacity-100"/>
          <span className="text-sm font-semibold tracking-wide">KAIROS</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          <a className="text-sm text-white/60 hover:text-white/90">Product</a>
          <a className="text-sm text-white/60 hover:text-white/90">Enterprise</a>
          <a className="text-sm text-white/60 hover:text-white/90">Pricing</a>
          <a className="text-sm text-white/60 hover:text-white/90">Resources</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth?mode=login"
            className="hidden text-sm text-white/60 hover:text-white/90 md:block"
          >
            Log in
          </Link>

          <Link
            to="/auth?mode=signup"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>

    )
}