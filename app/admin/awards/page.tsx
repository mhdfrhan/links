"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { AdminModal } from "../components/AdminModal";
import { showToast } from "../components/AdminToast";
import { SortableItem } from "../components/SortableItem";
import { PlusIcon, PencilIcon, TrashIcon, StarIcon } from "@heroicons/react/24/outline";
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
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

interface Award {
  id: string;
  title: string;
  year: string;
  highlight: boolean;
  order: number;
}

export default function AwardsPage() {
  const [items, setItems] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [highlight, setHighlight] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Award | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(query(collection(db, "awards"), orderBy("order", "asc")));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Award)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveOrderToFirebase = async (newItems: Award[]) => {
    try {
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        const docRef = doc(db, "awards", item.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
      showToast("success", "Urutan berhasil disimpan!");
    } catch (error) {
      console.error(error);
      showToast("error", "Gagal menyimpan urutan.");
      fetchData();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      setItems(newItems);
      saveOrderToFirebase(newItems);
    }
  };

  const resetForm = () => { setIsEditing(false); setEditId(null); setTitle(""); setYear(""); setHighlight(false); };

  const startEdit = (item: Award) => {
    setIsEditing(true); setEditId(item.id); setTitle(item.title); setYear(item.year); setHighlight(item.highlight || false);
  };

  const handleSave = async () => {
    if (!title.trim()) { showToast("error", "Judul penghargaan wajib diisi."); return; }
    setSaving(true);
    try {
      const id = editId || `award_${Date.now()}`;
      await setDoc(doc(db, "awards", id), {
        title: title.trim(), year: year.trim(), highlight,
        order: editId ? (items.find((e) => e.id === editId)?.order || 0) : items.length,
      });
      showToast("success", editId ? "Berhasil diupdate!" : "Berhasil ditambahkan!");
      resetForm(); await fetchData();
    } catch (err) { showToast("error", "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDoc(doc(db, "awards", deleteTarget.id)); showToast("success", "Berhasil dihapus."); setDeleteTarget(null); await fetchData(); }
    catch (err) { showToast("error", "Gagal menghapus."); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Penghargaan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola penghargaan dan prestasi kamu.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-accent text-accent-foreground text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all shadow-md hover:shadow-accent/20 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Data
          </button>
        )}
      </div>

      {isEditing && (
        <AdminCard title={editId ? "Edit Penghargaan" : "Tambah Penghargaan"}>
          <div className="space-y-5">
            <AdminFormField label="Judul Penghargaan" value={title} onChange={setTitle} placeholder="Juara 1 Hackathon XYZ" required />
            <AdminFormField label="Tahun" value={year} onChange={setYear} placeholder="2024" />
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHighlight(!highlight)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  highlight 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                    : "bg-muted/30 text-muted-foreground border border-border/50"
                }`}
              >
                {highlight ? <StarSolid className="w-3.5 h-3.5" /> : <StarIcon className="w-3.5 h-3.5" />}
                {highlight ? "Dihighlight" : "Normal"}
              </button>
              <span className="text-[10px] text-muted-foreground font-medium">Highlight untuk penghargaan utama</span>
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
                {saving ? "Menyimpan..." : editId ? "Update Data" : "Simpan Data"}
              </button>
            </div>
          </div>
        </AdminCard>
      )}

      {items.length === 0 && !isEditing ? (
        <AdminCard>
          <div className="text-center py-10">
            <p className="text-xs text-muted-foreground">Belum ada data. Klik "Tambah Data" untuk memulai.</p>
          </div>
        </AdminCard>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  <AdminCard className="group border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 pl-6 md:pl-8">
                        {item.highlight && <StarSolid className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        <div>
                          <h3 className="font-semibold text-foreground leading-snug">{item.title}</h3>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.year}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-100 transition-all">
                        <button 
                          onClick={() => startEdit(item)} 
                          className="p-1.5 text-accent bg-accent/5 rounded-lg hover:bg-accent/10 border border-accent/10 transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(item)} 
                          className="p-1.5 text-red-500 bg-red-500/5 rounded-lg hover:bg-red-500/10 border border-red-500/10 transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </AdminCard>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Penghargaan?" description={`"${deleteTarget?.title}" akan dihapus permanen.`} confirmText="Hapus" confirmVariant="danger" />
    </div>
  );
}
