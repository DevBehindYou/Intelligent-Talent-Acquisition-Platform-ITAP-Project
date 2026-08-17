import axiosClient from "../../../shared/lib/axiosClient.js";

export const analyticsApi = {
  async dashboard() {
    const { data } = await axiosClient.get("/analytics/dashboard");
    return data.data;
  },
  async timeToHire() {
    const { data } = await axiosClient.get("/analytics/time-to-hire");
    return data.data;
  },
  async skillDemand() {
    const { data } = await axiosClient.get("/analytics/skill-demand");
    return data.data;
  },
};
