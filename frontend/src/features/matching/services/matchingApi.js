import axiosClient from "../../../shared/lib/axiosClient.js";

export const matchingApi = {
  async rankings(jobId, params = {}) {
    const { data } = await axiosClient.get(`/jobs/${jobId}/rankings`, { params });
    return data.data;
  },
  async explanation(jobId, candidateId) {
    const { data } = await axiosClient.get(`/jobs/${jobId}/rankings/${candidateId}/explanation`);
    return data.data;
  },
  async updateWeights(jobId, weights) {
    const { data } = await axiosClient.patch(`/jobs/${jobId}/scoring-weights`, weights);
    return data.data;
  },
  async recompute(jobId) {
    const { data } = await axiosClient.post(`/matching/recompute/${jobId}`);
    return data.data;
  },
};
