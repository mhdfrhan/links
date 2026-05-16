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
import { PlusIcon, PencilIcon, TrashIcon, SparklesIcon } from "@heroicons/react/24/outline";
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

interface Experience {
  id: string;
  title: string;
  title_en: string;
  company: string;
  company_en: string;
  period: string;
  period_en: string;
  points: string[];
  points_en: string[];
  order: number;
}

type TabKey = "experiences" | "organizationExperience" | "committeeExperience";

const TABS: { key: TabKey; label: string }[] = [
  { key: "experiences", label: "Pengalaman Kerja" },
  { key: "organizationExperience", label: "Organisasi" },
  { key: "committeeExperience", label: "Kepanitiaan" },
];

export default function ExperiencesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("experiences");
  const [items, setItems] = useState<Record<TabKey, Experience[]>>({
    experiences: [],
    organizationExperience: [],
    committeeExperience: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [title_en, setTitleEn] = useState("");
  const [company, setCompany] = useState("");
  const [company_en, setCompanyEn] = useState("");
  const [period, setPeriod] = useState("");
  const [period_en, setPeriodEn] = useState("");
  const [points, setPoints] = useState<string[]>([""]);
  const [points_en, setPointsEn] = useState<string[]>([""]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [expSnap, orgSnap, comSnap] = await Promise.all([
        getDocs(query(collection(db, "experiences"), orderBy("order", "asc"))),
        getDocs(query(collection(db, "organizationExperience"), orderBy("order", "asc"))),
        getDocs(query(collection(db, "committeeExperience"), orderBy("order", "asc"))),
      ]);

      setItems({
        experiences: expSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Experience)),
        organizationExperience: orgSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Experience)),
        committeeExperience: comSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Experience)),
      });
    } catch (err) {
      console.error("Error fetching experiences:", err);
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveOrderToFirebase = async (newItems: Experience[]) => {
    try {
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        const docRef = doc(db, activeTab, item.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
      showToast("success", "Urutan berhasil disimpan!");
    } catch (error) {
      console.error(error);
      showToast("error", "Gagal menyimpan urutan.");
      fetchAll();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const currentItems = items[activeTab];
      const oldIndex = currentItems.findIndex((i) => i.id === active.id);
      const newIndex = currentItems.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(currentItems, oldIndex, newIndex);
      
      setItems((prev) => ({
        ...prev,
        [activeTab]: newItems,
      }));
      
      saveOrderToFirebase(newItems);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle("");
    setTitleEn("");
    setCompany("");
    setCompanyEn("");
    setPeriod("");
    setPeriodEn("");
    setPoints([""]);
    setPointsEn([""]);
  };

  const startEdit = (exp: Experience) => {
    setIsEditing(true);
    setEditId(exp.id);
    setTitle(exp.title || "");
    setTitleEn(exp.title_en || "");
    setCompany(exp.company || "");
    setCompanyEn(exp.company_en || "");
    setPeriod(exp.period || "");
    setPeriodEn(exp.period_en || "");
    setPoints(exp.points?.length > 0 ? exp.points : [""]);
    setPointsEn(exp.points_en?.length > 0 ? exp.points_en : [""]);
  };

  const handleSave = async () => {
    if (!title.trim() || !company.trim()) {
      showToast("error", "Judul dan perusahaan/organisasi wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      const id = editId || `exp_${Date.now()}`;
      const filteredPoints = points.filter((p) => p.trim());
      const filteredPointsEn = points_en.filter((p) => p.trim());
      await setDoc(doc(db, activeTab, id), {
        title: title.trim(),
        title_en: title_en.trim(),
        company: company.trim(),
        company_en: company_en.trim(),
        period: period.trim(),
        period_en: period_en.trim(),
        points: filteredPoints,
        points_en: filteredPointsEn,
        order: editId ? (items[activeTab].find((e) => e.id === editId)?.order || 0) : items[activeTab].length,
      });
      showToast("success", editId ? "Berhasil diupdate!" : "Berhasil ditambahkan!");
      resetForm();
      await fetchAll();
    } catch (err) {
      console.error("Error saving:", err);
      showToast("error", "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, activeTab, deleteTarget.id));
      showToast("success", "Berhasil dihapus.");
      setDeleteTarget(null);
      await fetchAll();
    } catch (err) {
      console.error("Error deleting:", err);
      showToast("error", "Gagal menghapus.");
    }
  };

  const updatePoint = (index: number, value: string) => {
    const newPoints = [...points];
    newPoints[index] = value;
    setPoints(newPoints);
  };

  const updatePointEn = (index: number, value: string) => {
    const newPoints = [...points_en];
    newPoints[index] = value;
    setPointsEn(newPoints);
  };

  const addPoint = () => {
    setPoints([...points, ""]);
    setPointsEn([...points_en, ""]);
  };

  const removePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
    setPointsEn(points_en.filter((_, i) => i !== index));
  };

  const currentItems = items[activeTab];

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
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Pengalaman</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola semua pengalaman kerja, organisasi, dan kepanitiaan.</p>
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

      {/* Tabs */}
      <div className="flex p-1 rounded-xl bg-muted/20 border border-border/50 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); resetForm(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-60 font-normal">({items[tab.key].length})</span>
          </button>
        ))}
      </div>

      {/* Editor */}
      {isEditing && (
        <AdminCard title={editId ? "Edit Pengalaman" : "Tambah Pengalaman Baru"}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField label="Posisi / Jabatan (ID)" value={title} onChange={setTitle} placeholder="Fullstack Developer" required />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Posisi / Jabatan (EN)</label>
                  <AITranslateButton text={title} onTranslated={setTitleEn} />
                </div>
                <input
                  type="text"
                  value={title_en}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Fullstack Developer (English)"
                  className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField label="Perusahaan / Organisasi (ID)" value={company} onChange={setCompany} placeholder="PT. Example" required />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Perusahaan / Organisasi (EN)</label>
                  <AITranslateButton text={company} onTranslated={setCompanyEn} />
                </div>
                <input
                  type="text"
                  value={company_en}
                  onChange={(e) => setCompanyEn(e.target.value)}
                  placeholder="Example Corp"
                  className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField label="Periode (ID)" value={period} onChange={setPeriod} placeholder="Jan 2024 - Sekarang" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">Periode (EN)</label>
                  <AITranslateButton text={period} onTranslated={setPeriodEn} />
                </div>
                <input
                  type="text"
                  value={period_en}
                  onChange={(e) => setPeriodEn(e.target.value)}
                  placeholder="Jan 2024 - Present"
                  className="w-full p-3.5 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Deskripsi / Poin-poin</label>
              {points.map((point, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground text-sm mt-3 w-6">{i + 1}.</span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updatePoint(i, e.target.value)}
                        placeholder="Tulis deskripsi pekerjaan (ID)..."
                        className="flex-1 p-3 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={points_en[i] || ""}
                        onChange={(e) => updatePointEn(i, e.target.value)}
                        placeholder="Write job description (EN)..."
                        className="flex-1 p-3 rounded-xl bg-background/50 border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-sm transition-all"
                      />
                      <AITranslateButton text={point} onTranslated={(translated) => updatePointEn(i, translated)} label="AI" />
                    </div>
                  </div>
                  {points.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePoint(i)}
                      className="p-2 h-fit mt-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPoint}
                className="text-sm text-accent hover:text-accent/80 font-medium"
              >
                + Tambah poin
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
                {saving ? "Menyimpan..." : editId ? "Update Data" : "Simpan Data"}
              </button>
            </div>
          </div>
        </AdminCard>
      )}

      {/* List */}
      {currentItems.length === 0 && !isEditing ? (
        <AdminCard>
          <div className="text-center py-10">
            <p className="text-xs text-muted-foreground">Belum ada data. Klik "Tambah Data" untuk memulai.</p>
          </div>
        </AdminCard>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={currentItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {currentItems.map((exp) => (
                <SortableItem key={exp.id} id={exp.id}>
                  <AdminCard className="group border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pl-6 md:pl-8">
                        <h3 className="font-semibold text-foreground leading-snug">{exp.title}</h3>
                        <p className="text-xs text-accent font-semibold mt-0.5">{exp.company}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium">{exp.period}</p>
                        {exp.points?.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {exp.points.map((point, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground/80 flex gap-2 leading-relaxed">
                                <span className="text-accent opacity-50">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex gap-1.5 opacity-100 transition-all flex-shrink-0 ml-4 relative z-20">
                        <button 
                          onClick={() => startEdit(exp)} 
                          className="p-1.5 text-accent bg-accent/5 rounded-lg hover:bg-accent/10 border border-accent/10 transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(exp)} 
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

      <AdminModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Pengalaman?"
        description={`"${deleteTarget?.title}" akan dihapus permanen.`}
        confirmText="Hapus"
        confirmVariant="danger"
      />
    </div>
  );
}
