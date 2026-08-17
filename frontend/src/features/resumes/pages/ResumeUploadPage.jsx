import { useParams } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader.jsx";
import Breadcrumbs from "../../../shared/components/Breadcrumbs.jsx";
import ResumeUploader from "../components/ResumeUploader.jsx";
import { useResumeUploadViewModel } from "../hooks/useResumeUploadViewModel.js";

export default function ResumeUploadPage() {
  const { jobId } = useParams();
  const vm = useResumeUploadViewModel();

  return (
    <div>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Jobs", to: "/jobs" }, { label: "Job", to: `/jobs/${jobId}` }, { label: "Upload resumes" }]} />}
        title="Upload resumes"
        subtitle="Resumes are parsed, scored, and ranked automatically once uploaded."
      />
      <ResumeUploader
        files={vm.files}
        onAddFiles={vm.addFiles}
        onRemoveFile={vm.removeFile}
        onSubmit={vm.submit}
        isUploading={vm.isUploading}
        batch={vm.batch}
      />
    </div>
  );
}
