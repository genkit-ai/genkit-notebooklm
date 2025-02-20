"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Calendar, Trash2 } from "lucide-react";

type Notebook = {
  id: string;
  title: string;
};

export default function NotebookListPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "notebooks"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notebook[];
      setNotebooks(data);
    });

    return () => unsub();
  }, []);

  async function addNotebook() {
    if (!newNotebookTitle) return;
    await addDoc(collection(db, "notebooks"), {
      title: newNotebookTitle,
    });
    setNewNotebookTitle("");
  }

  async function deleteNotebook(id: string, e: React.MouseEvent) {
    e.preventDefault(); // Prevent the Link click from firing
    if (confirm("Are you sure you want to delete this notebook?")) {
      await deleteDoc(doc(db, "notebooks", id));
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Your Notebooks</h1>
        
        <Card className="mb-8 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <Input
                type="text"
                value={newNotebookTitle}
                onChange={(e) => setNewNotebookTitle(e.target.value)}
                placeholder="Enter notebook title..."
                className="flex-1 max-w-xl"
                onKeyDown={(e) => e.key === 'Enter' && addNotebook()}
              />
              <Button onClick={addNotebook} className="sm:w-auto w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Notebook
              </Button>
            </div>
          </CardContent>
        </Card>

        {notebooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No notebooks yet. Create your first one!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {notebooks.map((notebook) => (
              <Link 
                key={notebook.id}
                href={`/notebooks/${notebook.id}`}
                className="block group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {notebook.title}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => deleteNotebook(notebook.id, e)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date().toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 