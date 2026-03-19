"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, AlertCircle, Loader2, Box, Pencil, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useStudioStore } from "@/store/useStudioStore";
import { api } from "@/lib/api";

const ELEMENT_TYPES = [
  { id: 'character', label: 'Character' },
  { id: 'location',  label: 'Location'  },
  { id: 'prop',      label: 'Prop'      },
];

const panelV = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 340, damping: 28 } },
  exit:    { opacity: 0, y: 14, scale: 0.97, transition: { duration: 0.16, ease: "easeIn" } },
};

const SPRING = { type: "spring", stiffness: 320, damping: 32, mass: 0.85 };

export function SelectElement({ open, onOpenChange, onSelect }) {
  const { elements, loadingElements, fetchElements } = useStudioStore();
  const [activeTab, setActiveTab]     = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const tabs = ['All', 'Characters', 'Locations', 'Props'];
  const panelRef = useRef(null);

  const [formMode, setFormMode]   = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData]   = useState({ slug: '', type: 'character', description: '', reference_images: [] });
  const [submitting, setSubmitting] = useState(false);

  // progress: 0 = explorer visible, 1 = form visible
  const progress = useMotionValue(0);

  // Explorer: at progress=0 it's at y=0%, at progress=1 it has slid fully UP to -100%
  const explorerY     = useTransform(progress, [0, 1], ["0%", "-100%"]);
  const explorerScale = useTransform(progress, [0, 1], [1, 0.96]);
  const explorerBlur  = useTransform(progress, [0, 0.6, 1], [0, 0, 8]);
  const explorerFilter = useTransform(explorerBlur, v => `blur(${v}px)`);

  // Form: at progress=0 it's offscreen below at y=100%, at progress=1 it's at y=0%
  const formY     = useTransform(progress, [0, 1], ["100%", "0%"]);
  const formScale = useTransform(progress, [0, 1], [1.02, 1]);
  const formBlur  = useTransform(progress, [0, 0.4, 1], [10, 3, 0]);
  const formFilter = useTransform(formBlur, v => `blur(${v}px)`);

  const tabToType = { 'All': 'all', 'Characters': 'character', 'Locations': 'location', 'Props': 'prop' };

  useEffect(() => { if (open) fetchElements(); }, [open, fetchElements]);
  useEffect(() => {
    if (!open) { progress.set(0); setFormMode(null); }
  }, [open]);

  const filteredElements = React.useMemo(() => {
    const type = tabToType[activeTab];
    return elements.filter(el => {
      const matchesType = type === 'all' || el.type === type;
      const term = searchQuery.toLowerCase().trim();
      return matchesType && (!term || el.slug.toLowerCase().includes(term) || (el.display_name && el.display_name.toLowerCase().includes(term)));
    });
  }, [elements, activeTab, searchQuery]);

  const goCreate = () => {
    setEditingId(null);
    setFormData({ slug: '', type: 'character', description: '', reference_images: [] });
    setFormMode('create');
    animate(progress, 1, SPRING);
  };

  const goEdit = (element, e) => {
    e.stopPropagation();
    setEditingId(element.id);
    setFormData({ slug: element.slug || '', type: element.type || 'character', description: element.description || '', reference_images: element.reference_images || [] });
    setFormMode('edit');
    animate(progress, 1, SPRING);
  };

  const goBack = () => {
    animate(progress, 0, { ...SPRING, onComplete: () => { setFormMode(null); setEditingId(null); setFormData({ slug: '', type: 'character', description: '', reference_images: [] }); } });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 10 - formData.reference_images.length;
    if (remaining <= 0) { alert('Max 10 images.'); return; }
    files.slice(0, remaining).forEach(file => {
      const r = new FileReader();
      r.onloadend = () => setFormData(p => ({ ...p, reference_images: [...p.reference_images, r.result] }));
      r.readAsDataURL(file);
    });
  };
  const removeImage = (idx) => setFormData(p => ({ ...p, reference_images: p.reference_images.filter((_, i) => i !== idx) }));

  const handleSubmit = async (ev) => {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation(); 
    }
    if (formData.reference_images.length < 2) { alert('Add at least 2 reference images.'); return; }
    setSubmitting(true);
    const isEdit = formMode === 'edit';
    try {
      // In useStudioStore, api responses are already parsed.
      // We check res.ok if the API helper attaches it, or handle it based on convention.
      const res = await api[isEdit ? 'patch' : 'post'](isEdit ? `/elements/${editingId}` : '/elements', formData);
      
      // If we are here, it means the request succeeded (2xx) because apiRequest throws on !ok
      await fetchElements(true); 
      goBack();
    } catch (err) { 
      alert(err.message || 'An error occurred.'); 
    }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this element?')) return;
    try {
      const res = await api.delete(`/elements/${id}`);
      if (res.ok) await fetchElements(true);
      else alert(res.message || 'Failed to delete');
    } catch { alert('An error occurred.'); }
  };

  useEffect(() => {
    const handle = (e) => { 
      if (!panelRef.current) return;

      // If the clicked element is no longer in the document, it was likely 
      // part of a menu or select item that was just removed. Don't close.
      if (!document.body.contains(e.target)) return;

      if (!panelRef.current.contains(e.target)) {
        // Don't close if clicking on portalled elements (like Select dropdown)
        if (e.target.closest('[data-radix-popper-content-wrapper]') || e.target.closest('[data-radix-portal]')) return;
        onOpenChange(false);
      }
    };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          variants={panelV}
          initial="initial" animate="animate" exit="exit"
          className="absolute bottom-full left-0 right-0 mb-4 z-100 outline-none h-[580px]"
        >
          <div
            className="w-full h-full rounded-md relative overflow-hidden border backdrop-blur-3xl"
            style={{
              background: "linear-gradient(0deg, rgba(21,21,21,0.99) 0%, rgba(21,21,21,0.99) 100%), linear-gradient(41deg, rgba(101,189,235,0.24) 60%, rgba(101,189,235,0) 100%)"
            }}
          >
            <div className="absolute inset-0 rounded-3xl shadow-inner pointer-events-none z-10" />

            {/* ══ FORM — underneath, scrolls up into view ══ */}
            <motion.div
              style={{ y: formY, scale: formScale, filter: formFilter, pointerEvents: formMode ? 'auto' : 'none' }}
              className="absolute inset-0 flex flex-col"
            >
              <div
                className="flex flex-col h-full p-6 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 rounded-md">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                  </Button>
                  <h2 className="text-xl font-bold">{formMode === 'edit' ? 'Edit Element' : 'Create New Element'}</h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-40 ml-1">Type</label>
                      <Select 
                        value={formData.type} 
                        onValueChange={val => setFormData({ ...formData, type: val })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ELEMENT_TYPES.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-40 ml-1">Slug (@name)</label>
                      <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '') })}
                        placeholder="e.g. detective" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-40">Reference Images (2–10)</label>
                      <span className="text-[10px] opacity-60 font-medium">{formData.reference_images.length} / 10</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <AnimatePresence>
                           {formData.reference_images.length < 10 && (
                        <label 
                          className="aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer bg-accent ">
                          <Plus className="h-5 w-5 mb-1" />
                          <span className="text-[12px] ">Add</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      )}
                        {formData.reference_images.map((img, idx) => (
                          <motion.div key={idx}
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 28 } }}
                            exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.15 } }}
                            className="relative aspect-square rounded-xl overflow-hidden border group">
                            <img src={img} className="w-full h-full object-cover" />
                            <Button variant="destructive" size="icon" onClick={() => removeImage(idx)} 
                              className="absolute top-1 right-1 h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                   
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-2 flex justify-end w-full gap-3 border-t">
                  <Button variant="ghost" className="flex-1 h-11 rounded-xl max-w-fit" onClick={goBack}>Cancel</Button>
                
                    <Button variant="studio-neon" onClick={handleSubmit} disabled={submitting || formData.reference_images.length < 2 || !formData.slug}
                      className="">
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (formMode === 'edit' ? 'Update Element' : 'Create Element')}
                    </Button>
                
                </div>
              </div>
            </motion.div>

            {/* ══ EXPLORER — on top, slides up to reveal form beneath ══ */}
            <motion.div
              style={{ y: explorerY, scale: explorerScale, filter: explorerFilter, pointerEvents: formMode ? 'none' : 'auto' }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="relative h-[180px] flex-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
                <div className="relative z-10 p-7">
                  <div className="w-full grid grid-cols-2 items-center gap-6">
                    <div className="flex flex-col items-start w-full">
                      <h2 className="text-2xl font-bold uppercase tracking-tight leading-tight mb-2">Bring your own elements</h2>
                      <p className="text-sm opacity-50 font-medium max-w-[300px] mb-6 leading-relaxed">Upload photos to train your consistent characters or objects.</p>
                      <div className="pb-6">
                        <Button  variant="studio-neon" onClick={goCreate}>
                          Create element
                          <svg width="20" height="20" viewBox="0 0 20 20" className="size-4">
                            <path d="M11.8525 4.21651L11.7221 3.2387C11.6906 3.00226 11.4889 2.82568 11.2504 2.82568C11.0118 2.82568 10.8102 3.00226 10.7786 3.23869L10.6483 4.21651C10.2658 7.0847 8.00939 9.34115 5.14119 9.72358L4.16338 9.85396C3.92694 9.88549 3.75037 10.0872 3.75037 10.3257C3.75037 10.5642 3.92694 10.7659 4.16338 10.7974L5.14119 10.9278C8.00938 11.3102 10.2658 13.5667 10.6483 16.4349L10.7786 17.4127C10.8102 17.6491 11.0118 17.8257 11.2504 17.8257C11.4889 17.8257 11.6906 17.6491 11.7221 17.4127L11.8525 16.4349C12.2349 13.5667 14.4913 11.3102 17.3595 10.9278L18.3374 10.7974C18.5738 10.7659 18.7504 10.5642 18.7504 10.3257C18.7504 10.0872 18.5738 9.88549 18.3374 9.85396L17.3595 9.72358C14.4913 9.34115 12.2349 7.0847 11.8525 4.21651Z" fill="currentColor" />
                            <path d="M4.6519 14.7568L4.82063 14.2084C4.84491 14.1295 4.91781 14.0757 5.00037 14.0757C5.08292 14.0757 5.15582 14.1295 5.1801 14.2084L5.34883 14.7568C5.56525 15.4602 6.11587 16.0108 6.81925 16.2272L7.36762 16.3959C7.44652 16.4202 7.50037 16.4931 7.50037 16.5757C7.50037 16.6582 7.44652 16.7311 7.36762 16.7554L6.81926 16.9241C6.11587 17.1406 5.56525 17.6912 5.34883 18.3946L5.1801 18.9429C5.15582 19.0218 5.08292 19.0757 5.00037 19.0757C4.91781 19.0757 4.84491 19.0218 4.82063 18.9429L4.65191 18.3946C4.43548 17.6912 3.88486 17.1406 3.18147 16.9241L2.63311 16.7554C2.55421 16.7311 2.50037 16.6582 2.50037 16.5757C2.50037 16.6582 2.55421 16.4202 2.63311 16.3959L3.18148 16.2272C3.88486 16.0108 4.43548 15.4602 4.6519 14.7568Z" fill="currentColor" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-center relative h-32">
                      <div className="absolute inset-0 flex justify-center items-center scale-90">
                        <img alt="c1" src="https://static.higgsfield.ai/image/character-panel-cinematic-1.jpg" className="absolute w-20 h-20 rounded-xl object-cover rotate-[-10deg] translate-x-[-30%] translate-y-2 border shadow-2xl z-4" />
                        <img alt="c3" src="https://static.higgsfield.ai/image/character-panel-cinematic-3.jpg" className="absolute w-28 h-28 rounded-md object-cover border-2 shadow-2xl z-5 ring-4 ring-background/40" />
                        <img alt="c4" src="https://static.higgsfield.ai/image/character-panel-cinematic-4.jpg" className="absolute w-22 h-22 rounded-xl object-cover rotate-[-4deg] translate-x-[30%] border shadow-2xl z-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2 overflow-hidden rounded-t-3xl bg-accent/30 p-3 backdrop-blur-2xl border-t">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
                  <div className="flex items-center justify-between px-2 py-1 flex-none gap-4">
                    <TabsList>
                      {tabs.map(tab => (
                        <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="relative group flex-1 max-w-[300px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20 group-focus-within:opacity-100 transition-opacity" />
                      <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={`Search ${activeTab.toLowerCase()}...`}
                        className="pl-9 h-9" />
                      {searchQuery && <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"><X className="h-3 w-3" /></Button>}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-2 mt-2">
                    <TabsContent value={activeTab} className="m-0 h-full pt-4">
                      {loadingElements ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                          <Loader2 className="h-10 w-10 animate-spin mb-4" />
                          <p className="text-sm font-medium">Fetching elements...</p>
                        </div>
                      ) : filteredElements.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-8">
                          {filteredElements.map(element => (
                            <div key={element.id} className="group relative flex flex-col gap-2 cursor-pointer" onClick={() => onSelect(element)}>
                              <div className="w-full aspect-square rounded-md overflow-hidden border bg-accent/50 relative">
                                {(element.thumbnail_url || element.reference_images?.[0])
                                  ? <img src={element.thumbnail_url || element.reference_images[0]} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                  : <div className="w-full h-full flex items-center justify-center opacity-10"><Box className="h-10 w-10" /></div>}
                                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                  <Button variant="secondary" size="icon" onClick={e => goEdit(element, e)} className="h-7 w-7 rounded-md shadow-lg"><Pencil className="h-3.5 w-3.5" /></Button>
                                  <Button variant="destructive" size="icon" onClick={e => handleDelete(element.id, e)} className="h-7 w-7 rounded-md shadow-lg"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                              <span className="text-xs font-bold opacity-90 truncate px-1">@{element.slug}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <AlertCircle className="h-10 w-10 opacity-10 mb-6" />
                          <p className="text-sm font-semibold opacity-60 mb-1">No {activeTab.toLowerCase()} found.</p>
                          <p className="text-xs opacity-30">Start by creating your first {activeTab.toLowerCase().slice(0, -1) || 'element'}.</p>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              <div className="absolute top-4 right-4 z-20">
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-9 w-9 rounded-md">
                  <X className="h-5 w-5 opacity-40" />
                </Button>
              </div>
            </motion.div>

          </div>

          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}