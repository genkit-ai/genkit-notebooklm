"use client";

import { useState, useEffect } from "react";
import { db, bucketName } from "../../firebase";
import { doc, onSnapshot, collection, addDoc, getDocs } from "firebase/firestore";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import { getStorage, ref, getDownloadURL } from "firebase/storage";


interface NotebookDetailClientProps {
  id: string;
}

const MAX_SOURCES = 300;

interface ScriptSection {
  title: string;
  content: string;
}

interface GeneratePodcastResponse {
  scriptSections: ScriptSection[];
  storageUrl: string;
}

interface PodcastJob {
  status: string;
  audioOutput?: {
    storageUrl: string;
  };
  currentStep?: string;
}

export function NotebookDetailClient({ id }: NotebookDetailClientProps) {
  const [title, setTitle] = useState("");
  const [sources, setSources] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const [pastedText, setPastedText] = useState("");
  const [addSourceView, setAddSourceView] = useState<'main' | 'paste'>('main');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<PodcastJob | null>(null);


  useEffect(() => {
    if (!id || Array.isArray(id)) return;
    
    // Notebook document listener
    const notebookDoc = doc(db, "notebooks", id);
    const unsubscribeNotebook = onSnapshot(notebookDoc, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        setTitle(data.title || "");
      }
    });

    // Sources collection listener
    const sourcesCollection = collection(db, "notebooks", id, "sources");
    const unsubscribeSources = onSnapshot(sourcesCollection, (snapshot) => {
      const sourcesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as { title: string; content: string }
      }));
      setSources(sourcesData);
    });

    return () => {
      unsubscribeNotebook();
      unsubscribeSources();
    };
  }, [id]);

  const handlePasteTextSubmit = async () => {
    if (!id || !pastedText.trim()) return;
    
    try {
      const sourcesCollection = collection(db, "notebooks", id, "sources");
      await addDoc(sourcesCollection, {
        title: `Text Source ${new Date().toLocaleString()}`,
        content: pastedText,
        createdAt: new Date(),
      });
      
      // Reset form and view
      setPastedText("");
      setAddSourceView('main');
    } catch (error) {
      console.error("Error adding pasted text source:", error);
    }
  };

  const handleGenerateScriptV2 = async () => {
    try {
      setIsGenerating(true);
      setAudioUrl(null); // Reset audio URL when generating new content

      // Fetch sources from the database
      const sourcesCollection = collection(db, "notebooks", id, "sources");
      const sourcesSnapshot = await getDocs(sourcesCollection);
      const sources = sourcesSnapshot.docs.map((doc) => doc.data().content);

      // TODO: Support various customizations in the UI directly
      const podcastOptions = {
        format: "roundtable",
        discussionStyle: "expert_panel", // Must be one of the predefined styles in the schema
        structure: "open_discussion", // Must be one of the predefined structures in the schema
        speakers: [
          { 
            name: "Dr. Mahsa Taheri", 
            voiceId: "en-US-Journey-D",
            background: "AI Researcher at University of Hamburg" 
          },
          { 
            name: "Sarah Chen", 
            voiceId: "en-US-Journey-F",
            background: "Senior Tech Journalist at TechReview" 
          }
        ],
        audioStorage: "audio",
        transcriptStorage: "transcript",
        bucketName,
      }
      const synthesisRequest = {
        input: sources,
        output: [{ type: 'podcast', options: podcastOptions }]
      };

      const response = await axios.post('http://localhost:8080/api/synthesis', synthesisRequest);
      const data = response.data;
      
      if (data.status === 'success' && data.result.podcast.storageUrl) {
        // Get a reference to the storage location
        const storage = getStorage();
        const audioRef = ref(storage, data.result.podcast.storageUrl);
        
        // Get the download URL
        const url = await getDownloadURL(audioRef);
        setAudioUrl(url);
      }
      //const storage = getStorage();
      //getDownloadURL(ref(storage,"gs://smarthome-d6e27.firebasestorage.app/undefined/podcast_audio_f17524cb-e1ab-43eb-821c-604e54fe0b4f.mp3"));
    } catch (error) {
      console.error("Failed to generate podcast:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <div className="flex items-center p-6 border-b backdrop-blur-sm bg-background/50 sticky top-0 z-10">
        <Link 
          href="/notebooks" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>←</span>
          <span>Back to Notebooks</span>
        </Link>
        <h1 className="text-xl font-semibold ml-6">{title}</h1>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-8 p-6 overflow-auto">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="backdrop-blur-sm bg-background/50 border shadow-md">
            <CardHeader className="space-y-1.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Sources</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Add Source
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px]">
                    <DialogHeader>
                      {addSourceView === 'paste' ? (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setAddSourceView('main')}
                          >
                            ←
                          </Button>
                          <DialogTitle>Paste copied text</DialogTitle>
                        </div>
                      ) : (
                        <>
                          <DialogTitle>Add sources</DialogTitle>
                          <DialogDescription>
                            Sources let NotebookLM base its responses on the information that matters most to you.
                            (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
                          </DialogDescription>
                        </>
                      )}
                    </DialogHeader>
                    
                    {addSourceView === 'paste' ? (
                      <>
                        <div className="mt-4">
                          <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder="Paste text here*"
                            className="w-full h-[300px] p-4 rounded-md border bg-background resize-none"
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={handlePasteTextSubmit}>Add Source</Button>
                        </DialogFooter>
                      </>
                    ) : (
                      <div className="mt-8">
                        <div className="grid grid-cols-3 gap-4">
                          <Card className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                              <span className="font-medium">Text</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => setAddSourceView('paste')}
                            >
                              Paste text
                            </Button>
                          </Card>
                        </div>

                        <div className="mt-8 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Source limit</span>
                            <span>{sources.length} / {MAX_SOURCES}</span>
                          </div>
                          <div 
                            className="h-2 bg-secondary rounded-full" 
                            style={{ width: `${(sources.length / 300) * 100}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sources.map((source) => (
                  <Collapsible key={source.id}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50 rounded-md transition-colors">
                      <span className="font-medium">{source.title}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 py-3 text-sm text-muted-foreground">
                      {source.content}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card className="backdrop-blur-sm bg-background/50 border shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">Studio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Audio Overview</h3>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-3 mt-4">
                    <Button 
                      className="flex-1" 
                      onClick={handleGenerateScriptV2}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                  {audioUrl && (
                    <div className="mt-4">
                      <audio 
                        controls 
                        className="w-full"
                        src={audioUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  {(jobStatus?.status === 'QUEUED' || jobStatus?.status === 'PROCESSING') && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-sm text-muted-foreground">
                          {jobStatus.currentStep ? (
                            <span className="capitalize">
                              {jobStatus.currentStep.toLowerCase().replace(/_/g, ' ')}...
                            </span>
                          ) : (
                            'Preparing podcast...'
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}