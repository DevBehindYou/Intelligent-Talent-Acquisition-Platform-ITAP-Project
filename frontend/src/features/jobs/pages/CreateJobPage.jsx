import PageHeader from "../../../shared/components/PageHeader.jsx";
import Breadcrumbs from "../../../shared/components/Breadcrumbs.jsx";
import JobForm from "../components/JobForm.jsx";
import { useParams } from "react-router-dom";

export default function CreateJobPage() {
  const { jobId } = useParams();
  return (
    <div>
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Jobs", to: "/jobs" }, { label: jobId ? "Edit job" : "New job" }]} />}
        title={jobId ? "Edit job requisition" : "New job requisition"}
      />
      <JobForm />
    </div>
  );
}
