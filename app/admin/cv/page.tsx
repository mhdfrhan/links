"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { uploadRawToCloudinary } from "@/lib/cloudinary/config";
import { AdminCard } from "../components/AdminCard";
import { AdminModal } from "../components/AdminModal";
import { showToast } from "../components/AdminToast";
import {
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface CvEntry {
  url: string;
  cloudinaryPublicId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

interface CvData {
  id?: CvEntry;
  en?: CvEntry;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function CvPage() {
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<"id" | "en" | null>(null);

  useEffect(() => {
    fetchCvData();
  }, []);

  const fetchCvData = async () => {
    try {
      const snap = await getDoc(doc(db, "portfolio", "cv"));
      if (snap.exists()) {
        setCvData(snap.data() as CvData);
      } else {
        setCvData(null);
      }
    } catch (err) {
      console.error("Error fetching CV data:", err);
      showToast("error", "Gagal memuat data CV.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const entry = deleteTarget === "id" ? cvData?.id : cvData?.en;

    try {
      // 1. Hapus file dari Cloudinary (jika ada publicId)
      if (entry?.cloudinaryPublicId) {
        const res = await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: entry.cloudinaryPublicId,
            resourceType: "raw",
          }),
        });

        const result = await res.json();
        // Lanjutkan meskipun Cloudinary tidak menemukan file (sudah terhapus manual)
        if (!res.ok && result.detail?.result !== "not found") {
          throw new Error(result.error || "Gagal menghapus dari Cloudinary");
        }
      }

      // 2. Hapus referensi dari Firestore
      await setDoc(
        doc(db, "portfolio", "cv"),
        { [deleteTarget]: deleteField() },
        { merge: true }
      );

      showToast("success", `CV ${deleteTarget === "id" ? "Indonesia" : "English"} berhasil dihapus.`);
      setDeleteTarget(null);
      await fetchCvData();
    } catch (err: any) {
      console.error("Error deleting CV:", err);
      showToast("error", err.message || "Gagal menghapus CV.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
          CV / Resume
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kelola file CV dalam bahasa Indonesia dan Inggris. Maks 5MB per file (PDF).
        </p>
      </div>

      {/* CV Indonesia */}
      <CvUploadCard
        lang="id"
        label="CV Bahasa Indonesia"
        flag="🇮🇩"
        entry={cvData?.id || null}
        onUploadSuccess={fetchCvData}
        onDelete={() => setDeleteTarget("id")}
      />

      {/* CV English */}
      <CvUploadCard
        lang="en"
        label="CV English"
        flag="🇬🇧"
        entry={cvData?.en || null}
        onUploadSuccess={fetchCvData}
        onDelete={() => setDeleteTarget("en")}
      />

      {/* Delete Modal */}
      <AdminModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus CV?"
        description={`CV ${deleteTarget === "id" ? "Bahasa Indonesia" : "English"} akan dihapus. Pengunjung tidak bisa mendownload CV ini lagi.`}
        confirmText="Hapus"
        confirmVariant="danger"
      />
    </div>
  );
}

/* ================================================================
   CvUploadCard — Komponen per-bahasa
   Upload, preview, download, hapus
   ================================================================ */

function CvUploadCard({
  lang,
  label,
  flag,
  entry,
  onUploadSuccess,
  onDelete,
}: {
  lang: "id" | "en";
  label: string;
  flag: string;
  entry: CvEntry | null;
  onUploadSuccess: () => void;
  onDelete: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");

    // Validasi tipe
    if (file.type !== "application/pdf") {
      setError("Hanya file PDF yang diperbolehkan.");
      return;
    }

    // Validasi ukuran
    if (file.size > MAX_FILE_SIZE) {
      setError(`Ukuran file melebihi batas 5MB. File ini: ${formatFileSize(file.size)}`);
      return;
    }

    // Upload ke Cloudinary
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadRawToCloudinary(file, {
        folder: "portfolio/cv",
        onProgress: setUploadProgress,
      });

      // Simpan metadata ke Firestore
      await setDoc(
        doc(db, "portfolio", "cv"),
        {
          [lang]: {
            url: result.secure_url,
            cloudinaryPublicId: result.public_id,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          },
        },
        { merge: true }
      );

      showToast("success", `${label} berhasil diupload!`);
      onUploadSuccess();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Gagal mengupload file.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <AdminCard title={`${flag} ${label}`}>
      <div className="space-y-4">
        {/* Status indikator */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${entry ? "bg-green-500" : "bg-muted-foreground/30"}`}
          />
          <span className="text-xs text-muted-foreground">
            {entry ? "Sudah diupload" : "Belum diupload"}
          </span>
        </div>

        {/* File info jika sudah ada */}
        {entry && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-red-500/70 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.fileName}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{formatFileSize(entry.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(entry.uploadedAt)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              {/* Preview */}
              <button
                onClick={() => window.open(entry.url, "_blank")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <EyeIcon className="w-3.5 h-3.5" />
                Preview
              </button>

              {/* Download */}
              <a
                href={entry.url}
                download={entry.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/5 rounded-lg border border-accent/20 hover:bg-accent/10 transition-colors"
              >
                <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                Download
              </a>

              {/* Hapus */}
              <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-500/5 rounded-lg border border-red-500/10 hover:bg-red-500/10 transition-colors ml-auto"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        )}

        {/* Upload area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isDragOver
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50 hover:bg-accent/5"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              // Reset input agar file yang sama bisa dipilih ulang
              e.target.value = "";
            }}
          />

          <div className="space-y-2 py-2">
            <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {entry ? "Ganti file CV" : "Upload file CV"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF (maks 5MB). Drag & drop atau klik untuk browse.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Mengupload...</span>
              <span className="font-medium text-accent">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </AdminCard>
  );
}
