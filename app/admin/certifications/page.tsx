"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { AdminCard } from "../components/AdminCard";
import { AdminFormField } from "../components/AdminFormField";
import { AdminModal } from "../components/AdminModal";
import { showToast } from "../components/AdminToast";
import { AITranslateButton } from "../components/AITranslateButton";
import { SortableItem } from "../components/SortableItem";
import { PlusIcon, PencilIcon, TrashIcon, ArrowTopRightOnSquareIcon, SparklesIcon } from "@heroicons/react/24/outline";
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

interface Certification {
  id: string;
  title: string;
  title_en: string;
  issuer: string;
  date: string;
  validUntil: string;
  verifyUrl: string;
  order: number;
}

export default function CertificationsPage() {
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [title_en, setTitleEn] = useState("");
  const [issuer, setIssuer] = useState("");
  const [date, setDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Certification | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(query(collection(db, "certifications"), orderBy("order", "asc")));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Certification)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveOrderToFirebase = async (newItems: Certification[]) => {
    try {
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        const docRef = doc(db, "certifications", item.id);
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

  const resetForm = () => { setIsEditing(false); setEditId(null); setTitle(""); setTitleEn(""); setIssuer(""); setDate(""); setValidUntil(""); setVerifyUrl(""); };

  const startEdit = (item: Certification) => {
    setIsEditing(true); setEditId(item.id); setTitle(item.title || ""); setTitleEn(item.title_en || ""); setIssuer(item.issuer || ""); setDate(item.date || ""); setValidUntil(item.validUntil || ""); setVerifyUrl(item.verifyUrl || "");
  };

  const handleSave = async () => {
    if (!title.trim() || !issuer.trim()) { showToast("error", "Judul dan penerbit wajib diisi."); return; }
    setSaving(true);
    try {
      const id = editId || `cert_${Date.now()}`;
      await setDoc(doc(db, "certifications", id), {
        title: title.trim(), title_en: title_en.trim(), issuer: issuer.trim(), date: date.trim(), validUntil: validUntil.trim(), verifyUrl: verifyUrl.trim(),
        order: editId ? (items.find((e) => e.id === editId)?.order || 0) : items.length,
      });
      showToast("success", editId ? "Berhasil diupdate!" : "Berhasil ditambahkan!");
      resetForm(); await fetchData();
    } catch (err) { showToast("error", "Gagal menyimpan."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDoc(doc(db, "certifications", deleteTarget.id)); showToast("success", "Berhasil dihapus."); setDeleteTarget(null); await fetchData(); }
    catch (err) { showToast("error", "Gagal menghapus."); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin  h-8 w-8 border-t-2 border-b-2 border-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg lg:text-xl font-semibold text-foreground tracking-tight">Sertifikasi</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola sertifikasi dan lisensi profesional kamu.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-accent text-accent-foreground text-sm font-semibold  hover:bg-accent/90 transition-all shadow-md hover:shadow-accent/20 active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Data
          </button>
        )}
      </div>

      {isEditing && (
        <AdminCard title={editId ? "Edit Sertifikasi" : "Tambah Sertifikasi"}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField label="Judul Sertifikasi (ID)" value={title} onChange={setTitle} placeholder="AWS Certified Solutions Architect" required />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Judul Sertifikasi (EN)</label>
                  <AITranslateButton text={title} onTranslated={setTitleEn} />
                </div>
                <input
                  type="text"
                  value={title_en}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="AWS Certified Solutions Architect (English)"
                  className="w-full p-3.5  bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                />
              </div>
            </div>
            <AdminFormField label="Penerbit" value={issuer} onChange={setIssuer} placeholder="Amazon Web Services" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminFormField label="Tanggal Terbit" value={date} onChange={setDate} placeholder="Des 2024" />
              <AdminFormField label="Berlaku Hingga" value={validUntil} onChange={setValidUntil} placeholder="Des 2027 (opsional)" />
            </div>
            <AdminFormField label="Link Verifikasi" type="url" value={verifyUrl} onChange={setVerifyUrl} placeholder="https://verify.example.com/..." hint="Link untuk memverifikasi sertifikasi (opsional)" />
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2  text-xs font-semibold text-muted-foreground hover:bg-muted/50 border border-border/50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-accent text-accent-foreground text-xs font-semibold  hover:bg-accent/90 disabled:opacity-70 transition-all shadow-md hover:shadow-accent/20"
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
                        <h3 className="font-semibold text-foreground leading-snug">{item.title}</h3>
                        <p className="text-xs text-accent font-semibold mt-0.5">{item.issuer}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">{item.date}{item.validUntil && ` — Berlaku hingga: ${item.validUntil}`}</p>
                        {item.verifyUrl && (
                          <a 
                            href={item.verifyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 mt-3 px-2 py-1 bg-accent/5 text-[10px] font-semibold text-accent  border border-accent/10 hover:bg-accent/10 transition-colors relative z-20"
                          >
                            <ArrowTopRightOnSquareIcon className="w-3 h-3" /> Verifikasi
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1.5 opacity-100 transition-all">
                        <button 
                          onClick={() => startEdit(item)} 
                          className="p-1.5 text-accent bg-accent/5  hover:bg-accent/10 border border-accent/10 transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(item)} 
                          className="p-1.5 text-red-500 bg-red-500/5  hover:bg-red-500/10 border border-red-500/10 transition-colors"
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

      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Hapus Sertifikasi?" description={`"${deleteTarget?.title}" akan dihapus permanen.`} confirmText="Hapus" confirmVariant="danger" />
    </div>
  );
}
