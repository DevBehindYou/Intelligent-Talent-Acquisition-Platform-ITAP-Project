import axiosClient from "../../../shared/lib/axiosClient.js";

export const talentSearchApi = {
  async search(query, weights) {
    const { data } = await axiosClient.post("/talent-search", { query, weights });
    return data.data;
  },
  async listPools() {
    const { data } = await axiosClient.get("/talent-pools");
    return data.data;
  },
  async createPool(payload) {
    const { data } = await axiosClient.post("/talent-pools", payload);
    return data.data;
  },
};
