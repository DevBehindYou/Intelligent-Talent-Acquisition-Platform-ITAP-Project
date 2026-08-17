import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const BUCKET = "resumes";
const LOCAL_DIR = path.join(process.cwd(), ".local-storage", "resumes");

const supabaseAdmin =
  env.supabaseUrl && env.supabaseServiceRoleKey ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey) : null;

// Resumes are private objects (docs/04-auth-security.md §5) — never a public bucket, always
// accessed via short-lived signed URLs. Falls back to local disk storage when Supabase
// credentials aren't configured, purely so this scaffold runs out of the box in dev.
export const storageService = {
  async upload(organizationId, file) {
    const objectPath = `${organizationId}/${uuid()}-${file.originalname}`;

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.storage.from(BUCKET).upload(objectPath, file.buffer, {
        contentType: file.mimetype,
      });
      if (error) throw error;
      return objectPath;
    }

    await fs.mkdir(LOCAL_DIR, { recursive: true });
    const localPath = path.join(LOCAL_DIR, objectPath.replace(/\//g, "__"));
    await fs.writeFile(localPath, file.buffer);
    logger.warn("SUPABASE_SERVICE_ROLE_KEY not set — resume stored on local disk (dev only).");
    return objectPath;
  },

  async getSignedUrl(objectPath) {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(objectPath, 60);
      if (error) throw error;
      return data.signedUrl;
    }
    return `/local-storage/${encodeURIComponent(objectPath)}`; // served by a dev-only static route
  },

  async readBuffer(objectPath) {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(objectPath);
      if (error) throw error;
      return Buffer.from(await data.arrayBuffer());
    }
    const localPath = path.join(LOCAL_DIR, objectPath.replace(/\//g, "__"));
    return fs.readFile(localPath);
  },

  // #4: called by resumeService.remove to clean up the stored file on delete.
  async delete(objectPath) {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.storage.from(BUCKET).remove([objectPath]);
      if (error) throw error;
      return;
    }
    const localPath = path.join(LOCAL_DIR, objectPath.replace(/\//g, "__"));
    await fs.unlink(localPath).catch(() => {}); // ignore ENOENT — file may already be gone
  },
};
