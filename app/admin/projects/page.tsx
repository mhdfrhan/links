"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { AdminModal } from "../components/AdminModal";
import { ImageUploader } from "../components/ImageUploader";
import { TagInput } from "../components/TagInput";
import { showToast } from "../components/AdminToast";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  techStack: string[];
  link: string;
  order: number;
  categoryId?: string;
  subCategoryId?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  const [categories, setCategories] = useState<{id: string, name: string, subCategories?: {id: string, name: string}[]}[]>([]);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
      setCategories(snap.docs.map(d => ({ 
        id: d.id, 
        name: d.data().name,
        subCategories: d.data().subCategories || []
      })));
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const snap = await getDocs(query(collection(db, "projects"), orderBy("order", "asc")));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
      setProjects(items);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setCloudinaryPublicId("");
    setTechStack([]);
    setLink("");
    setCategoryId("");
    setSubCategoryId("");
  };

  const startEdit = (project: Project) => {
    setIsEditing(true);
    setEditId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setImageUrl(project.imageUrl || "");
    setCloudinaryPublicId(project.cloudinaryPublicId || "");
    setTechStack(project.techStack || []);
    setLink(project.link || "");
    setCategoryId(project.categoryId || "");
    setSubCategoryId(project.subCategoryId || "");
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("error", "Judul projek wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const id = editId || `project_${Date.now()}`;
      await setDoc(doc(db, "projects", id), {
        title: title.trim(),
        description: description.trim(),
        imageUrl,
        cloudinaryPublicId,
        techStack,
        link: link.trim(),
        categoryId,
        subCategoryId,
        order: editId ? (projects.find((p) => p.id === editId)?.order || 0) : projects.length,
      });
      showToast("success", editId ? "Projek berhasil diupdate!" : "Projek berhasil ditambahkan!");
      resetForm();
      await fetchProjects();
    } catch (err) {
      console.error("Error saving project:", err);
      showToast("error", "Gagal menyimpan projek.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "projects", deleteTarget.id));
      showToast("success", "Projek berhasil dihapus.");
      setDeleteTarget(null);
      await fetchProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
      showToast("error", "Gagal menghapus projek.");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Portofolio</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola projek-projek portfolio kamu.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-accent text-accent-foreground text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all shadow-md hover:shadow-accent/20 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Projek
          </button>
        )}
      </div>

      {/* Editor */}
      {isEditing && (
        <AdminCard title={editId ? "Edit Projek" : "Tambah Projek Baru"}>
          <div className="space-y-5">
            <AdminFormField label="Judul" value={title} onChange={setTitle} placeholder="Nama projek" required />
            <AdminFormField label="Deskripsi" type="textarea" value={description} onChange={setDescription} placeholder="Deskripsi singkat projek..." rows={4} maxLength={500} />
            <ImageUploader
              currentImageUrl={imageUrl}
              onUploadComplete={(url, publicId) => {
                setImageUrl(url);
                setCloudinaryPublicId(publicId);
                showToast("success", "Gambar berhasil diupload!");
              }}
              folder="portfolio/projects"
              label="Cover Image"
            />
            <TagInput tags={techStack} onChange={setTechStack} label="Tech Stack" placeholder="Ketik teknologi lalu Enter..." />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubCategoryId("");
                }}
                className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
              >
                <option value="">Pilih Kategori (Opsional)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {categoryId && categories.find(c => c.id === categoryId)?.subCategories?.length ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-foreground">Sub-Kategori</label>
                <select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
                >
                  <option value="">Pilih Sub-Kategori (Opsional)</option>
                  {categories.find(c => c.id === categoryId)?.subCategories?.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <AdminFormField label="Link URL" type="url" value={link} onChange={setLink} placeholder="https://example.com" hint="Link ke live demo atau repository (opsional)" />

            <div className="flex gap-2 pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted/50 border border-border/50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-accent text-accent-foreground text-xs font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-70 transition-all shadow-md hover:shadow-accent/20"
              >
                {saving ? "Menyimpan..." : editId ? "Update Projek" : "Simpan Projek"}
              </button>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Project List */}
      {projects.length === 0 && !isEditing ? (
        <AdminCard>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Belum ada projek. Klik "Tambah Projek" untuk memulai.</p>
          </div>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <AdminCard key={project.id} className="group border-border/50">
              {project.imageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-4 -mt-1 bg-muted/20">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <h3 className="font-semibold text-foreground leading-snug">{project.title}</h3>
              {project.categoryId && categories.find(c => c.id === project.categoryId) && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded-md border border-primary/20">
                    {categories.find(c => c.id === project.categoryId)?.name}
                  </span>
                  {project.subCategoryId && categories.find(c => c.id === project.categoryId)?.subCategories?.find((s: any) => s.id === project.subCategoryId) && (
                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-accent/10 text-accent rounded-md border border-accent/20">
                      {categories.find(c => c.id === project.categoryId)?.subCategories?.find((s: any) => s.id === project.subCategoryId)?.name}
                    </span>
                  )}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{project.description}</p>

              {project.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {project.techStack.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-accent/5 text-accent rounded-md border border-accent/10">
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(project)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                >
                  <PencilIcon className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(project)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <TrashIcon className="w-3 h-3" /> Hapus
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <AdminModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Projek?"
        description={`Projek "${deleteTarget?.title}" akan dihapus permanen.`}
        confirmText="Hapus"
        confirmVariant="danger"
      />
    </div>
  );
}
