import Icon from "../../../shared/components/Icon.jsx";

// Candidate-facing auth screen. Same design language as the staff AuthLayout but with
// job-seeker copy, so the two portals read as distinct products.
export default function CandidateAuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-ink text-white flex-col justify-between p-xl">
        <div className="flex items-center gap-sm">
          <div className="w-9 h-9 rounded bg-secondary-fixed-dim flex items-center justify-center">
            <Icon name="badge" className="text-ink" />
          </div>
          <span className="font-display-md text-display-md">ITAP Careers</span>
        </div>
        <div>
          <p className="font-display-lg text-display-lg leading-snug max-w-md">Find a role that fits you.</p>
          <p className="text-body-lg text-white/60 mt-md max-w-md">
            One profile, one resume, every application tracked in real time — from applied to offer.
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
