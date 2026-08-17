import { candidateService } from "../services/candidateService.js";
import { pipelineEvents } from "../sockets/pipelineEvents.js";

export const candidatesController = {
  async list(req, res) {
    const data = await candidateService.list(req.session.organizationId, {
      ...req.query,
      userId: req.session.userId,
    });
    res.json({ success: true, data });
  },

  async get(req, res) {
    const candidate = await candidateService.get(req.session.organizationId, req.params.candidateId);
    res.json({ success: true, data: candidate });
  },

  async update(req, res) {
    const candidate = await candidateService.update(req.session.organizationId, req.params.candidateId, req.body);
    res.json({ success: true, data: candidate });
  },

  async duplicates(req, res) {
    const items = await candidateService.findDuplicates(req.session.organizationId, req.params.candidateId);
    res.json({ success: true, data: items });
  },

  async moveStage(req, res) {
    const { jobId, stage } = req.body;
    const result = await candidateService.moveStage(req.session.organizationId, req.params.candidateId, {
      jobId,
      stage,
      movedBy: req.session.userId,
    });
    pipelineEvents.pipelineStageChanged(req.session.organizationId, { jobId, candidateId: req.params.candidateId, stage });
    res.json({ success: true, data: result });
  },

  async questions(req, res) {
    const items = await candidateService.questions(req.session.organizationId, req.params.candidateId, req.query.jobId);
    res.json({ success: true, data: items });
  },
};
