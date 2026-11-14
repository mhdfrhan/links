"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDocs, orderBy, query, writeBatch } from "firebase/firestore";
import { showToast } from "../components/AdminToast";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export function useSortableCollection<T extends { id: string }>(collectionName: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, collectionName), orderBy("order", "asc")));
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const saveOrderToFirebase = useCallback(
    async (newItems: T[]) => {
      try {
        const batch = writeBatch(db);
        newItems.forEach((item, index) => {
          batch.update(doc(db, collectionName, item.id), { order: index });
        });
        await batch.commit();
        showToast("success", "Urutan berhasil disimpan!");
      } catch (error) {
        console.error(error);
        showToast("error", "Gagal menyimpan urutan.");
        fetchData();
      }
    },
    [collectionName, fetchData]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);
        await saveOrderToFirebase(newItems);
      }
    },
    [items, saveOrderToFirebase]
  );

  return {
    items,
    setItems,
    loading,
    fetchData,
    sensors,
    handleDragEnd,
  };
}
