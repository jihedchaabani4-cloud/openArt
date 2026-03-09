import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Pencil, User, MapPin, Box } from 'lucide-react';
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
import { Label } from "@/components/ui/label";
import { 
  TypographyH4, 
  TypographySmall, 
  TypographyMuted 
} from "@/components/ui/typography";

const ELEMENT_TYPES = [
  { id: 'character', label: 'Character', icon: User },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'prop', label: 'Prop', icon: Box },
];

export default function ElementsDialog({ open, onOpenChange, onSelect }) {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      const res = await api.get(`/elements${search ? `?search=${search}` : ''}`);
      if (res.ok) setElements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchElements();
  }, [open, search]);

  const resetForm = () => {
    setShowCreate(false);
    setEditingId(null);
    setFormData({ slug: '', display_name: '', type: 'character', description: '', reference_images: [] });
  };

  const handleEdit = (el, e) => {
    e.stopPropagation();
    setEditingId(el.id);
    setFormData({ ...el });
    setShowCreate(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this element?')) return;
    try {
      const res = await api.delete(`/elements/${id}`);
      if (res.ok) fetchElements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="w-[1000px] h-[750px] max-w-[95vw] max-h-[90vh] bg-[#111] border-white/10 p-0 overflow-hidden flex flex-col shadow-2xl rounded-[40px]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <TypographyH4 className="text-white border-none m-0">
            {showCreate ? (editingId ? 'Edit Element' : 'New Element') : 'Story Elements'}
          </TypographyH4>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!showCreate ? (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Search + Add */}
              <div className="flex gap-3 mb-8">
                <div className="relative flex-1">
                  <Input
                    icon={Search}
                    placeholder="Search..."
                    className="w-full"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => setShowCreate(true)}
                  variant="studio-neon"
                  size="studio"
                  className="rounded-2xl !text-black"
                >
                  <Plus size={20} />
                </Button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {loading ? (
                  <TypographyMuted className="col-span-full text-center py-10 text-white/20">
                    Loading...
                  </TypographyMuted>
                ) : elements.length === 0 ? (
                  <TypographyMuted className="col-span-full text-center py-10 text-white/20">
                    No elements found.
                  </TypographyMuted>
                ) : (
                  elements.map(el => (
                    <div 
                      key={el.id}
                      onClick={() => onSelect(el)}
                      className="group relative aspect-square bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden cursor-pointer hover:bg-white/[0.06] transition-all"
                    >
                      {el.thumbnail_url || el.reference_images?.[0] ? (
                        <img src={el.thumbnail_url || el.reference_images[0]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <Box size={40} />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                        <TypographySmall className="text-white font-bold truncate">
                          @{el.slug}
                        </TypographySmall>
                        <TypographySmall className="text-white/40 text-[10px] uppercase tracking-widest leading-none mt-0.5">
                          {el.type}
                        </TypographySmall>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleEdit(el, e)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-[#D4FF00]">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => handleDelete(el.id, e)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Simple Form */
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="gap-2 flex-col flex">
                    <TypographySmall >
                      Type
                    </TypographySmall>
                    <Select
                      value={formData.type}
                      onValueChange={type => setFormData({...formData, type})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#222] border-white/10 text-white">
                        {ELEMENT_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="gap-2 flex-col flex">
                    <TypographySmall >
                      Slug (@name)
                    </TypographySmall>
                    <Input 
                      required
                      placeholder="e.g. jihad"
                      value={formData.slug}
                      onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '')})}
                    />
                  </div>
                </div>

                <div className="gap-2 flex-col flex">
                  <TypographySmall >
                    Display Name
                  </TypographySmall>
                  <Input 
                    placeholder="e.g. Jihad"
                    value={formData.display_name}
                    onChange={e => setFormData({...formData, display_name: e.target.value})}
                  />
                </div>

                <div className="gap-2 flex-col flex">
                  <TypographySmall>
                    Visual DNA
                  </TypographySmall>
                  <Textarea 
                    placeholder="Describe appearance..."
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex justify-end gap-3">
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
                >
                  {editingId ? 'Update' : 'Create'} Element
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
