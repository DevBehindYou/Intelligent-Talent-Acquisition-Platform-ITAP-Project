import { useRef, useState } from "react";
import Icon from "../../../shared/components/Icon.jsx";
import Button from "../../../shared/components/Button.jsx";
import clsx from "clsx";

/**
 * Drag-and-drop + file picker for bulk resume upload — docs/07 §6 (ResumeUploader) and
 * docs/06 §2.1. Never silently drops a rejected file: unsupported types are simply not
 * added, but every accepted file gets a visible row with its status.
 */
export default function ResumeUploader({ files, onAddFiles, onRemoveFile, onSubmit, isUploading, batch }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    onAddFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-md">
      <div
        onDragOver={(e) => (e.preventDefault(), setIsDragging(true))}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          "border-2 border-dashed rounded-xl p-xl flex flex-col items-center justify-center gap-sm cursor-pointer transition-colors",
          isDragging ? "border-prussian bg-prussian/5" : "border-outline-variant/50 hover:border-prussian/50"
        )}
      >
        <Icon name="upload_file" size={32} className="text-outline" />
        <p className="text-body-md text-on-surface">Drag & drop resumes here, or click to browse</p>
        <p className="text-body-sm text-on-surface-variant">PDF, DOCX, or TXT — up to 500 files at once</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => onAddFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="rounded-xl border border-outline-variant/40 divide-y divide-outline-variant/20 max-h-64 overflow-y-auto">
          {files.map(({ file, status, error }) => (
            <div key={file.name} className="flex items-center gap-sm px-md py-sm">
              <Icon name="description" size={18} className="text-outline" />
              <span className="text-body-sm text-on-surface flex-1 truncate">{file.name}</span>
              <span className="text-body-sm text-on-surface-variant">{(file.size / 1024).toFixed(0)} KB</span>
              {error ? (
                <span className="text-body-sm text-danger">{error}</span>
              ) : (
                <span className="text-body-sm text-on-surface-variant capitalize">{status}</span>
              )}
              <button onClick={() => onRemoveFile(file.name)} aria-label={`Remove ${file.name}`} className="text-outline hover:text-danger">
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {batch && (
        <div>
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant mb-1">
            <span>
              Parsing {batch.processed}/{batch.total}…
            </span>
            <span>{Math.round((batch.processed / batch.total) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-full bg-prussian rounded-full transition-all duration-300"
              style={{ width: `${(batch.processed / batch.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button leftIcon="cloud_upload" isLoading={isUploading} disabled={files.length === 0} onClick={onSubmit}>
          Upload {files.length > 0 ? `${files.length} resumes` : ""}
        </Button>
      </div>
    </div>
  );
}
