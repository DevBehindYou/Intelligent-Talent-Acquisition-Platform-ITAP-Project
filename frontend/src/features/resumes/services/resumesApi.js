import axiosClient from "../../../shared/lib/axiosClient.js";

export const resumesApi = {
  async uploadBulk(jobId, files, onUploadProgress) {
    const formData = new FormData();
    formData.append("jobId", jobId);
    files.forEach((file) => formData.append("files", file));
    const { data } = await axiosClient.post("/resumes/bulk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return data.data;
  },
};
