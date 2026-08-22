import { useRef } from "react";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Button from "../../../shared/components/Button.jsx";
import Badge from "../../../shared/components/Badge.jsx";
import EmptyState from "../../../shared/components/EmptyState.jsx";
import Icon from "../../../shared/components/Icon.jsx";
import { SkeletonCard } from "../../../shared/components/Skeleton.jsx";
import { useCandidateResumesViewModel } from "../hooks/useCandidateResumesViewModel.js";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Turn the API's download path into something openable from the SPA origin. Supabase returns an
// absolute signed URL; the dev local-disk fallback returns a path served by the API origin.
function toOpenableUrl(url) {
  if (!url || url.startsWith("http")) return url;
  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");
  return `${base}${url}`;
}

export default function CandidateResumesPage() {
  const { resumes, isLoading, upload, isUploading, setPrimary, remove, getDownloadUrl } =
    useCandidateResumesViewModel();
  const fileRef = useRef(null);

  function onFilePicked(e) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = ""; // allow re-uploading the same filename
  }

  async function onDownload(id) {
    const url = await getDownloadUrl(id);
    window.open(toOpenableUrl(url), "_blank", "noopener");
  }

  return (
    <div>
      <PageHeader
        title="Resumes"
        subtitle="Upload one or more resumes and pick a default for applications."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={onFilePicked}
            />
            <Button leftIcon="upload" isLoading={isUploading} onClick={() => fileRef.current?.click()}>
              Upload resume
            </Button>
          </>
        }
      />

      {isLoading ? (
        <SkeletonCard />
      ) : resumes.length === 0 ? (
        <EmptyState
          icon="description"
          title="No resumes yet"
          description="Upload a PDF, DOCX, or TXT to apply to jobs faster."
        />
      ) : (
        <div className="flex flex-col gap-sm">
          {resumes.map((r) => (
            <div
              key={r._id}
              className="flex items-center justify-between gap-md rounded-xl border border-outline-variant/40 bg-paper p-md"
            >
              <div className="flex items-center gap-md min-w-0">
                <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <Icon name="description" className="text-on-surface-variant" />
                </div>
                <div className="min-w-0">
                  <p className="text-body-md text-on-surface font-medium truncate">{r.fileName}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    {[r.fileType?.toUpperCase(), formatSize(r.size)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {r.isPrimary && <Badge tone="success">Primary</Badge>}
              </div>
              <div className="flex items-center gap-xs flex-shrink-0">
                {!r.isPrimary && (
                  <Button variant="ghost" size="sm" onClick={() => setPrimary(r._id)}>
                    Set primary
                  </Button>
                )}
                <Button variant="ghost" size="sm" leftIcon="download" onClick={() => onDownload(r._id)} aria-label="Download" />
                <Button variant="ghost" size="sm" leftIcon="delete" onClick={() => remove(r._id)} aria-label="Delete" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
