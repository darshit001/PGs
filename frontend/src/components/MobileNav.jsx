import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, Sparkles } from "lucide-react";

export default function MobileNav({ onStartChat }) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const links = [
    { label: "How it works", href: "#how" },
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
  ];

  const menuVariants = {
    closed: { x: "100%", opacity: 0 },
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { x: "100%", opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
  };

  const itemVariants = {
    closed: { opacity: 0, x: 30 },
    open: (i) => ({
      opacity: 1, x: 0,
      transition: { delay: 0.1 + i * 0.07, duration: 0.35, ease: "easeOut" },
    }),
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition-colors hover:bg-white/10"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="exit"
              className="fixed right-0 top-0 z-[100] flex h-full w-[280px] flex-col bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-display text-sm font-bold text-white">StayEase AI</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Links */}
              <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
                {links.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    custom={i}
                    variants={itemVariants}
                    initial="closed"
                    animate="open"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              {/* CTA */}
              <div className="border-t border-white/10 px-4 py-5">
                <motion.button
                  custom={links.length}
                  variants={itemVariants}
                  initial="closed"
                  animate="open"
                  onClick={() => { setIsOpen(false); onStartChat(); }}
                  className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-dark px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-transform hover:scale-[1.02]"
                >
                  Start Chat Search
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
