import Icon from "../../../shared/components/Icon.jsx";

// Matches the visual language of the rest of the app (ink sidebar look, brass accent)
// even though there's no sidebar on these unauthenticated screens.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-ink text-white flex-col justify-between p-xl">
        <div className="flex items-center gap-sm">
          <div className="w-9 h-9 rounded bg-secondary-fixed-dim flex items-center justify-center">
            <Icon name="radar" className="text-ink" />
          </div>
          <span className="font-display-md text-display-md">ITAP</span>
        </div>
        <div>
          <p className="font-display-lg text-display-lg leading-snug max-w-md">
            Measure the signal, not just the resume.
          </p>
          <p className="text-body-lg text-white/60 mt-md max-w-md">
            Explainable AI ranking, semantic candidate matching, and recruiter analytics —
            built to keep a human in control of every decision.
          </p>
        </div>
        <p className="text-body-sm text-white/40">© {new Date().getFullYear()} ITAP</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-lg">
        <div className="w-full max-w-sm">
          <h1 className="font-display-lg text-display-lg text-on-surface mb-1">{title}</h1>
          {subtitle && <p className="text-body-md text-on-surface-variant mb-lg">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
