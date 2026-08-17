import axiosClient from "../../../shared/lib/axiosClient.js";

export const pipelineApi = {
  async list(jobId, params = {}) {
    const { data } = await axiosClient.get(`/jobs/${jobId}/pipeline`, { params });
    return data.data;
  },
  async moveStage(candidateId, { jobId, stage }) {
    const { data } = await axiosClient.post(`/candidates/${candidateId}/stage`, { jobId, stage });
    return data.data;
  },
  async bulkMoveStage(candidateIds, { jobId, stage }) {
    await Promise.all(candidateIds.map((id) => pipelineApi.moveStage(id, { jobId, stage })));
  },
};
