import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Pencil, User, MapPin, Box } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// Shadcn UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { 
  TypographyH4, 
  TypographySmall, 
  TypographyMuted, 
  TypographyH2
} from "@/components/ui/typography";
import { ConfirmDeleteDialog } from "@/components/studio/dialogs/ConfirmDeleteDialog";

const ELEMENT_TYPES = [
  { id: 'character', label: 'Character', icon: User },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'prop', label: 'Prop', icon: Box },
];

export default function ElementsDialog({ open, onOpenChange, onSelect }) {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [elementToDeleteId, setElementToDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    display_name: '',
    type: 'character',
    description: '',
    reference_images: []
  });

  const fetchElements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const query = params.toString();
      const res = await api.get(`/elements${query ? `?${query}` : ''}`);
      if (res.ok) setElements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchElements();
  }, [open, search, typeFilter]);

  const resetForm = () => {
    setShowCreate(false);
    setEditingId(null);
    setOriginalData(null);
    setFormData({ slug: '', display_name: '', type: 'character', description: '', reference_images: [] });
  };

  const handleEdit = (el, e) => {
    e.stopPropagation();
    setEditingId(el.id);
    const data = { ...el, reference_images: el.reference_images || [] };
    setFormData(data);
    setOriginalData(data);
    setShowCreate(true);
  };

  // Disable logic
  const imageCount = (formData.reference_images || []).length;
  const isCreateDisabled = !formData.slug || !formData.type || imageCount < 2;
  const isUpdateDisabled = originalData
    ? JSON.stringify(formData) === JSON.stringify(originalData)
    : false;
  const isSubmitDisabled = editingId ? isUpdateDisabled : isCreateDisabled;

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentImages = formData.reference_images || [];
    const maxImages = 10;
    const remainingSlots = maxImages - currentImages.length;
    if (remainingSlots <= 0) {
      alert(`You can only add up to ${maxImages} reference images.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    filesToUpload.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          reference_images: [
            ...(prev.reference_images || []),
            reader.result,
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      reference_images: (prev.reference_images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const count = (formData.reference_images || []).length;
    if (count < 2 || count > 10) {
      alert('Please add between 2 and 10 reference images before saving this element.');
      return;
    }
    const method = editingId ? 'patch' : 'post';
    const url = editingId ? `/elements/${editingId}` : '/elements';
    try {
      const res = await api[method](url, formData);
      if (res.ok) {
        resetForm();
        fetchElements();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setElementToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!elementToDeleteId) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/elements/${elementToDeleteId}`);
      if (res.ok) {
        fetchElements();
        setDeleteDialogOpen(false);
        setElementToDeleteId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="w-[1000px] h-[750px] max-w-[95vw] max-h-[90vh] bg-[#131517] border-white/10 p-0 overflow-hidden flex flex-col shadow-2xl rounded-[40px]">
        
        {/* Header */}
        <div className="pt-6 px-6  flex items-center justify-between gap-2">
          <div>
            <TypographyH2 className="text-white border-none m-0">
              {showCreate ? (editingId ? 'Edit Element' : 'New Element') : 'Elements'}
            </TypographyH2>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!showCreate ? (
            <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
              {/* Search + Filters + Add */}
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      icon={Search}
                      placeholder="Search elements..."
                      className="w-full"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
    
                </div>

                <Tabs value={typeFilter} onValueChange={setTypeFilter}>
                  <TabsList className="bg-transparent p-0 h-auto gap-2 flex flex-wrap">
                    <TabsTrigger
                      value="all"
                      className="rounded-lg px-5 py-2 text-sm font-medium border border-white/10 text-white/60 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-white data-[state=active]:shadow-md hover:text-white hover:bg-white/5 transition-all h-auto flex-none"
                    >
                      All types
                    </TabsTrigger>
                    {ELEMENT_TYPES.map(t => (
                      <TabsTrigger
                        key={t.id}
                        value={t.id}
                        className="rounded-lg px-5 py-2 text-sm font-medium border border-white/10 text-white/60 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-white data-[state=active]:shadow-md hover:text-white hover:bg-white/5 transition-all h-auto flex-none"
                      >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {loading ? (
                  <TypographyMuted className="col-span-full text-center py-10 text-white/20">
                    Loading...
                  </TypographyMuted>
                ) : (
                  <>
                    {/* Create New Card */}
                    <button
                      type="button"
                      onClick={() => setShowCreate(true)}
                      className="flex flex-col gap-1 items-start"
                    >
                      <div className="w-full aspect-square rounded-[20px] bg-gradient-to-b from-[#292a2c] to-[#1f2124] flex flex-col items-center justify-center transition-colors cursor-pointer hover:from-[#333435] hover:to-[#262729]">
                        <div className="backdrop-blur bg-white-4 border border-[rgba(197,197,197,0.3)] rounded-full mix-blend-luminosity shadow-[0px_-0.298px_5.356px_0px_inset_rgba(185,185,185,0.35)] p-2">
                          <svg
                            className="text-white size-4"
                            aria-hidden="true"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 3.75V12M12 12V20.25M12 12H3.75M12 12H20.25"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-full">
                        <span className="text-sm-medium text-white text-center">
                          Create new
                        </span>
                      </div>
                    </button>

                    {/* Elements (if any) */}
                    {elements.length != 0 && (
                      elements.map(el => (
                        <div 
                          key={el.id}
                          onClick={() => onSelect(el)}
                          className="group relative aspect-square border border-white/5 rounded-[20px] overflow-hidden cursor-pointer  transition-all"
                        >
                          {el.thumbnail_url || el.reference_images?.[0] ? (
                            <img src={el.thumbnail_url || el.reference_images[0]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10">
                              <Box size={40} />
                            </div>
                          )}
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 t p-2 flex flex-col justify-end">
                            <TypographySmall className="text-white font-semibold truncate">
                              @{el.slug}
                            </TypographySmall>
                           
                          </div>

                          {/* Actions */}
                          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => handleEdit(el, e)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-[#D4FF00]">
                              <Pencil size={14} />
                            </button>
                            <button onClick={(e) => handleDeleteClick(el.id, e)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-red-400">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Enhanced Create/Edit Form */
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="flex flex-col gap-6">
                  {/* Left: Meta */}
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="gap-2 flex-col flex">
                        <TypographySmall>
                          Type
                        </TypographySmall>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-2 w-full rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 text-sm text-white hover:bg-white/[0.07] transition-colors"
                            >
                              {(() => {
                                const t = ELEMENT_TYPES.find(t => t.id === formData.type);
                                const Icon = t?.icon;
                                return (
                                  <>
                                    {Icon && <Icon className="w-4 h-4 text-white/60" />}
                                    <span className="flex-1 text-left">{t?.label ?? 'Select type'}</span>
                                    <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  </>
                                );
                              })()}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="bg-[#1c1e20] border border-white/10 text-white min-w-[180px] rounded-xl p-1.5"
                            align="start"
                          >
                            {ELEMENT_TYPES.map(t => (
                              <DropdownMenuItem
                                key={t.id}
                                onClick={() => setFormData({ ...formData, type: t.id })}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors",
                                  formData.type === t.id
                                    ? "bg-white/10 text-white"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                                )}
                              >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                                {formData.type === t.id && (
                                  <svg className="ml-auto w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="gap-2 flex-col flex">
                        <TypographySmall>
                          Slug (@name)
                        </TypographySmall>
                        <Input 
                          required
                          placeholder="e.g. jihad"
                          value={formData.slug}
                          onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '')})}
                        />
                        <TypographyMuted className="text-[11px] text-white/40">
                          Unique handle you’ll use in prompts, like <span className="text-white">@{formData.slug || 'jihad'}</span>.
                        </TypographyMuted>
                      </div>
                    </div>
                  </div>

                  {/* Right: Reference Images */}
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <TypographySmall className="text-white">
                        Reference Images
                      </TypographySmall>
                      <TypographyMuted className="text-[11px] text-white/40">
                        Required · 2–10 images
                      </TypographyMuted>
                    </div>

                    <input
                      id="element-images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      <div className="grid grid-cols-4 gap-3">
                        {(formData.reference_images || []).map((img, index) => (
                          <div
                            key={index}
                            className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-square"
                          >
                            <img
                              src={img}
                              alt={`Reference ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-black/70 text-white/80 hover:text-white size-7"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {(formData.reference_images || []).length < 10 && (
                          <button
                            type="button"
                            onClick={() => document.getElementById('element-images')?.click()}
                            className="flex flex-col gap-1 items-start"
                          >
                            <div className="w-full aspect-square rounded-[20px] bg-gradient-to-b from-[#292a2c] to-[#1f2124] flex flex-col items-center justify-center transition-colors cursor-pointer hover:from-[#333435] hover:to-[#262729]">
                              <div className="backdrop-blur bg-white-4 border border-[rgba(197,197,197,0.3)] rounded-full mix-blend-luminosity shadow-[0px_-0.298px_5.356px_0px_inset_rgba(185,185,185,0.35)] p-2">
                                <svg
                                  className="text-white size-4"
                                  aria-hidden="true"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M12 3.75V12M12 12V20.25M12 12H3.75M12 12H20.25"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            </div>
                            <div className="flex items-center justify-center w-full">
                              <span className="text-[11px] font-medium uppercase tracking-widest text-white text-center">
                                Add image
                              </span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>

                    <TypographyMuted className="text-[11px] text-white/40">
                      Drop in snapshots or concept art so generations stay visually consistent with this element.
                    </TypographyMuted>
                  </div>
                </div>
              </div>

              <div className="p-6 flex justify-end gap-3">
                <Button 
                  type="button"
                  onClick={resetForm}
                  variant="ghost"
                  size="studio"
                  className="rounded-2xl "
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="studio-neon"
                  size="studio"
                  className="rounded-2xl !text-black"
                  disabled={isSubmitDisabled}
                >
                  {editingId ? 'Update' : 'Create'} Element
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmDeleteDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      title="Delete element?"
      description="This element will be deleted forever. You won't be able to use @ references for it anymore."
      onConfirm={handleDeleteConfirm}
      loading={deleteLoading}
    />
    </>
  );
}
