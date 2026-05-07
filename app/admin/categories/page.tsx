"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { AdminModal } from "../components/AdminModal";
import { showToast } from "../components/AdminToast";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ProjectCategory {
  id: string;
  name: string;
  order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");

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

  const resetForm = () => { setIsEditing(false); setEditId(null); setCategoryName(""); };

  const startEdit = (cat: ProjectCategory) => {
    setIsEditing(true);
    setEditId(cat.id);
    setCategoryName(cat.name);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) { showToast("error", "Nama kategori wajib diisi."); return; }
    setSaving(true);
    try {
      const id = editId || `cat_${Date.now()}`;
      await setDoc(doc(db, "categories", id), {
        name: categoryName.trim(),
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

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Kategori Projek</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola kategori untuk portofolio kamu.</p>
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
            <AdminFormField label="Nama Kategori" value={categoryName} onChange={setCategoryName} placeholder="Misal: Web, Mobile, UI/UX" required />

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
            <AdminCard key={cat.id} className="group border-border/50 flex flex-row items-center justify-between">
              <h3 className="font-semibold text-foreground leading-tight">{cat.name}</h3>
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
            </AdminCard>
          ))}
        </div>
      )}

      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Kategori?" description={`Kategori "${deleteTarget?.name}" akan dihapus permanen.`} confirmText="Hapus" confirmVariant="danger" />
    </div>
  );
}
