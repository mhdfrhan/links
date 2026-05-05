"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { AdminModal } from "../components/AdminModal";
import { showToast } from "../components/AdminToast";
import { SortableItem } from "../components/SortableItem";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
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

interface Education {
  id: string;
  institution: string;
  degree: string;
  period: string;
  note: string;
  order: number;
}

export default function EducationPage() {
  const [items, setItems] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [period, setPeriod] = useState("");
  const [note, setNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Education | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(query(collection(db, "education"), orderBy("order", "asc")));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Education)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveOrderToFirebase = async (newItems: Education[]) => {
    try {
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        const docRef = doc(db, "education", item.id);
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

  const resetForm = () => { setIsEditing(false); setEditId(null); setInstitution(""); setDegree(""); setPeriod(""); setNote(""); };

  const startEdit = (item: Education) => {
    setIsEditing(true); setEditId(item.id); setInstitution(item.institution); setDegree(item.degree); setPeriod(item.period); setNote(item.note || "");
  };

  const handleSave = async () => {
    if (!institution.trim() || !degree.trim()) { showToast("error", "Institusi dan gelar wajib diisi."); return; }
    setSaving(true);
    try {
      const id = editId || `edu_${Date.now()}`;
      await setDoc(doc(db, "education", id), {
        institution: institution.trim(), degree: degree.trim(), period: period.trim(), note: note.trim(),
        order: editId ? (items.find((e) => e.id === editId)?.order || 0) : items.length,
      });
      showToast("success", editId ? "Berhasil diupdate!" : "Berhasil ditambahkan!");
      resetForm(); await fetchData();
    } catch (err) { showToast("error", "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDoc(doc(db, "education", deleteTarget.id)); showToast("success", "Berhasil dihapus."); setDeleteTarget(null); await fetchData(); }
    catch (err) { showToast("error", "Gagal menghapus."); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Pendidikan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola riwayat pendidikan kamu.</p>
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
        <AdminCard title={editId ? "Edit Pendidikan" : "Tambah Pendidikan"}>
          <div className="space-y-5">
            <AdminFormField label="Institusi" value={institution} onChange={setInstitution} placeholder="Universitas Example" required />
            <AdminFormField label="Gelar / Jurusan" value={degree} onChange={setDegree} placeholder="S1 Teknik Informatika" required />
            <AdminFormField label="Periode" value={period} onChange={setPeriod} placeholder="2020 - Sekarang" />
            <AdminFormField label="Catatan" value={note} onChange={setNote} placeholder="Beasiswa, prestasi, dll (opsional)" hint="Akan ditampilkan sebagai badge di homepage" />
            
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
                    <div className="flex items-start justify-between">
                      <div className="pl-6 md:pl-8">
                        <h3 className="font-semibold text-foreground leading-snug">{item.institution}</h3>
                        <p className="text-xs text-accent font-semibold mt-0.5">{item.degree}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">{item.period}</p>
                        {item.note && (
                          <span className="inline-block mt-2.5 px-2 py-0.5 text-[10px] font-medium bg-accent/5 text-accent rounded-md border border-accent/10">
                            {item.note}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
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

      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Pendidikan?" description={`"${deleteTarget?.institution}" akan dihapus permanen.`} confirmText="Hapus" confirmVariant="danger" />
    </div>
  );
}
