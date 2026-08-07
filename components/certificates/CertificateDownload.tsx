import React, { useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

interface CertificateDownloadProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  fileName: string;
}

export const CertificateDownload: React.FC<CertificateDownloadProps> = ({
  canvasRef,
  fileName
}) => {
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const generatePngBlob = async (): Promise<string> => {
    if (!canvasRef.current) throw new Error("Certificate element not found");
    
    // Ensure fonts and styles are loaded before screenshotting
    return await toPng(canvasRef.current, {
      width: 800,
      height: 580,
      style: {
        transform: "scale(1)",
        transformOrigin: "top left",
      },
      cacheBust: true,
    });
  };

  const handleDownloadPng = async () => {
    if (downloadingPng) return;
    setDownloadingPng(true);
    try {
      const dataUrl = await generatePngBlob();
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[ERROR] Failed downloading PNG:", err);
      alert("Failed to export PNG. Please try again.");
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const dataUrl = await generatePngBlob();
      
      // jsPDF format is Landscape (l), units in points (pt), letter size is ~612x792 pt
      // For standard A4 landscape, size is 842x595 pt
      // Our container is 800x580, so let's match point scale.
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [800, 580]
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, 800, 580);
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("[ERROR] Failed downloading PDF:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    // Standard Print flow
    const printContent = canvasRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the certificate.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Certificate</title>
          <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #070f09;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            @media print {
              body {
                background: none;
              }
              #print-box {
                border: none !important;
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div id="print-box">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-[#0c1510] border-2 border-[#2a5c30] p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap justify-center gap-4">
      {/* Download PNG */}
      <button
        onClick={handleDownloadPng}
        disabled={downloadingPng || downloadingPdf}
        className="font-pixel text-[9px] bg-[#1e4a24] text-[#7ecb8a] hover:bg-[#7ecb8a] hover:text-[#182320] border border-[#2a5c30] hover:border-[#7ecb8a] px-6 py-2.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5 disabled:opacity-50"
      >
        {downloadingPng ? "EXPORTING..." : "💾 DOWNLOAD PNG"}
      </button>

      {/* Download PDF */}
      <button
        onClick={handleDownloadPdf}
        disabled={downloadingPng || downloadingPdf}
        className="font-pixel text-[9px] bg-[#2e1d0c] text-[#dda15e] hover:bg-[#dda15e] hover:text-[#182320] border border-[#dda15e] px-6 py-2.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5 disabled:opacity-50"
      >
        {downloadingPdf ? "EXPORTING..." : "📄 DOWNLOAD PDF"}
      </button>

      {/* Print */}
      <button
        onClick={handlePrint}
        disabled={downloadingPng || downloadingPdf}
        className="font-pixel text-[9px] bg-[#0c1510] text-[#8fc99a] hover:bg-[#8fc99a] hover:text-[#182320] border border-[#2a5c30] hover:border-[#8fc99a] px-6 py-2.5 transition-all cursor-pointer shadow-[2px_2px_0px_#000000] active:translate-y-0.5"
      >
        🖨️ PRINT CERTIFICATE
      </button>
    </div>
  );
};
