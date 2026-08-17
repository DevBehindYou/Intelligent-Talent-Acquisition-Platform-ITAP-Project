import AppProviders from "./app/providers/AppProviders.jsx";
import AppRoutes from "./app/routes.jsx";

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
