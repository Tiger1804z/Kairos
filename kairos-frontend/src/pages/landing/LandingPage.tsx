import Navbar from "../../components/layout/Navbar";
import DashboardPreview from "../../components/landing/DashboardPreview"
import BuiltForClarity from "../../components/landing/BuiltForClarity";
import Footer from "../../components/layout/Footer";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar />

      <main className="relative">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-300px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        </div>

        {/* Hero */}
        <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-24 text-center">
          <span className="rounded-full bg-white/5 px-4 py-2 text-xs text-white/70 ring-1 ring-white/10">
            Intelligence for modern founders
          </span>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
            The Operating System
            <span className="block text-white/50">
              for Your Entire Business.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-sm text-white/60 md:text-base">
            Kairos orchestrates your data, clients, and growth strategies into a
            single intelligent interface.
            <span className="text-white/80"> Just ask.</span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            
            <Link
              to="/auth?mode=signup"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
            Start building for free →
            </Link>
            <button className="rounded-full bg-white/5 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10">
              Schedule demo
            </button>

           
          </div>
          <DashboardPreview />
          <BuiltForClarity/>
          <Footer/>
          
          
        </section>
      </main>
    </div>
  );
}