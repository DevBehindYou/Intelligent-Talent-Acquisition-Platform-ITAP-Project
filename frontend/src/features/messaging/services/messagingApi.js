import axiosClient from "../../../shared/lib/axiosClient.js";

export const messagingApi = {
  async draft({ candidateId, jobId, tone, length }) {
    const { data } = await axiosClient.post("/messaging/draft", { candidateId, jobId, tone, length });
    return data.data;
  },
  async send({ candidateId, subject, body }) {
    const { data } = await axiosClient.post("/messaging/send", { candidateId, subject, body });
    return data.data;
  },
};
