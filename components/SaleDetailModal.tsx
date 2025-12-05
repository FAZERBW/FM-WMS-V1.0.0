
import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { SaleRecord, SaleItem, RedemptionRecord } from '../types';
import { format } from 'date-fns';
import { Share2, Download, AlertTriangle, Truck, FileCheck, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { updateSale } from '../services/dataService';
import { v4 as uuidv4 } from 'uuid';

interface SaleDetailModalProps {
  sale: SaleRecord;
  onClose: () => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, onClose }) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'REDEEM' | 'RETURNS'>('DETAILS');
  
  // Share Settings
  const [shareConfig, setShareConfig] = useState({
    showPrices: true,
    showCustomer: true,
    showVehicle: true,
    showLabour: true,
    showAddress: true,
  });
  
  // Redemption State
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [redemptionStep, setRedemptionStep] = useState(0); 
  const [isPhysicalDamage, setIsPhysicalDamage] = useState(false);
  const [docsVerified, setDocsVerified] = useState(false);
  const [newSerial, setNewSerial] = useState('');
  
  // Return Tracking State
  const [trackingRecordId, setTrackingRecordId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({
    courierName: '',
    lrNumber: '',
    creditNote: '',
    creditAmount: ''
  });

  // --- PDF Logic ---
  const generatePDF = () => {
    // Note: In a real implementation, importing jsPDF from 'jspdf' and using it directly
    const PdfClass = (jsPDF as any).default || jsPDF;
    const doc = new PdfClass();
    doc.setFontSize(18);
    doc.text("FM WMS - Receipt", 10, 10);
    
    doc.setFontSize(10);
    if(shareConfig.showAddress) {
       doc.text("Shop no.4, Naaz Complex, Dhule", 10, 16);
    }
    
    doc.text(`Bill No: ${sale.billNumber}`, 10, 25);
    doc.text(`Date: ${format(sale.date, "dd MMM yyyy")}`, 10, 30);
    
    if (shareConfig.showCustomer) {
      doc.text(`Customer: ${sale.customerName}`, 10, 38);
      doc.text(`Phone: ${sale.customerPhone}`, 10, 43);
    }

    if (shareConfig.showVehicle) {
      doc.text(`Vehicle: ${sale.vehicleStr || 'N/A'}`, 10, 50);
    }

    let y = 60;
    doc.line(10, y-2, 200, y-2);
    sale.items.forEach(item => {
      let line = `${item.brand} ${item.model} (${item.serialNumber})`;
      if (shareConfig.showPrices) line += ` - Rs.${item.billAmount}`;
      doc.text(line, 10, y);
      y += 7;
    });
    
    // Add Labour if shown
    if (shareConfig.showLabour) {
        if (sale.paymentDetails.fittingLabour?.amount) {
            doc.text(`Labour (Fit): Rs.${sale.paymentDetails.fittingLabour.amount}`, 10, y);
            y+=7;
        }
    }

    doc.save(`Bill_${sale.billNumber}.pdf`);
  };

  // --- Redemption Logic ---
  const processRedemption = (resolution: 'REPLACEMENT') => {
    if (!selectedItem) return;

    const record: RedemptionRecord = {
      id: uuidv4(),
      date: Date.now(),
      type: resolution,
      oldItemSerial: selectedItem.serialNumber,
      newItemSerial: newSerial,
      reason: 'Internal Failure',
      notes: 'Warranty Claim Processed',
      returnTracking: {
        status: 'AT_SHOP'
      }
    };

    const updatedRedemptions = [...(sale.redemptions || []), record];
    updateSale(sale.id, { redemptions: updatedRedemptions });
    alert("Replacement Recorded! Added to 'Returns' queue.");
    setRedemptionStep(0);
    setSelectedItem(null);
  };

  // --- Return Tracking Logic ---
  const updateReturnStatus = () => {
    if (!trackingRecordId) return;
    const redemptionIndex = sale.redemptions.findIndex(r => r.id === trackingRecordId);
    if (redemptionIndex === -1) return;

    const record = sale.redemptions[redemptionIndex];
    let updatedRecord = { ...record };

    if (record.returnTracking?.status === 'AT_SHOP') {
      // Sending to company
      updatedRecord.returnTracking = {
        ...record.returnTracking,
        status: 'SENT_TO_COMPANY',
        sentDate: Date.now(),
        courierName: trackingForm.courierName,
        lrNumber: trackingForm.lrNumber
      };
    } else if (record.returnTracking?.status === 'SENT_TO_COMPANY') {
      // Credit Recvd
      updatedRecord.returnTracking = {
        ...record.returnTracking,
        status: 'CREDIT_RECEIVED',
        creditDate: Date.now(),
        creditNoteNumber: trackingForm.creditNote,
        creditAmount: parseFloat(trackingForm.creditAmount)
      };
    }

    const newRedemptions = [...sale.redemptions];
    newRedemptions[redemptionIndex] = updatedRecord;
    updateSale(sale.id, { redemptions: newRedemptions });
    setTrackingRecordId(null);
    setTrackingForm({ courierName: '', lrNumber: '', creditNote: '', creditAmount: '' });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Sale #${sale.billNumber}`} size="lg">
      <div className="flex space-x-1 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab('DETAILS')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'DETAILS' ? 'bg-white/10 text-sky-400' : 'text-slate-400'}`}>Details</button>
        <button onClick={() => setActiveTab('REDEEM')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'REDEEM' ? 'bg-white/10 text-sky-400' : 'text-slate-400'}`}>Warranty Claim</button>
        <button onClick={() => setActiveTab('RETURNS')} className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${activeTab === 'RETURNS' ? 'bg-white/10 text-sky-400' : 'text-slate-400'}`}>Product Returns ({sale.redemptions?.length || 0})</button>
      </div>

      {activeTab === 'DETAILS' && (
        <div className="space-y-6">
           {/* Detailed View */}
           <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 p-3 rounded">
                <span className="text-slate-400 block text-xs">Total Bill</span>
                <span className="font-bold text-lg text-white">₹{sale.paymentDetails.billedAmount}</span>
              </div>
              <div className="bg-white/5 p-3 rounded">
                <span className="text-slate-400 block text-xs">Received</span>
                <span className="font-bold text-white text-lg">₹{sale.paymentDetails.receivedAmount}</span>
              </div>
           </div>
           
           {/* Download Config */}
           <div className="bg-slate-900 border border-white/10 p-4 rounded-xl">
             <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
               <Share2 size={12} className="mr-2" /> Share / Download Options
             </h5>
             <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
               <label className="flex items-center space-x-2"><input type="checkbox" checked={shareConfig.showPrices} onChange={e => setShareConfig({...shareConfig, showPrices: e.target.checked})}/> <span>Show Prices</span></label>
               <label className="flex items-center space-x-2"><input type="checkbox" checked={shareConfig.showCustomer} onChange={e => setShareConfig({...shareConfig, showCustomer: e.target.checked})}/> <span>Show Customer</span></label>
               <label className="flex items-center space-x-2"><input type="checkbox" checked={shareConfig.showVehicle} onChange={e => setShareConfig({...shareConfig, showVehicle: e.target.checked})}/> <span>Show Vehicle</span></label>
               <label className="flex items-center space-x-2"><input type="checkbox" checked={shareConfig.showLabour} onChange={e => setShareConfig({...shareConfig, showLabour: e.target.checked})}/> <span>Show Labour</span></label>
               <label className="flex items-center space-x-2"><input type="checkbox" checked={shareConfig.showAddress} onChange={e => setShareConfig({...shareConfig, showAddress: e.target.checked})}/> <span>Show Shop Address</span></label>
             </div>
             <button onClick={generatePDF} className="mt-4 w-full py-2 bg-sky-600 rounded-lg text-white font-bold flex items-center justify-center">
               <Download size={16} className="mr-2" /> Download PDF
             </button>
           </div>
        </div>
      )}

      {activeTab === 'REDEEM' && (
        <div>
           {redemptionStep === 0 && (
             <div className="space-y-3">
               <p className="text-sm text-slate-400">Select item for warranty claim:</p>
               {sale.items.map(item => (
                 <button 
                   key={item.id}
                   onClick={() => { setSelectedItem(item); setRedemptionStep(1); }}
                   className="w-full text-left p-3 bg-white/5 border border-white/10 hover:border-sky-500 rounded-lg"
                 >
                   {item.brand} {item.model} <br/> <span className="text-xs text-slate-500">{item.serialNumber}</span>
                 </button>
               ))}
             </div>
           )}

           {redemptionStep === 1 && (
             <div className="space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                  <h4 className="text-red-400 font-bold mb-2 flex items-center"><AlertTriangle size={18} className="mr-2"/> Damage Check</h4>
                  <label className="flex items-center space-x-3 text-white">
                    <input type="checkbox" checked={isPhysicalDamage} onChange={e => setIsPhysicalDamage(e.target.checked)} className="w-5 h-5 accent-red-500" />
                    <span>Is the product physically broken/burnt?</span>
                  </label>
                  {isPhysicalDamage && <p className="text-xs text-red-300 mt-2">Physical damage is NOT covered. Please cancel request.</p>}
                </div>

                {!isPhysicalDamage && (
                   <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl">
                     <h4 className="text-sky-400 font-bold mb-2 flex items-center"><FileCheck size={18} className="mr-2"/> Document Check</h4>
                     <label className="flex items-center space-x-3 text-white">
                       <input type="checkbox" checked={docsVerified} onChange={e => setDocsVerified(e.target.checked)} className="w-5 h-5 accent-sky-500" />
                       <span>Has Bill / Warranty Card copy?</span>
                     </label>
                   </div>
                )}
                
                <div className="flex space-x-3">
                  <button onClick={() => setRedemptionStep(0)} className="flex-1 py-3 bg-white/5 rounded-lg text-slate-400">Cancel</button>
                  <button 
                    disabled={isPhysicalDamage || !docsVerified}
                    onClick={() => setRedemptionStep(2)}
                    className="flex-1 py-3 bg-green-600 disabled:opacity-50 rounded-lg text-white font-bold"
                  >
                    Next
                  </button>
                </div>
             </div>
           )}

           {redemptionStep === 2 && (
             <div className="space-y-4">
               <h4 className="font-bold text-white">Resolution</h4>
               <input 
                 placeholder="Scan NEW Product Serial"
                 value={newSerial}
                 onChange={e => setNewSerial(e.target.value)}
                 className="w-full bg-slate-900 border border-white/10 p-3 rounded text-white"
               />
               <button 
                 onClick={() => processRedemption('REPLACEMENT')}
                 className="w-full py-3 bg-green-600 rounded-lg text-white font-bold"
               >
                 Issue Replacement
               </button>
             </div>
           )}
        </div>
      )}

      {activeTab === 'RETURNS' && (
        <div className="space-y-4">
           {sale.redemptions.length === 0 && <p className="text-slate-500">No returns recorded.</p>}
           
           {sale.redemptions.map(r => (
             <div key={r.id} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Old Serial</span>
                    <span className="font-mono font-bold text-red-300">{r.oldItemSerial}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Status</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      r.returnTracking?.status === 'CREDIT_RECEIVED' ? 'bg-green-500/20 text-green-400' :
                      r.returnTracking?.status === 'SENT_TO_COMPANY' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>
                      {r.returnTracking?.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Actions based on Status */}
                {r.returnTracking?.status === 'AT_SHOP' && (
                   <div className="mt-3 pt-3 border-t border-white/5">
                      {trackingRecordId === r.id ? (
                        <div className="space-y-2 animate-fade-in">
                           <input placeholder="Courier Name" className="w-full bg-black/30 p-2 rounded text-xs text-white border border-white/10" value={trackingForm.courierName} onChange={e => setTrackingForm({...trackingForm, courierName: e.target.value})} />
                           <input placeholder="LR Number" className="w-full bg-black/30 p-2 rounded text-xs text-white border border-white/10" value={trackingForm.lrNumber} onChange={e => setTrackingForm({...trackingForm, lrNumber: e.target.value})} />
                           <button onClick={updateReturnStatus} className="w-full py-2 bg-blue-600 rounded text-xs text-white font-bold">Mark Sent</button>
                        </div>
                      ) : (
                        <button onClick={() => setTrackingRecordId(r.id)} className="w-full py-2 bg-white/10 hover:bg-white/20 rounded text-xs text-white flex items-center justify-center">
                          <Truck size={14} className="mr-2"/> Send to Company
                        </button>
                      )}
                   </div>
                )}

                {r.returnTracking?.status === 'SENT_TO_COMPANY' && (
                   <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-slate-500 mb-2">Sent via {r.returnTracking.courierName} (LR: {r.returnTracking.lrNumber})</p>
                      {trackingRecordId === r.id ? (
                        <div className="space-y-2 animate-fade-in">
                           <input placeholder="Credit Note No." className="w-full bg-black/30 p-2 rounded text-xs text-white border border-white/10" value={trackingForm.creditNote} onChange={e => setTrackingForm({...trackingForm, creditNote: e.target.value})} />
                           <input placeholder="Amount (₹)" type="number" className="w-full bg-black/30 p-2 rounded text-xs text-white border border-white/10" value={trackingForm.creditAmount} onChange={e => setTrackingForm({...trackingForm, creditAmount: e.target.value})} />
                           <button onClick={updateReturnStatus} className="w-full py-2 bg-green-600 rounded text-xs text-white font-bold">Receive Credit</button>
                        </div>
                      ) : (
                        <button onClick={() => setTrackingRecordId(r.id)} className="w-full py-2 bg-white/10 hover:bg-white/20 rounded text-xs text-white flex items-center justify-center">
                          <CheckCircle2 size={14} className="mr-2"/> Record Credit Note
                        </button>
                      )}
                   </div>
                )}
             </div>
           ))}
        </div>
      )}
    </Modal>
  );
};
