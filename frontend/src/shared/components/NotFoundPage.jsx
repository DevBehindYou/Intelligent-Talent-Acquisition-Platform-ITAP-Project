import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-sm text-center p-lg">
      <Icon name="explore_off" size={40} className="text-outline" />
      <h1 className="font-display-lg text-display-lg text-on-surface">Page not found</h1>
      <p className="text-body-md text-on-surface-variant">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
      <Link to="/" className="text-prussian hover:underline mt-sm">
        Back to dashboard
      </Link>
    </div>
  );
}
