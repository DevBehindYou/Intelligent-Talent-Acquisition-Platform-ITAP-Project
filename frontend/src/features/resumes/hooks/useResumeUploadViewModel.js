import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { resumesApi } from "../services/resumesApi.js";
import { connectSocket } from "../../../shared/lib/socketClient.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

export function useResumeUploadViewModel() {
  const { jobId } = useParams();
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const [files, setFiles] = useState([]); // [{ file, status, error }]
  const [batch, setBatch] = useState(null); // { batchId, processed, total }
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const socket = connectSocket();
    function onProgress(payload) {
      setBatch((prev) => (prev && prev.batchId === payload.batchId ? { ...prev, ...payload } : prev));
    }
    socket.on("resume-batch:progress", onProgress);
    return () => socket.off("resume-batch:progress", onProgress);
  }, []);

  function addFiles(fileList) {
    const accepted = Array.from(fileList).filter((f) => /\.(pdf|docx|txt)$/i.test(f.name));
    setFiles((prev) => [...prev, ...accepted.map((file) => ({ file, status: "queued" }))]);
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.file.name !== name));
  }

  async function submit() {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const result = await resumesApi.uploadBulk(
        jobId,
        files.map((f) => f.file)
      );
      setBatch({ batchId: result.batchId, processed: 0, total: result.totalFiles });
      pushToast({ tone: "success", message: `Uploading ${result.totalFiles} resumes — parsing will start shortly.` });
    } catch {
      pushToast({ tone: "danger", message: "Upload failed. Check your connection and try again." });
    } finally {
      setIsUploading(false);
    }
  }

  return { jobId, files, addFiles, removeFile, submit, isUploading, batch };
}
