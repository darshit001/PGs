import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  Filter,
  GraduationCap,
  MapPinned,
  PhoneCall,
  Sparkles,
  Star,
  UserRound,
  Users,
  Wallet,
  Wifi,
} from "lucide-react";

const sectionMotion = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerMotion = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};

const itemMotion = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function CountUp({ value, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 1200;

    function animate(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export default function LandingPage({ onStartChat }) {
  const [scrolled, setScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState(0);
  const [visibleItems, setVisibleItems] = useState(0);

  const demoMessages = [
    { role: "user", content: "Suggest PG in Memnagar" },
    { role: "bot", content: "Who is the PG for?" },
    { role: "user", content: "Girls, under ₹12k, rating 4+" },
    { role: "bot", content: "Found 5 closest matches with prices, ratings, and quick call numbers! ✨" },
  ];

  useEffect(() => {
    let timeout;
    if (visibleItems < 4) {
      // Users "type" faster, bots "think" slightly longer
      timeout = setTimeout(() => {
        setVisibleItems((prev) => prev + 1);
      }, visibleItems % 2 === 0 ? 1200 : 1800);
    } else {
      // Reset the loop after 5 seconds to keep the landing page alive
      timeout = setTimeout(() => {
        setVisibleItems(0);
      }, 6000);
    }
    return () => clearTimeout(timeout);
  }, [visibleItems]);

  // 3D Tilt Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-200, 200], [10, -10]);
  const rotateY = useTransform(mouseX, [-200, 200], [-10, 10]);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    // Center the origin of tilt
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    // Smoothly return back to flat
    mouseX.set(0);
    mouseY.set(0);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = useMemo(
    () => [
      { label: "PG Listings", value: 400, suffix: "+", icon: Building2 },
      { label: "Guided Flow", text: "5-step", icon: Bot },
      { label: "Instant Call Options", text: "1-tap", icon: PhoneCall },
      { label: "Average Search Time", value: 3, suffix: " min", icon: Clock3 },
    ],
    []
  );

  const features = [
    { title: "Smart Budget Filtering", desc: "Price-aware matching across sharing types.", icon: Wallet },
    { title: "Area-specific Insights", desc: "Memnagar to Vastrapur, tuned for local context.", icon: MapPinned },
    { title: "Food Preference Matching", desc: "Veg, non-veg, and Jain-friendly options.", icon: Sparkles },
    { title: "Gender Preference Filters", desc: "Boys, girls, and mixed-friendly options.", icon: UserRound },
    { title: "Instant Availability Status", desc: "Surface available PGs quickly.", icon: CheckCircle2 },
    { title: "Ratings Aggregation", desc: "See review-backed confidence at a glance.", icon: Star },
    { title: "One-click Call Options", desc: "Contact owners directly from result cards.", icon: PhoneCall },
    { title: "Mobile-optimized Experience", desc: "Fast, clear, thumb-friendly UI.", icon: Wifi },
  ];

  const faqs = [
    { q: "Is StayEase AI free to use?", a: "Yes. Search, filtering, and recommendations are free for users." },
    {
      q: "How accurate are the recommendations?",
      a: "Recommendations are generated from structured listing data, semantic retrieval, and your chosen filters.",
    },
    { q: "Can I filter by specific amenities?", a: "Yes. You can refine by food preference, budget, ratings, and criteria." },
    { q: "How do I contact PG owners directly?", a: "Each PG card includes a one-click call button for instant contact." },
    {
      q: "Which areas in Ahmedabad are covered?",
      a: "Memnagar, Navrangpura, Prahlad Nagar, Satellite, Shivranjani, Thaltej, Vastrapur, and Vijay Crossroads.",
    },
    { q: "Is my data secure and private?", a: "Yes. We only use conversation context to serve your current session better." },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 selection:bg-brand/30 selection:text-brand-light">
      {/* Immersive ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
        <motion.div animate={{ scale: [1, 1.15, 1], x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-[10%] top-0 h-[500px] w-[500px] rounded-full bg-brand/20 blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.2, 1], x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute right-0 top-[20%] h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[130px]" />
        <motion.div animate={{ scale: [1, 1.1, 1], x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold tracking-wide">StayEase AI</p>
              <p className="text-xs text-brand-light/70">AI-guided PG discovery</p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex">
            <a href="#how" className="transition hover:text-white">How it works</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>

          <button onClick={onStartChat} className="btn-ripple rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-transform hover:scale-105 hover:bg-brand-dark">
            Start Chat Search
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-12 md:px-6 md:pt-20">
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={sectionMotion} className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-light backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
              </span>
              Ahmedabad-First Product
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.15] text-white md:text-6xl lg:text-7xl">
              Find the right <span className="bg-gradient-to-r from-brand-light via-brand to-cyan-400 bg-clip-text text-transparent">PG in minutes</span>, not weekends.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              StayEase AI understands your area, budget, and lifestyle preferences, then recommends the closest PG matches with instant owner connect. No more endless scrolling.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={onStartChat} className="btn-ripple rounded-full bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand/30 transition-transform hover:scale-105">
                Launch Chatbot Now
              </button>
              <a href="#features" className="flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-sm font-semibold text-slate-100 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white">
                Explore Features
              </a>
            </div>
          </div>

          <div style={{ perspective: 1200 }} className="w-full flex items-center justify-center">
            <motion.div 
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              animate={{ y: [0, -8, 0] }} 
              transition={{ y: { duration: 6, repeat: Infinity, ease: "easeInOut" }, rotateX: { type: "spring", stiffness: 300, damping: 30, mass: 0.5 }, rotateY: { type: "spring", stiffness: 300, damping: 30, mass: 0.5 } }} 
              className="relative mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3)] backdrop-blur-xl ring-1 ring-white/5"
            >
              <div 
                style={{ transform: "translateZ(30px)" }} 
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/40 blur-[50px] pointer-events-none" 
              />
              <div 
                style={{ transform: "translateZ(20px)" }} 
                className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-[50px] pointer-events-none" 
              />
              
              <div style={{ transform: "translateZ(40px)" }} className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-md shadow-brand/20">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-white">Live AI Preview</p>
                  <p className="text-[11px] font-medium text-emerald-400">Online now</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm font-medium min-h-[240px]">
              {demoMessages.map((msg, i) => (
                i < visibleItems && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className={
                      msg.role === "user"
                        ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-2.5 text-white shadow-[0_4px_14px_0_rgb(99,102,241,0.39)]"
                        : "mr-auto flex w-fit max-w-[90%] items-start gap-2"
                    }
                  >
                    {msg.role === "bot" && (
                      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-[10px] text-brand">
                        <Bot className="h-3 w-3" />
                      </div>
                    )}
                    {msg.role === "bot" ? (
                      <div className="rounded-2xl rounded-tl-sm border border-white/5 bg-slate-800/80 px-4 py-2.5 text-slate-200">
                        {msg.content}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </motion.div>
                )
              ))}
              
              {/* Typing indicator when waiting for bot */}
              {visibleItems % 2 !== 0 && visibleItems < 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-auto flex w-fit items-start gap-2">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/5 bg-slate-800/80 px-4 py-4">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.2s" }}></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.4s" }}></span>
                  </div>
                </motion.div>
              )}
            </div>

            <button style={{ transform: "translateZ(50px)" }} onClick={onStartChat} className="mt-6 w-full rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition-all hover:scale-[1.03] hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
              Open Full Experience
            </button>
          </motion.div>
          </div>
        </motion.section>

        <motion.section id="stats" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={staggerMotion} className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.article key={stat.label} variants={itemMotion} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10">
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-brand/10 blur-2xl transition-all group-hover:bg-brand/20" />
                <Icon className="mb-4 h-6 w-6 text-brand-light transition-transform group-hover:scale-110" />
                <p className="font-display text-4xl font-black text-white">
                  {typeof stat.value === "number" ? <CountUp value={stat.value} suffix={stat.suffix} /> : stat.text}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-400">{stat.label}</p>
              </motion.article>
            );
          })}
        </motion.section>

        <motion.section id="how" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={sectionMotion} className="mt-32">
          <p className="section-kicker text-brand-light">How It Works</p>
          <h2 className="section-title text-4xl">A guided flow from query to confirmed PG.</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              { title: "Share Your Requirements", desc: "Area, budget, food, and gender preference.", icon: Compass },
              { title: "AI Filters & Matches", desc: "RAG retrieval + filter scoring in real-time.", icon: Filter },
              { title: "Instant Recommendations", desc: "Detailed cards with price, rating, amenities.", icon: Sparkles },
              { title: "Connect & Confirm", desc: "Call owners and finalize quickly.", icon: PhoneCall },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.article key={step.title} variants={itemMotion} className="relative rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-sm transition-colors hover:bg-slate-800/60 border-t-white/10">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/20 text-brand shadow-lg shadow-brand/10">
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="font-display text-lg font-bold text-white">{`Step ${index + 1}`}</p>
                  <p className="mt-1 text-sm font-semibold text-brand-light">{step.title}</p>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                  {index < 3 && <div className="pointer-events-none absolute right-[-14px] top-[40%] hidden h-[2px] w-6 bg-gradient-to-r from-brand/50 to-transparent md:block" />}
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerMotion} className="mt-32">
          <p className="section-kicker text-brand-light">Problem Snapshot</p>
          <h2 className="section-title text-4xl">Traditional PG search creates friction at every step.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { t: "Scattered Information", d: "Data spread across multiple fragmented listings and unresponsive chats.", i: Building2 },
              { t: "Mismatch After Calls", d: "Time wasted calling owners only to find out basic preferences don't align.", i: PhoneCall },
              { t: "Slow Decision Cycle", d: "Shortlisting the right accommodation takes several days instead of minutes.", i: Clock3 },
            ].map((card) => {
              const Icon = card.i;
              return (
                <motion.article key={card.t} variants={itemMotion} className="group rounded-2xl border border-white/5 bg-slate-900/40 p-7 transition-all hover:-translate-y-1 hover:border-rose-500/30 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-rose-500/5">
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-slate-800 flex h-10 w-10 text-slate-400 group-hover:bg-rose-500/20 group-hover:text-rose-400 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-200 group-hover:text-white transition-colors">{card.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{card.d}</p>
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        <motion.section id="features" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerMotion} className="mt-32">
          <p className="section-kicker text-brand-light">Feature Deep Dive</p>
          <h2 className="section-title text-4xl">Built to remove guesswork from every decision.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.article key={feature.title} variants={itemMotion} className="group overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 p-6 backdrop-blur-md transition-all hover:border-brand/40 hover:bg-slate-800/90 hover:shadow-xl hover:shadow-brand/5">
                  <Icon className="mb-4 h-6 w-6 text-brand-light transition-transform group-hover:scale-110" />
                  <h3 className="font-display text-base font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        <motion.section id="faq" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={sectionMotion} className="mt-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="section-kicker text-brand-light">FAQ</p>
            <h2 className="mx-auto mt-2 font-display text-4xl font-bold text-white">Everything you may want to know.</h2>
          </div>
          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {faqs.map((faq, idx) => {
              const open = faqOpen === idx;
              return (
                <article key={faq.q} className={`overflow-hidden rounded-2xl border transition-all duration-300 ${open ? 'border-brand/50 bg-slate-900/80 shadow-lg shadow-brand/5' : 'border-white/5 bg-slate-900/40 hover:bg-slate-800/60'}`}>
                  <button onClick={() => setFaqOpen(open ? -1 : idx)} className="flex w-full items-center justify-between px-5 py-5 text-left md:px-6">
                    <span className="font-bold text-white">{faq.q}</span>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform ${open ? 'rotate-180 bg-brand text-white' : 'bg-white/5 text-slate-400'}`}>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>
                  {open && <div className="border-t border-white/5 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-300 md:px-6">{faq.a}</div>}
                </article>
              );
            })}
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            <span className="font-display font-bold text-white">StayEase AI</span> · Smart PG discovery for Ahmedabad.
          </p>
          <div className="flex gap-6 font-medium">
            <a href="#how" className="transition hover:text-brand-light">How it works</a>
            <a href="#features" className="transition hover:text-brand-light">Features</a>
            <a href="#faq" className="transition hover:text-brand-light">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BriefcaseIcon(props) {
  return <Building2 {...props} />;
}
