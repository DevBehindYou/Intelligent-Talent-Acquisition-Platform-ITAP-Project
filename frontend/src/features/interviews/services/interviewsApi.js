import axiosClient from "../../../shared/lib/axiosClient.js";

export const interviewsApi = {
  async schedule(payload) {
    const { data } = await axiosClient.post("/interviews", payload);
    return data.data;
  },
  async get(interviewId) {
    const { data } = await axiosClient.get(`/interviews/${interviewId}`);
    return data.data;
  },
  async submitFeedback(interviewId, payload) {
    const { data } = await axiosClient.post(`/interviews/${interviewId}/feedback`, payload);
    return data.data;
  },
};
