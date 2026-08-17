import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

// docs/01-technical-architecture.md §6 ("Core Data Flow — Resume → Ranked Candidate").
// Embedding generation is folded into this same job (see processor.js) rather than split
// into a second `embeddingGeneration.queue.js` hop, to keep the scaffold's job graph simple;
// splitting it out later is a matter of adding a second `.add()` call at the marked point.
export const resumeParsingQueue = new Queue("resume-parsing", { connection: redisConnection });
