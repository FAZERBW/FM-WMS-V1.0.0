import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { SaleRecord } from "../types";
import { format } from "date-fns";

export const generateWarrantyCard = async (sale: SaleRecord) => {
  // Check if jsPDF constructor is available, handle default export quirks
  const PdfClass = (jsPDF as any).default || jsPDF;
  
  const doc = new PdfClass({
    orientation: "portrait",
    unit: "mm",
    format: "a5" // Warranty cards look good in A5
  });

  // --- Theme Colors ---
  const primaryColor = sale.customerType === 'C1' ? [6, 182, 212] : [249, 115, 22]; // Cyan or Orange
  const darkBg = [15, 23, 42]; // Slate 900
  const textLight = [241, 245, 249];

  // --- Background ---
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.rect(0, 0, 148, 210, "F");

  // --- Header ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 148, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("WARRANTY CERTIFICATE", 74, 15, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("FM Auto Parts | Official Retailer", 74, 22, { align: "center" });

  // --- Details Box ---
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.1);
  
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  
  // Left Side Info
  let y = 45;
  doc.text("Customer:", 15, y);
  doc.setTextColor(255, 255, 255);
  doc.text(sale.customerName, 40, y);
  
  y += 7;
  doc.setTextColor(200, 200, 200);
  doc.text("Phone:", 15, y);
  doc.setTextColor(255, 255, 255);
  doc.text(sale.customerPhone || "N/A", 40, y);

  y += 7;
  doc.setTextColor(200, 200, 200);
  doc.text("Date:", 15, y);
  doc.setTextColor(255, 255, 255);
  doc.text(format(sale.date, "dd MMM yyyy"), 40, y);

  // Right Side (QR Code)
  try {
    const qrData = JSON.stringify({
      id: sale.id,
      date: sale.date,
      customer: sale.customerName
    });
    const qrDataUrl = await QRCode.toDataURL(qrData);
    doc.addImage(qrDataUrl, "PNG", 100, 35, 30, 30);
    
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(sale.id.slice(0, 18) + "...", 115, 68, { align: "center" });
  } catch (err) {
    console.error("QR Gen Error", err);
  }

  // --- Product Table ---
  y = 80;
  
  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(10, y, 128, 8, "F");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ITEM / MODEL", 15, y + 5);
  doc.text("SERIAL NO.", 70, y + 5);
  doc.text("WARRANTY", 110, y + 5);

  // Table Body
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);

  sale.items.forEach((item) => {
    doc.text(`${item.brand} ${item.model} (${item.wattage})`, 15, y);
    doc.setFont("courier", "normal");
    doc.text(item.serialNumber, 70, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.warrantyDurationMonths} Months`, 110, y);
    
    // Separator line
    doc.setDrawColor(50, 50, 50);
    doc.line(10, y + 2, 138, y + 2);
    
    y += 10;
  });

  // --- Footer Terms ---
  const footerY = 180;
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("TERMS & CONDITIONS:", 10, footerY);
  doc.text("1. Warranty valid only for internal failure.", 10, footerY + 5);
  doc.text("2. Physical damage, broken glass, or cut wires VOID warranty.", 10, footerY + 9);
  doc.text("3. This card must be presented for claims.", 10, footerY + 13);
  
  // Footer Brand
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(8);
  doc.text("Powered by FM WMS", 148/2, 200, { align: "center" });

  doc.save(`Warranty_${sale.customerName}_${format(Date.now(), "dd-MM")}.pdf`);
};