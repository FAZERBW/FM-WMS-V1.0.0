import React, { useState, useEffect } from 'react';
import { GlassCard } from './ui/GlassCard';
import { Modal } from './ui/Modal';
import { getProductHierarchy, saveProductHierarchy } from '../services/dataService';
import { ProductHierarchy, ProductVariant } from '../types';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Edit2, 
  Save, 
  Plus, 
  Check, 
  X, 
  AlertTriangle,
  Zap,
  Tag
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ProductConfigManager: React.FC = () => {
  // Local state to manage the edits before saving globally
  const [data, setData] = useState<ProductHierarchy>({});
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  
  // Renaming State
  const [editingBrandOldName, setEditingBrandOldName] = useState<string | null>(null);
  const [tempBrandName, setTempBrandName] = useState('');

  // Delete Confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    setData(getProductHierarchy());
  }, []);

  const toggleExpand = (brand: string) => {
    if (editingBrandOldName) return; 
    setExpandedBrand(expandedBrand === brand ? null : brand);
  };

  // --- Brand Management ---

  const addBrand = () => {
    const newName = "New Brand " + Math.floor(Math.random() * 100);
    const newVariant: ProductVariant = {
      id: uuidv4(),
      wattage: "100W",
      warrantyMonths: 12,
      models: ["H4"]
    };
    
    setData(prev => ({ ...prev, [newName]: [newVariant] }));
    setExpandedBrand(newName);
    // Auto-start editing
    setEditingBrandOldName(newName);
    setTempBrandName(newName);
  };

  const startEditingBrand = (e: React.MouseEvent, brandName: string) => {
    e.stopPropagation();
    setEditingBrandOldName(brandName);
    setTempBrandName(brandName);
  };

  const saveBrandName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tempBrandName.trim() || !editingBrandOldName) return;
    
    // Rename key in object
    const newData = { ...data };
    const content = newData[editingBrandOldName];
    delete newData[editingBrandOldName];
    newData[tempBrandName] = content;
    
    setData(newData);
    setEditingBrandOldName(null);
    setExpandedBrand(tempBrandName);
  };

  const cancelEditingBrand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBrandOldName(null);
  };

  const requestDeleteBrand = (e: React.MouseEvent, brandName: string) => {
    e.stopPropagation();
    setDeleteConfirmation(brandName);
  };

  const confirmDeleteBrand = () => {
    if (deleteConfirmation) {
      const newData = { ...data };
      delete newData[deleteConfirmation];
      setData(newData);
      setDeleteConfirmation(null);
    }
  };

  // --- Variant Management ---

  const addVariant = (brandName: string) => {
    const newVariant: ProductVariant = {
      id: uuidv4(),
      wattage: "",
      warrantyMonths: 12,
      models: []
    };
    
    setData(prev => ({
      ...prev,
      [brandName]: [...prev[brandName], newVariant]
    }));
  };

  const removeVariant = (brandName: string, variantId: string) => {
    setData(prev => ({
      ...prev,
      [brandName]: prev[brandName].filter(v => v.id !== variantId)
    }));
  };

  const updateVariant = (brandName: string, variantId: string, field: keyof ProductVariant, value: any) => {
    setData(prev => ({
      ...prev,
      [brandName]: prev[brandName].map(v => v.id === variantId ? { ...v, [field]: value } : v)
    }));
  };

  // --- Model Management (Tags) ---

  const addModel = (brandName: string, variantId: string, modelName: string) => {
    if (!modelName.trim()) return;
    const currentModels = data[brandName].find(v => v.id === variantId)?.models || [];
    if (currentModels.includes(modelName)) return;

    setData(prev => ({
      ...prev,
      [brandName]: prev[brandName].map(v => 
        v.id === variantId ? { ...v, models: [...v.models, modelName.trim()] } : v
      )
    }));
  };

  const removeModel = (brandName: string, variantId: string, modelName: string) => {
    setData(prev => ({
      ...prev,
      [brandName]: prev[brandName].map(v => 
        v.id === variantId ? { ...v, models: v.models.filter(m => m !== modelName) } : v
      )
    }));
  };

  // --- Global Save ---
  const handleGlobalSave = () => {
    saveProductHierarchy(data);
    alert("Product Configuration Saved!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold text-white">Product Configuration</h2>
           <p className="text-xs text-slate-400 mt-1">Manage Brands, Wattages, and Warranties</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={addBrand}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-sm transition-colors"
          >
            <Plus size={16} />
            <span>Add Brand</span>
          </button>
          
          <button 
            onClick={handleGlobalSave}
            className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-sm font-bold shadow-lg shadow-cyan-500/20"
          >
            <Save size={16} />
            <span>Save All</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {(Object.entries(data) as [string, ProductVariant[]][]).map(([brandName, variants]) => (
          <GlassCard key={brandName} className={`transition-all duration-300 ${expandedBrand === brandName ? 'ring-1 ring-cyan-500/30' : ''} p-0 overflow-hidden`}>
            {/* Brand Header */}
            <div 
              onClick={() => toggleExpand(brandName)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors bg-white/[0.02]"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className={`p-2 rounded-lg ${expandedBrand === brandName ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
                  {expandedBrand === brandName ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

                {editingBrandOldName === brandName ? (
                  <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                    <input 
                      className="bg-slate-900/80 border border-cyan-500/50 rounded px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-lg font-bold"
                      value={tempBrandName}
                      onChange={e => setTempBrandName(e.target.value)}
                      autoFocus
                    />
                    <button onClick={saveBrandName} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"><Check size={18}/></button>
                    <button onClick={cancelEditingBrand} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"><X size={18}/></button>
                  </div>
                ) : (
                  <span className="font-bold text-lg text-slate-200">{brandName}</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {!editingBrandOldName && (
                  <>
                    <button 
                      onClick={(e) => startEditingBrand(e, brandName)}
                      className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="Rename Brand"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => requestDeleteBrand(e, brandName)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Brand"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Brand Body (Variants List) */}
            {expandedBrand === brandName && (
              <div className="border-t border-white/10 bg-[#0b1120] p-4 animate-fade-in space-y-4">
                {variants.map((variant, index) => (
                  <div key={variant.id} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 relative group">
                     <button 
                        onClick={() => removeVariant(brandName, variant.id)}
                        className="absolute top-2 right-2 text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Variant"
                     >
                        <X size={16} />
                     </button>

                     <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Config Inputs */}
                        <div className="md:col-span-4 space-y-3">
                           <div>
                             <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center mb-1">
                               <Zap size={12} className="mr-1"/> Power / Wattage
                             </label>
                             <input 
                               value={variant.wattage}
                               onChange={(e) => updateVariant(brandName, variant.id, 'wattage', e.target.value)}
                               placeholder="e.g. 100/90W"
                               className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-cyan-200"
                             />
                           </div>
                           <div>
                             <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">
                               Warranty (Months)
                             </label>
                             <input 
                               type="number"
                               value={variant.warrantyMonths}
                               onChange={(e) => updateVariant(brandName, variant.id, 'warrantyMonths', parseInt(e.target.value) || 0)}
                               className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-orange-200"
                             />
                           </div>
                        </div>

                        {/* Models (Tags) */}
                        <div className="md:col-span-8">
                           <label className="text-[10px] text-slate-500 uppercase font-bold flex items-center mb-2">
                             <Tag size={12} className="mr-1"/> Compatible Models
                           </label>
                           <div className="flex flex-wrap gap-2 mb-2">
                             {variant.models.map(model => (
                               <span key={model} className="inline-flex items-center px-2 py-1 rounded bg-slate-700 text-slate-200 text-xs border border-white/10">
                                 {model}
                                 <button 
                                   onClick={() => removeModel(brandName, variant.id, model)}
                                   className="ml-2 hover:text-red-400"
                                 >
                                   <X size={12} />
                                 </button>
                               </span>
                             ))}
                           </div>
                           <input 
                             placeholder="Type model (e.g. H4) & press Enter"
                             className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 e.preventDefault();
                                 addModel(brandName, variant.id, e.currentTarget.value);
                                 e.currentTarget.value = '';
                               }
                             }}
                           />
                           <p className="text-[10px] text-slate-600 mt-1">Press Enter to add model</p>
                        </div>
                     </div>
                  </div>
                ))}

                <button 
                  onClick={() => addVariant(brandName)}
                  className="w-full py-3 border border-dashed border-white/10 rounded-xl text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-white/5 transition-all flex items-center justify-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Power Configuration</span>
                </button>
              </div>
            )}
          </GlassCard>
        ))}

        {Object.keys(data).length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
            <p className="text-slate-500">No products configured.</p>
            <button onClick={addBrand} className="text-cyan-400 text-sm font-bold mt-2 hover:underline">Add your first brand</button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={!!deleteConfirmation} 
        onClose={() => setDeleteConfirmation(null)} 
        title="Delete Brand?"
        size="sm"
      >
        <div className="text-center space-y-4">
           <div className="mx-auto w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <p className="text-slate-300">
            Are you sure you want to delete <span className="text-white font-bold">{deleteConfirmation}</span>?
          </p>
          <p className="text-xs text-slate-500">
            This will delete all power configurations and models associated with this brand.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setDeleteConfirmation(null)} className="py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300">Cancel</button>
            <button onClick={confirmDeleteBrand} className="py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};