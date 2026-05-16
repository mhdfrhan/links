"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { AdminModal } from "../components/AdminModal";
import { showToast } from "../components/AdminToast";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

export interface ProjectSubCategory {
  id: string;
  name: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  order: number;
  subCategories?: ProjectSubCategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [subCategories, setSubCategories] = useState<ProjectSubCategory[]>([]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ProjectCategory | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectCategory)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setIsEditing(false); setEditId(null); setCategoryName(""); setSubCategories([]); };

  const startEdit = (cat: ProjectCategory) => {
    setIsEditing(true);
    setEditId(cat.id);
    setCategoryName(cat.name);
    setSubCategories(cat.subCategories || []);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) { showToast("error", "Nama kategori wajib diisi."); return; }
    setSaving(true);
    try {
      const id = editId || `cat_${Date.now()}`;
      const filteredSubs = subCategories
        .map(s => ({ id: s.id, name: s.name.trim() }))
        .filter(s => s.name !== "");

      await setDoc(doc(db, "categories", id), {
        name: categoryName.trim(),
        subCategories: filteredSubs,
        order: editId ? (categories.find((c) => c.id === editId)?.order || 0) : categories.length,
      });
      showToast("success", editId ? "Berhasil diupdate!" : "Berhasil ditambahkan!");
      resetForm(); await fetchData();
    } catch (err) { showToast("error", "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDoc(doc(db, "categories", deleteTarget.id)); showToast("success", "Berhasil dihapus."); setDeleteTarget(null); await fetchData(); }
    catch (err) { showToast("error", "Gagal menghapus."); }
  };

  const updateSub = (index: number, value: string) => {
    const newSubs = [...subCategories];
    newSubs[index].name = value;
    setSubCategories(newSubs);
  };

  const addSub = () => setSubCategories([...subCategories, { id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name: "" }]);
  const removeSub = (index: number) => setSubCategories(subCategories.filter((_, i) => i !== index));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Kategori Projek</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola kategori dan sub-kategori untuk portofolio kamu.</p>
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
            <AdminFormField label="Nama Kategori Utama" value={categoryName} onChange={setCategoryName} placeholder="Misal: Web, Mobile, UI/UX" required />

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">Sub-Kategori (Opsional)</label>
              <div className="space-y-2">
                {subCategories.map((sub, i) => (
                  <div key={sub.id} className="flex gap-2">
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => updateSub(i, e.target.value)}
                      placeholder={`Sub-Kategori ${i + 1} (Misal: E-Commerce)`}
                      className="flex-1 p-2.5 rounded-xl bg-background/50 border border-border/50 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none text-sm transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => removeSub(i)} 
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={addSub} 
                className="text-xs text-accent hover:text-accent/80 font-semibold transition-colors"
              >
                + Tambah Sub-Kategori
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
            <p className="text-xs text-muted-foreground">Belum ada kategori projek. Klik "Tambah Kategori" untuk memulai.</p>
          </div>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <AdminCard key={cat.id} className="group border-border/50">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-foreground leading-tight">{cat.name}</h3>
                <div className="flex gap-1.5 opacity-100 transition-all">
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
                {cat.subCategories?.map((sub) => (
                  <span 
                    key={sub.id} 
                    className="px-2.5 py-1 text-[10px] font-semibold bg-accent/5 text-accent rounded-md border border-accent/10"
                  >
                    {sub.name}
                  </span>
                ))}
                {(!cat.subCategories || cat.subCategories.length === 0) && (
                  <p className="text-[10px] text-muted-foreground font-medium">Tidak ada sub-kategori</p>
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Kategori?" description={`Kategori "${deleteTarget?.name}" beserta semua sub-kategorinya akan dihapus permanen.`} confirmText="Hapus" confirmVariant="danger" />
    </div>
  );
}
