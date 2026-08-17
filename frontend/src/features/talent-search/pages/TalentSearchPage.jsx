import PageHeader from "../../../shared/components/PageHeader.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import Avatar from "../../../shared/components/Avatar.jsx";
import Button from "../../../shared/components/Button.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import InstrumentSlider from "../components/InstrumentSlider.jsx";
import { useTalentSearchViewModel } from "../hooks/useTalentSearchViewModel.js";

const SLIDER_DEFS = [
  { key: "technicalDepth", label: "Technical Depth", description: "Hard skills & tools match" },
  { key: "experienceLevel", label: "Experience Level", description: "Years & seniority alignment" },
  { key: "skillRecency", label: "Skill Recency", description: "Timeline of core competencies" },
  { key: "domainExpertise", label: "Domain Expertise", description: "Industry & sector crossover" },
  {
    key: "culturalFit",
    label: "Cultural Fit (AI)",
    description: "Implicit trait match",
    icon: <Icon name="auto_awesome" size={12} className="text-secondary-container" />,
  },
];

/**
 * Reproduces the "ai_search_configuration" screen: a bento grid — natural-language query
 * input + a 5-slider "Algorithm Weighting" panel on the left (8/12), and a sticky "Live
 * Impact Preview" of the top matches on the right (4/12) that re-ranks as sliders move.
 */
export default function TalentSearchPage() {
  const vm = useTalentSearchViewModel();

  return (
    <div>
      <PageHeader
        title="AI Search Engine"
        subtitle="Calibrate ranking weights and semantic thresholds."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                SLIDER_DEFS.forEach((s) =>
                  vm.updateWeight(s.key, { technicalDepth: 85, experienceLevel: 60, skillRecency: 40, domainExpertise: 75, culturalFit: 25 }[s.key])
                )
              }
            >
              Reset Defaults
            </Button>
            <Button onClick={() => vm.search()}>Save Profile</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
        {/* Left: controls */}
        <div className="xl:col-span-8 flex flex-col gap-gutter">
          <section className="bg-paper border border-outline-variant/20 rounded shadow-sm p-6">
            <label className="font-label-caps text-label-caps text-on-surface-variant mb-4 block flex items-center gap-2 uppercase">
              <Icon name="psychology" size={14} />
              Semantic Query Input
            </label>
            <form
              onSubmit={(e) => (e.preventDefault(), vm.search())}
              className="relative"
            >
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input
                value={vm.query}
                onChange={(e) => vm.setQuery(e.target.value)}
                placeholder="e.g. Find senior backend engineers with extensive distributed systems experience in the fintech sector..."
                className="w-full pl-12 pr-4 py-4 bg-surface rounded border border-outline-variant/30 focus:border-primary text-on-background font-body-lg placeholder:text-outline/50 outline-none transition-colors"
              />
            </form>
            {vm.parsedFilters && (
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="px-2 py-1 bg-surface-container border border-outline-variant/20 rounded font-data-mono text-[11px] text-on-surface-variant flex items-center gap-1">
                  <Icon name="auto_awesome" size={12} className="text-secondary-container" /> AI Parsed
                </span>
                {Object.entries(vm.parsedFilters).flatMap(([category, values]) =>
                  (values ?? []).map((value) => (
                    <button
                      key={`${category}-${value}`}
                      onClick={() => vm.removeFilter(category, value)}
                      className="px-2 py-1 bg-surface-container border border-outline-variant/20 rounded font-data-mono text-[11px] text-on-surface-variant flex items-center gap-1"
                    >
                      {category}: {value}
                      <Icon name="close" size={12} />
                    </button>
                  ))
                )}
              </div>
            )}
          </section>

          <section className="bg-paper border border-outline-variant/20 rounded shadow-sm">
            <div className="p-6 hairline-b">
              <div className="flex justify-between items-center">
                <h2 className="font-display-sm text-display-sm text-on-background flex items-center gap-2">
                  <Icon name="equalizer" />
                  Algorithm Weighting
                </h2>
                <span className="font-data-mono text-data-mono text-outline">v2.4.1 (Stable)</span>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-1">Adjust the relative importance of specific candidate vectors.</p>
            </div>
            <div>
              {SLIDER_DEFS.map((s) => (
                <InstrumentSlider
                  key={s.key}
                  label={s.label}
                  description={s.description}
                  icon={s.icon}
                  value={vm.weights[s.key]}
                  onChange={(v) => vm.updateWeight(s.key, v)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right: live preview */}
        <div className="xl:col-span-4 flex flex-col gap-gutter">
          <section className="bg-paper border border-outline-variant/20 rounded shadow-sm flex flex-col xl:sticky xl:top-margin-desktop">
            <div className="p-4 hairline-b bg-surface-container/50 flex justify-between items-center rounded-t">
              <h3 className="font-display-sm text-[16px] text-on-background flex items-center gap-2">
                <Icon name="visibility" size={18} />
                Live Impact Preview
              </h3>
              <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-label-caps text-on-surface">
                TOP 3 MATCHES
              </span>
            </div>
            {vm.results.length === 0 ? (
              <div className="p-md">
                <EmptyState
                  icon="travel_explore"
                  title="Run a search"
                  description="Type a query on the left to see ranked matches update live as you tune the weights."
                />
              </div>
            ) : (
              <>
                <div className="max-h-[420px] overflow-y-auto">
                  {vm.results.slice(0, 3).map((candidate, i) => (
                    <div key={candidate.candidateId} className="p-4 hairline-b hover:bg-surface-container-low transition-colors flex gap-4 items-start relative last:border-b-0">
                      {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-secondary-container opacity-80" />}
                      <Avatar name={candidate.fullName} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-body-md font-medium text-on-background truncate">{candidate.fullName}</h4>
                          <span className="font-data-mono text-secondary text-[12px] font-bold">{candidate.overallScore}%</span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant truncate mb-2">{candidate.currentTitle || "—"}</p>
                        <p className="text-body-sm text-on-surface-variant truncate">{candidate.reasonSummary}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 hairline-t bg-surface text-center border-t border-outline-variant/20">
                  <a href="/candidates" className="text-body-sm text-primary hover:text-primary-container transition-colors flex items-center justify-center gap-1">
                    View Full Result Set ({vm.results.length})
                    <Icon name="arrow_forward" size={14} />
                  </a>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
