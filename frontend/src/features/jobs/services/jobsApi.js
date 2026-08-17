import axiosClient from "../../../shared/lib/axiosClient.js";

export const jobsApi = {
  async list(params = {}) {
    const { data } = await axiosClient.get("/jobs", { params });
    return data.data;
  },
  async get(jobId) {
    const { data } = await axiosClient.get(`/jobs/${jobId}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await axiosClient.post("/jobs", payload);
    return data.data;
  },
  async update(jobId, payload) {
    const { data } = await axiosClient.patch(`/jobs/${jobId}`, payload);
    return data.data;
  },
  async archive(jobId) {
    await axiosClient.delete(`/jobs/${jobId}`);
  },
  async rankings(jobId, params = {}) {
    const { data } = await axiosClient.get(`/jobs/${jobId}/rankings`, { params });
    return data.data;
  },
};
