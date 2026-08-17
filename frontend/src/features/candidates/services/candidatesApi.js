import axiosClient from "../../../shared/lib/axiosClient.js";

export const candidatesApi = {
  async list(params = {}) {
    const { data } = await axiosClient.get("/candidates", { params });
    return data.data;
  },
  async get(candidateId) {
    const { data } = await axiosClient.get(`/candidates/${candidateId}`);
    return data.data;
  },
  async update(candidateId, payload) {
    const { data } = await axiosClient.patch(`/candidates/${candidateId}`, payload);
    return data.data;
  },
  async duplicates(candidateId) {
    const { data } = await axiosClient.get(`/candidates/${candidateId}/duplicates`);
    return data.data;
  },
  async moveStage(candidateId, { jobId, stage }) {
    const { data } = await axiosClient.post(`/candidates/${candidateId}/stage`, { jobId, stage });
    return data.data;
  },
  async questions(candidateId, jobId) {
    const { data } = await axiosClient.get(`/candidates/${candidateId}/questions`, { params: { jobId } });
    return data.data;
  },
};
