import preview from "../../assets/dashboard-preview.png";



export default function DashboardPreview(){
    return(
    <section className="relative mx-auto mt-14 max-w-6xl px-6">
      {/* glow derrière */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[420px] w-[820px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* perspective */}
      <div className="[perspective:1200px]">
        <div
          className="
            relative overflow-hidden rounded-[28px]
            ring-1 ring-white/10
            bg-white/5
            shadow-[0_30px_80px_rgba(0,0,0,0.65)]
            transform-gpu
            rotateX-[10deg]
            hover:rotateX-[7deg]
            hover:translate-y-[-6px]
            transition duration-500 ease-out
          "
        >
          {/* highlight top */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />

          {/* image */}
          <img
            src={preview}
            alt="Kairos dashboard preview"
            className="block h-auto w-full"
            draggable={false}
          />
        </div>

        {/* ombre au sol (donne l’effet “sort de l’écran”) */}
        <div className="mx-auto mt-8 h-10 w-[85%] rounded-full bg-black/60 blur-2xl" />
      </div>
    </section>

    );
}