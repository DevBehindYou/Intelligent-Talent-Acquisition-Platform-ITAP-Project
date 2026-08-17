import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import DataTable from "../../../shared/components/DataTable.jsx";
import Avatar from "../../../shared/components/Avatar.jsx";
import MatchDial from "../../../shared/components/MatchDial.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { useCandidateListViewModel } from "../hooks/useCandidateListViewModel.js";

const columns = [
  {
    accessorKey: "fullName",
    header: "Candidate",
    cell: ({ row }) => (
      <div className="flex items-center gap-sm">
        <Avatar name={row.original.fullName} size={28} />
        <div>
          <p className="text-body-md text-on-surface font-medium">{row.original.fullName}</p>
          <p className="text-body-sm text-on-surface-variant">{row.original.currentTitle || "—"}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "totalExperienceYears",
    header: "Experience",
    cell: ({ getValue }) => <span className="text-body-sm text-on-surface-variant">{getValue() ?? "—"} yrs</span>,
  },
  {
    accessorKey: "skills",
    header: "Top skills",
    cell: ({ getValue }) => (
      <span className="text-body-sm text-on-surface-variant">
        {(getValue() ?? []).slice(0, 3).map((s) => s.name).join(", ") || "—"}
      </span>
    ),
  },
  {
    accessorKey: "bestMatchScore",
    header: "Best match",
    cell: ({ getValue }) => <MatchDial score={getValue() ?? 0} size="sm" />,
  },
];

export default function CandidateListPage() {
  const navigate = useNavigate();
  const { candidates, isLoading, search, setSearch } = useCandidateListViewModel();

  return (
    <div>
      <PageHeader title="Candidates" subtitle="Your organization's full talent pool, across every job." />
      <FilterBar search={search} onSearchChange={setSearch} />
      <DataTable
        columns={columns}
        data={candidates}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/candidates/${row._id}`)}
        emptyState={{
          icon: "groups",
          title: "No candidates yet",
          description: "Candidates appear here once resumes have been uploaded to a job.",
          actionLabel: "Go to Jobs",
          onAction: () => navigate("/jobs"),
        }}
      />
    </div>
  );
}
