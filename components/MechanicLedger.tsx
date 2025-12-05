import React, { useState, useEffect } from 'react';
import { GlassCard } from './ui/GlassCard';
import { Modal } from './ui/Modal';
import { 
  getMechanics, 
  getLedger, 
  addLedgerEntry, 
  createMechanic, 
  updateMechanic, 
  deleteMechanic 
} from '../services/dataService';
import { MechanicProfile, LedgerEntry } from '../types';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  UserPlus, 
  Users, 
  Trash2, 
  Edit2, 
  Save,
  AlertTriangle 
} from 'lucide-react';

export const MechanicLedger: React.FC = () => {
  const [mechanics, setMechanics] = useState<MechanicProfile[]>([]);
  const [selectedMech, setSelectedMech] = useState<string | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payoutAmount, setPayoutAmount] = useState('');

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null); // If null, we are adding
  const [mechName, setMechName] = useState('');
  const [mechPhone, setMechPhone] = useState('');

  // Modal State for Delete Confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mechToDelete, setMechToDelete] = useState<MechanicProfile | null>(null);

  const refresh = () => {
    const mechs = getMechanics();
    setMechanics(mechs);
    
    // If the selected mechanic was deleted, deselect
    if (selectedMech && !mechs.find(m => m.id === selectedMech)) {
      setSelectedMech(null);
      setLedger([]);
    } else if (selectedMech) {
      setLedger(getLedger(selectedMech));
    }
  };

  useEffect(() => {
    refresh();
    
    // Listen for history undo/redo events
    const handleStorageUpdate = () => refresh();
    window.addEventListener('storage-update', handleStorageUpdate);
    return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, [selectedMech]);

  const handlePayout = () => {
    if (!selectedMech || !payoutAmount) return;
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) return;

    addLedgerEntry({
      mechanicId: selectedMech,
      type: 'PAYOUT',
      amount: amount,
      description: 'Cash Payout via Admin'
    });
    
    setPayoutAmount('');
    refresh();
  };

  // --- Handlers for Add/Edit/Delete ---

  const openAddModal = () => {
    setEditModeId(null);
    setMechName('');
    setMechPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, mech: MechanicProfile) => {
    e.stopPropagation();
    setEditModeId(mech.id);
    setMechName(mech.name);
    setMechPhone(mech.phone);
    setIsModalOpen(true);
  };

  const handleSaveProfile = () => {
    if (!mechName.trim()) return alert("Name is required");

    if (editModeId) {
      updateMechanic(editModeId, { name: mechName, phone: mechPhone });
    } else {
      const newMech = createMechanic(mechName, mechPhone || "N/A");
      setSelectedMech(newMech.id);
    }
    
    setIsModalOpen(false);
    refresh();
  };

  const requestDelete = (e: React.MouseEvent, mech: MechanicProfile) => {
    e.stopPropagation();
    setMechToDelete(mech);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (mechToDelete) {
      deleteMechanic(mechToDelete.id);
      refresh();
      setIsDeleteModalOpen(false);
      setMechToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between mb-4">
        <div>
           <h2 className="text-3xl font-bold text-white">Manage Labour</h2>
           <p className="text-slate-400 mt-1">Track payouts for Wiremen, Service Managers, and Mechanics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mechanic List */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="font-bold text-lg text-slate-200">Labour Profiles</h3>
             <button 
               onClick={openAddModal}
               className="p-2 bg-white/5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
               title="Add New Profile"
             >
               <Plus size={20} />
             </button>
          </div>

          {/* List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {mechanics.map(m => (
              <div 
                key={m.id}
                onClick={() => setSelectedMech(m.id)}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all group ${
                  selectedMech === m.id 
                    ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <Users size={16} className={selectedMech === m.id ? 'opacity-80' : 'opacity-40'} />
                    <p className="font-semibold">{m.name}</p>
                  </div>
                  <p className="text-xs opacity-70 ml-6">{m.phone}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Action Buttons */}
                  <div className={`flex items-center space-x-1 ${selectedMech === m.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button 
                      onClick={(e) => openEditModal(e, m)}
                      className={`p-1.5 rounded-lg transition-colors ${selectedMech === m.id ? 'hover:bg-white/20' : 'hover:bg-white/10 hover:text-cyan-400'}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => requestDelete(e, m)}
                      className={`p-1.5 rounded-lg transition-colors ${selectedMech === m.id ? 'hover:bg-white/20' : 'hover:bg-white/10 hover:text-red-400'}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm opacity-70">Balance</p>
                    <p className="font-bold text-lg">₹{m.walletBalance}</p>
                  </div>
                </div>
              </div>
            ))}
            {mechanics.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-4">No profiles added yet.</p>
            )}
          </div>
        </div>

        {/* Ledger Details */}
        <div className="md:col-span-2">
          {selectedMech ? (
            <div className="space-y-6">
              <GlassCard 
                title="Wallet Actions" 
                className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20"
              >
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs text-orange-300 mb-1">Payout Amount (₹)</label>
                    <input 
                      type="number" 
                      value={payoutAmount}
                      onChange={e => setPayoutAmount(e.target.value)}
                      className="w-full bg-slate-900/50 border border-orange-500/30 rounded p-2 text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <button 
                    onClick={handlePayout}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded shadow-lg shadow-orange-500/20 font-medium"
                  >
                    Record Payout
                  </button>
                </div>
              </GlassCard>

              <GlassCard title="Transaction History">
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {ledger.slice().reverse().map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${entry.type === 'CREDIT' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {entry.type === 'CREDIT' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{entry.description}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${entry.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.type === 'CREDIT' ? '+' : '-'} ₹{entry.amount}
                      </span>
                    </div>
                  ))}
                  {ledger.length === 0 && <p className="text-center text-slate-500 py-4">No transactions found.</p>}
                </div>
              </GlassCard>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 border border-dashed border-white/10 rounded-2xl">
              <Wallet size={48} className="mb-4 opacity-50" />
              <p>Select a profile to view their Khata ledger.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editModeId ? "Edit Profile" : "Add Labour Profile"}
      >
         <div className="space-y-4">
           <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Name / Role</label>
             <input 
               type="text" 
               placeholder="e.g. Raju Wireman" 
               className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
               value={mechName}
               onChange={e => setMechName(e.target.value)}
               autoFocus
             />
           </div>
           <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Mobile Number</label>
             <input 
               type="tel" 
               placeholder="e.g. 9876543210" 
               className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
               value={mechPhone}
               onChange={e => setMechPhone(e.target.value)}
             />
           </div>
           <button 
             onClick={handleSaveProfile}
             className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 mt-2"
           >
             {editModeId ? <Save size={18} /> : <UserPlus size={18} />}
             <span>{editModeId ? "Save Changes" : "Create Profile"}</span>
           </button>
         </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirm Deletion"
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-slate-300">
              Are you sure you want to delete <span className="text-white font-bold">{mechToDelete?.name}</span>?
            </p>
            <p className="text-xs text-slate-500 mt-2">
              This will remove their profile and wallet balance.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="py-2.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-colors font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};