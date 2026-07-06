import { useState, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CustomCursor from "./components/CustomCursor";

// Lazy load ChatWindow for code splitting
const ChatWindow = lazy(() => import("./components/ChatWindow"));
const LandingPage = lazy(() => import("./components/LandingPage"));

/* ── Loading Fallback ──────────────────────── */
function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center animate-pulse">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-brand/20 blur-xl animate-pulse" />
        </div>
        <p className="text-sm font-medium text-slate-400 animate-pulse">Loading StayEase AI...</p>
      </div>
    </div>
  );
}

/* ── Error Boundary ────────────────────────── */
function ErrorFallback({ onRetry }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold text-white">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-400">
          We hit an unexpected error. Please try refreshing the page.
        </p>
        <button
          onClick={onRetry}
          className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <ErrorFallback onRetry={() => window.location.reload()} />;
  }

  return (
    <>
      <CustomCursor />
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          {isChatOpen ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="fixed inset-0 z-50"
            >
              <ChatWindow onBack={() => setIsChatOpen(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <LandingPage onStartChat={() => setIsChatOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </>
  );
}
