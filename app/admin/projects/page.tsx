"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { AdminModal } from "../components/AdminModal";
import { ImageUploader } from "../components/ImageUploader";
import { TagInput } from "../components/TagInput";
import { showToast } from "../components/AdminToast";
import { AITranslateButton } from "../components/AITranslateButton";
import { SortableItem } from "../components/SortableItem";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

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
  const [title_en, setTitleEn] = useState("");
  const [description, setDescription] = useState("");
  const [description_en, setDescriptionEn] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [fullDescription_en, setFullDescriptionEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  // Quick Add State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

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
    setTitleEn("");
    setDescription("");
    setDescriptionEn("");
    setFullDescription("");
    setFullDescriptionEn("");
    setImageUrl("");
    setCloudinaryPublicId("");
    setTechStack([]);
    setLink("");
    setCategoryId("");
    setSubCategoryId("");
  };

  // DnD sensors and handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveOrderToFirebase = async (newItems: Project[]) => {
    try {
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        const docRef = doc(db, "projects", item.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
      showToast("success", "Urutan projek berhasil disimpan!");
    } catch (error) {
      console.error(error);
      showToast("error", "Gagal menyimpan urutan.");
      fetchProjects();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((i) => i.id === active.id);
      const newIndex = projects.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(projects, oldIndex, newIndex);
      setProjects(newItems);
      saveOrderToFirebase(newItems);
    }
  };

  const startEdit = (project: Project) => {
    setIsEditing(true);
    setEditId(project.id);
    setTitle(project.title || "");
    setTitleEn(project.title_en || "");
    setDescription(project.description || "");
    setDescriptionEn(project.description_en || "");
    setFullDescription(project.fullDescription || "");
    setFullDescriptionEn(project.fullDescription_en || "");
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
        title_en: title_en.trim(),
        description: description.trim(),
        description_en: description_en.trim(),
        fullDescription: fullDescription.trim(),
        fullDescription_en: fullDescription_en.trim(),
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

  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const id = `cat_${Date.now()}`;
      await setDoc(doc(db, "categories", id), {
        name: newCategoryName.trim(),
        order: categories.length,
        subCategories: []
      });
      showToast("success", "Kategori baru ditambahkan!");
      await fetchCategories();
      setCategoryId(id);
      setIsAddingCategory(false);
      setNewCategoryName("");
      setSubCategoryId("");
    } catch (err) {
      showToast("error", "Gagal menambahkan kategori.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleQuickAddSubCategory = async () => {
    if (!newSubCategoryName.trim() || !categoryId) return;
    setSavingCategory(true);
    try {
      const cat = categories.find(c => c.id === categoryId);
      if (!cat) return;
      const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newSub = { id: subId, name: newSubCategoryName.trim() };
      const updatedSubs = [...(cat.subCategories || []), newSub];
      
      await setDoc(doc(db, "categories", categoryId), {
        subCategories: updatedSubs
      }, { merge: true });
      
      showToast("success", "Sub-Kategori baru ditambahkan!");
      await fetchCategories();
      setSubCategoryId(subId);
      setIsAddingSubCategory(false);
      setNewSubCategoryName("");
    } catch (err) {
      showToast("error", "Gagal menambahkan sub-kategori.");
    } finally {
      setSavingCategory(false);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField label="Judul (ID)" value={title} onChange={setTitle} placeholder="Nama projek (Bahasa Indonesia)" required />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Judul (EN)</label>
                  <AITranslateButton text={title} onTranslated={setTitleEn} />
                </div>
                <input
                  type="text"
                  value={title_en}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Project Name (English)"
                  className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField label="Deskripsi Singkat (ID)" type="textarea" value={description} onChange={setDescription} placeholder="Deskripsi singkat projek..." rows={3} maxLength={500} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Deskripsi Singkat (EN)</label>
                  <AITranslateButton text={description} onTranslated={setDescriptionEn} />
                </div>
                <textarea
                  value={description_en}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  rows={3}
                  placeholder="Short description..."
                  maxLength={500}
                  className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField label="Deskripsi Lengkap (ID)" type="textarea" value={fullDescription} onChange={setFullDescription} placeholder="Deskripsi lengkap untuk popup modal..." rows={6} maxLength={3000} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Deskripsi Lengkap (EN)</label>
                  <AITranslateButton text={fullDescription} onTranslated={setFullDescriptionEn} />
                </div>
                <textarea
                  value={fullDescription_en}
                  onChange={(e) => setFullDescriptionEn(e.target.value)}
                  rows={6}
                  placeholder="Full description for modal popup..."
                  maxLength={3000}
                  className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                />
              </div>
            </div>
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
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">Kategori</label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                  >
                    <PlusIcon className="w-3 h-3" /> Tambah Baru
                  </button>
                )}
              </div>
              
              {isAddingCategory ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ketik Kategori Baru..."
                    className="flex-1 p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleQuickAddCategory()}
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    disabled={savingCategory || !newCategoryName.trim()}
                    className="p-3.5 bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-all shadow-md"
                  >
                    {savingCategory ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCategory(false); setNewCategoryName(""); }}
                    className="p-3.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
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
              )}
            </div>

            {categoryId ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Sub-Kategori</label>
                  {!isAddingSubCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingSubCategory(true)}
                      className="text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                    >
                      <PlusIcon className="w-3 h-3" /> Tambah Baru
                    </button>
                  )}
                </div>

                {isAddingSubCategory ? (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <input
                      type="text"
                      value={newSubCategoryName}
                      onChange={(e) => setNewSubCategoryName(e.target.value)}
                      placeholder="Ketik Sub-Kategori Baru..."
                      className="flex-1 p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleQuickAddSubCategory()}
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddSubCategory}
                      disabled={savingCategory || !newSubCategoryName.trim()}
                      className="p-3.5 bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-all shadow-md"
                    >
                      {savingCategory ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-5 h-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingSubCategory(false); setNewSubCategoryName(""); }}
                      className="p-3.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
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
                )}
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={projects.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {projects.map((project) => (
                <SortableItem key={project.id} id={project.id}>
                  <AdminCard className="group border-border/50">
                    <div className="flex gap-4 pl-6 md:pl-8">
                      {project.imageUrl && (
                        <div className="relative w-28 h-20 md:w-40 md:h-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted/20">
                          <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
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
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{project.description}</p>
                            {project.techStack?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {project.techStack.slice(0, 4).map((tech, i) => (
                                  <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-accent/5 text-accent rounded-md border border-accent/10">
                                    {tech}
                                  </span>
                                ))}
                                {project.techStack.length > 4 && (
                                  <span className="px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-md">
                                    +{project.techStack.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1.5 opacity-100 transition-all flex-shrink-0 ml-4 relative z-20">
                            <button
                              onClick={() => startEdit(project)}
                              className="p-1.5 text-accent bg-accent/5 rounded-lg hover:bg-accent/10 border border-accent/10 transition-colors"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(project)}
                              className="p-1.5 text-red-500 bg-red-500/5 rounded-lg hover:bg-red-500/10 border border-red-500/10 transition-colors"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AdminCard>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
