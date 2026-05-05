"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { AdminModal } from "../components/AdminModal";
import { showToast } from "../components/AdminToast";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface SkillCategory {
  id: string;
  title: string;
  skills: { name: string }[];
  order: number;
}

export default function SkillsPage() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Category editor
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([""]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<SkillCategory | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(query(collection(db, "skills"), orderBy("order", "asc")));
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SkillCategory)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setIsEditing(false); setEditId(null); setCategoryTitle(""); setSkills([""]); };

  const startEdit = (cat: SkillCategory) => {
    setIsEditing(true);
    setEditId(cat.id);
    setCategoryTitle(cat.title);
    setSkills(cat.skills?.map((s) => s.name) || [""]);
  };

  const handleSave = async () => {
    if (!categoryTitle.trim()) { showToast("error", "Nama kategori wajib diisi."); return; }
    setSaving(true);
    try {
      const id = editId || `skill_${Date.now()}`;
      const filteredSkills = skills.filter((s) => s.trim()).map((s) => ({ name: s.trim() }));
      await setDoc(doc(db, "skills", id), {
        title: categoryTitle.trim(),
        skills: filteredSkills,
        order: editId ? (categories.find((c) => c.id === editId)?.order || 0) : categories.length,
      });
      showToast("success", editId ? "Berhasil diupdate!" : "Berhasil ditambahkan!");
      resetForm(); await fetchData();
    } catch (err) { showToast("error", "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDoc(doc(db, "skills", deleteTarget.id)); showToast("success", "Berhasil dihapus."); setDeleteTarget(null); await fetchData(); }
    catch (err) { showToast("error", "Gagal menghapus."); }
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const addSkill = () => setSkills([...skills, ""]);
  const removeSkill = (index: number) => setSkills(skills.filter((_, i) => i !== index));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Keahlian</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola kategori dan skill kamu.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-accent text-accent-foreground text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all shadow-md hover:shadow-accent/20 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Kategori
          </button>
        )}
      </div>

      {isEditing && (
        <AdminCard title={editId ? "Edit Kategori" : "Tambah Kategori Baru"}>
          <div className="space-y-5">
            <AdminFormField label="Nama Kategori" value={categoryTitle} onChange={setCategoryTitle} placeholder="Tech Stack, Soft Skills, Tools, dll." required />

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Skills</label>
              <div className="space-y-2">
                {skills.map((skill, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => updateSkill(i, e.target.value)}
                      placeholder={`Skill ${i + 1}`}
                      className="flex-1 p-2.5 rounded-xl bg-background/50 border border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none text-sm transition-all"
                    />
                    {skills.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeSkill(i)} 
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={addSkill} 
                className="text-xs text-accent hover:text-accent/80 font-semibold transition-colors"
              >
                + Tambah skill
              </button>
            </div>

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
                {saving ? "Menyimpan..." : editId ? "Update Kategori" : "Simpan Kategori"}
              </button>
            </div>
          </div>
        </AdminCard>
      )}

      {categories.length === 0 && !isEditing ? (
        <AdminCard>
          <div className="text-center py-10">
            <p className="text-xs text-muted-foreground">Belum ada kategori skill. Klik "Tambah Kategori" untuk memulai.</p>
          </div>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <AdminCard key={cat.id} className="group border-border/50">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-foreground leading-tight">{cat.title}</h3>
                <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => startEdit(cat)} 
                    className="p-1.5 text-accent bg-accent/5 rounded-lg hover:bg-accent/10 border border-accent/10 transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setDeleteTarget(cat)} 
                    className="p-1.5 text-red-500 bg-red-500/5 rounded-lg hover:bg-red-500/10 border border-red-500/10 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.skills?.map((skill, i) => (
                  <span 
                    key={i} 
                    className="px-2.5 py-1 text-[10px] font-semibold bg-accent/5 text-accent rounded-md border border-accent/10"
                  >
                    {skill.name}
                  </span>
                ))}
                {(!cat.skills || cat.skills.length === 0) && (
                  <p className="text-[10px] text-muted-foreground font-medium">Belum ada skill</p>
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Kategori?" description={`Kategori "${deleteTarget?.title}" beserta semua skill-nya akan dihapus.`} confirmText="Hapus" confirmVariant="danger" />
    </div>
  );
}
