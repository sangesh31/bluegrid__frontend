import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Award } from 'lucide-react';

interface CertificateProps {
  technicianName: string;
  completedTasks: number;
  issueDate: string;
  onDownload?: () => void;
}

const Certificate: React.FC<CertificateProps> = ({ 
  technicianName, 
  completedTasks, 
  issueDate,
  onDownload 
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Use browser's print dialog which allows saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow && certificateRef.current) {
      const styles = `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        @page {
          size: A4 landscape;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 15px;
          font-family: 'Georgia', 'Times New Roman', serif;
          background: white;
        }
        .certificate-container {
          max-width: 950px;
          margin: 0 auto;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 25px;
          border: 6px double #1e3a8a;
          border-radius: 8px;
          position: relative;
        }
        .corner-decoration {
          position: absolute;
          width: 80px;
          height: 80px;
          border-style: solid;
          border-width: 6px;
        }
        .corner-top-left {
          top: 0;
          left: 0;
          border-color: #1e40af transparent transparent #1e40af;
        }
        .corner-top-right {
          top: 0;
          right: 0;
          border-color: #eab308 #eab308 transparent transparent;
        }
        .corner-bottom-left {
          bottom: 0;
          left: 0;
          border-color: transparent transparent #eab308 #eab308;
        }
        .corner-bottom-right {
          bottom: 0;
          right: 0;
          border-color: transparent #1e40af #1e40af transparent;
        }
        .inner-border {
          border: 3px solid #dbeafe;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 12px;
        }
        .certificate-title {
          font-size: 48px;
          letter-spacing: 8px;
          color: #1f2937;
          font-weight: bold;
          margin-bottom: 3px;
        }
        .certificate-subtitle {
          font-size: 22px;
          color: #6b7280;
          letter-spacing: 2px;
        }
        .decorative-line {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin: 10px 0;
        }
        .diamond {
          width: 12px;
          height: 12px;
          transform: rotate(45deg);
        }
        .diamond-gold {
          background: #eab308;
        }
        .diamond-blue {
          background: #1e40af;
          width: 16px;
          height: 16px;
        }
        .body-text {
          text-align: center;
          margin-bottom: 10px;
        }
        .presented-to {
          font-size: 14px;
          color: #374151;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .recipient-name {
          font-size: 36px;
          color: #1e3a8a;
          font-weight: bold;
          font-style: italic;
          margin: 10px 0;
          font-family: 'Brush Script MT', cursive;
        }
        .achievement-text {
          max-width: 700px;
          margin: 0 auto 10px;
          line-height: 1.5;
          color: #374151;
          font-size: 12px;
        }
        .achievement-text p {
          margin-bottom: 5px;
        }
        .highlight {
          font-weight: bold;
          color: #1e40af;
        }
        .badge-container {
          text-align: center;
          margin: 12px 0;
        }
        .badge {
          display: inline-block;
          width: 65px;
          height: 65px;
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          border-radius: 50%;
          border: 3px solid #eab308;
          position: relative;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .badge-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 9px;
          font-weight: bold;
          text-align: center;
        }
        .ribbon {
          width: 40px;
          height: 50px;
          background: #eab308;
          position: absolute;
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);
        }
        .date-section {
          text-align: center;
          margin: 12px 0;
        }
        .date-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 3px;
        }
        .date-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 15px;
          padding-top: 12px;
          border-top: 2px solid #d1d5db;
        }
        .signature-block {
          text-align: center;
          flex: 1;
        }
        .signature-image {
          height: 40px;
          margin-bottom: 3px;
        }
        .signature-line {
          border-top: 2px solid #1f2937;
          width: 150px;
          margin: 0 auto 3px;
        }
        .signature-title {
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
        }
        .signature-subtitle {
          font-size: 10px;
          color: #6b7280;
        }
        .center-badge {
          flex-shrink: 0;
          margin: 0 20px;
        }
        .center-seal {
          width: 50px;
          height: 50px;
          background: #dbeafe;
          border-radius: 50%;
          border: 2px solid #1e40af;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .footer {
          text-align: center;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
        }
        .certificate-id {
          font-size: 11px;
          color: #9ca3af;
          font-style: italic;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `;

      const content = `
        <div class="certificate-container">
          <div class="corner-decoration corner-top-left"></div>
          <div class="corner-decoration corner-top-right"></div>
          <div class="corner-decoration corner-bottom-left"></div>
          <div class="corner-decoration corner-bottom-right"></div>
          
          <div class="inner-border">
            <div class="header">
              <div style="margin-bottom: 6px;">
                <svg width="45" height="45" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="#1e40af" opacity="0.1"/>
                  <path d="M50 20 L60 45 L85 45 L65 60 L75 85 L50 70 L25 85 L35 60 L15 45 L40 45 Z" fill="#eab308"/>
                </svg>
              </div>
              <h1 class="certificate-title">CERTIFICATE</h1>
              <h2 class="certificate-subtitle">OF APPRECIATION</h2>
              <div class="decorative-line">
                <div class="diamond diamond-gold"></div>
                <div class="diamond diamond-blue"></div>
                <div class="diamond diamond-gold"></div>
              </div>
            </div>

            <div class="body-text">
              <p class="presented-to">This certificate is proudly presented to</p>
              <h3 class="recipient-name">${technicianName}</h3>
              
              <div class="achievement-text">
                <p>In recognition of outstanding dedication and exceptional service as a <span class="highlight">Maintenance Technician</span> with the BlueGrid Water Management System.</p>
                <p>Your commitment to maintaining our community's water infrastructure has been exemplary. Through the successful completion of <span class="highlight">${completedTasks} critical maintenance tasks</span>, you have demonstrated technical excellence, reliability, and a strong dedication to public service.</p>
                <p>Your contributions have directly improved water supply reliability and quality for our residents. This achievement reflects your professional skills and unwavering commitment to community welfare.</p>
              </div>

              <div class="badge-container">
                <div class="badge">
                  <div class="badge-text">
                    <div style="font-size: 18px;">★</div>
                    <div style="font-size: 8px;">BLUEGRID</div>
                    <div style="font-size: 7px;">AWARD</div>
                  </div>
                  <div class="ribbon"></div>
                </div>
              </div>

              <div class="date-section">
                <p class="date-label">Date of Issue</p>
                <p class="date-value">${issueDate}</p>
              </div>
            </div>

            <div class="signatures">
              <div class="signature-block">
                <div class="signature-image">
                  <svg width="180" height="60" viewBox="0 0 180 60">
                    <path d="M 10 45 Q 15 25, 25 35 Q 35 45, 45 30 Q 55 15, 65 35 Q 75 50, 85 35 Q 95 25, 105 40 L 115 35 Q 125 30, 135 38 L 145 35" 
                          stroke="#000080" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M 85 40 Q 90 35, 95 40" stroke="#000080" stroke-width="2" fill="none" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="signature-line"></div>
                <p class="signature-title">Panchayat Officer</p>
                <p class="signature-subtitle">BlueGrid Authority</p>
              </div>

              <div class="center-badge">
                <div class="center-seal">
                  <svg width="30" height="30" viewBox="0 0 100 100">
                    <path d="M50 20 L60 45 L85 45 L65 60 L75 85 L50 70 L25 85 L35 60 L15 45 L40 45 Z" fill="#1e40af"/>
                  </svg>
                </div>
              </div>

              <div class="signature-block">
                <div class="signature-image">
                  <svg width="180" height="60" viewBox="0 0 180 60">
                    <path d="M 20 40 Q 30 20, 45 35 T 75 30 Q 85 25, 95 35 Q 105 45, 115 30 Q 125 20, 135 35 L 145 32 Q 155 28, 165 35" 
                          stroke="#000080" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M 60 35 L 65 45 L 70 35" stroke="#000080" stroke-width="2" fill="none" stroke-linecap="round"/>
                    <circle cx="140" cy="35" r="3" fill="#000080"/>
                  </svg>
                </div>
                <div class="signature-line"></div>
                <p class="signature-title">System Administrator</p>
                <p class="signature-subtitle">BlueGrid Platform</p>
              </div>
            </div>

            <div class="footer">
              <p class="certificate-id">Certificate ID: BGRID-TECH-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
          </div>
        </div>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>BlueGrid Certificate - ${technicianName}</title>
            <meta charset="UTF-8">
            <style>${styles}</style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Certificate Container */}
      <div 
        ref={certificateRef}
        className="relative bg-white p-8 md:p-12 rounded-lg shadow-2xl border-8 border-double border-blue-900"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        {/* Decorative Corner Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-blue-600"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 border-yellow-500"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 border-yellow-500"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-blue-600"></div>

        {/* Inner Border */}
        <div className="border-4 border-blue-200 p-8 md:p-12 relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Award className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif tracking-widest text-gray-800 mb-2">
              CERTIFICATE
            </h1>
            <h2 className="text-2xl md:text-3xl font-serif text-gray-600 tracking-wide">
              OF APPRECIATION
            </h2>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-3 h-3 bg-yellow-500 rotate-45"></div>
              <div className="w-4 h-4 bg-blue-600 rotate-45"></div>
              <div className="w-3 h-3 bg-yellow-500 rotate-45"></div>
            </div>
          </div>

          {/* Body */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 mb-6 font-medium">
              This certificate is proudly presented to
            </p>
            
            <h3 className="text-4xl md:text-5xl font-bold text-blue-900 mb-8 font-serif italic">
              {technicianName}
            </h3>

            <div className="max-w-2xl mx-auto text-gray-700 leading-relaxed space-y-4 mb-8">
              <p className="text-base md:text-lg">
                In recognition of outstanding dedication and exceptional service as a 
                <span className="font-semibold text-blue-800"> Maintenance Technician </span> 
                with the BlueGrid Water Management System.
              </p>
              <p className="text-base md:text-lg">
                Your commitment to maintaining our community's water infrastructure has been exemplary. 
                Through the successful completion of 
                <span className="font-bold text-blue-900"> {completedTasks} critical maintenance tasks</span>, 
                you have demonstrated technical excellence, reliability, and a strong dedication to public service.
              </p>
              <p className="text-base md:text-lg">
                Your contributions have directly improved water supply reliability and quality for our residents. 
                This achievement reflects your professional skills and unwavering commitment to community welfare.
              </p>
            </div>

            {/* Badge */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center border-4 border-yellow-400 shadow-lg">
                  <div className="text-center">
                    <Award className="w-10 h-10 text-yellow-400 mx-auto mb-1" />
                    <p className="text-xs text-white font-bold">BLUEGRID</p>
                  </div>
                </div>
                {/* Ribbon */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-8 bg-yellow-400 clip-ribbon"></div>
                  <div className="w-16 h-8 bg-yellow-500 clip-ribbon-bottom"></div>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="mt-12 mb-8">
              <p className="text-sm text-gray-600 mb-1">Date of Issue</p>
              <p className="text-lg font-semibold text-gray-800">{issueDate}</p>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-12 pt-8 border-t-2 border-gray-300">
              <div className="text-center flex-1">
                {/* Signature Image */}
                <div className="h-16 mb-2 flex items-end justify-center">
                  <svg width="120" height="50" viewBox="0 0 120 50" className="signature-svg">
                    <path 
                      d="M 10 40 Q 20 10, 40 30 T 70 25 Q 80 20, 90 35 L 95 30" 
                      stroke="#1e40af" 
                      strokeWidth="2" 
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="border-t-2 border-gray-800 w-48 mx-auto mb-2"></div>
                <p className="text-sm font-semibold text-gray-800">Panchayat Officer</p>
                <p className="text-xs text-gray-600">BlueGrid Authority</p>
              </div>
              
              <div className="flex-shrink-0 mx-8">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-600">
                  <Award className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <div className="text-center flex-1">
                {/* Signature Image */}
                <div className="h-16 mb-2 flex items-end justify-center">
                  <svg width="120" height="50" viewBox="0 0 120 50" className="signature-svg">
                    <path 
                      d="M 15 35 Q 25 15, 45 35 Q 55 45, 65 25 Q 75 15, 85 30 L 100 25" 
                      stroke="#1e40af" 
                      strokeWidth="2" 
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="border-t-2 border-gray-800 w-48 mx-auto mb-2"></div>
                <p className="text-sm font-semibold text-gray-800">System Administrator</p>
                <p className="text-xs text-gray-600">BlueGrid Platform</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                Certificate ID: BGRID-TECH-{new Date().getFullYear()}-{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center mt-6 print:hidden">
        <Button 
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Certificate
        </Button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          ${certificateRef.current ? `
            #${certificateRef.current.id}, 
            #${certificateRef.current.id} * {
              visibility: visible;
            }
            #${certificateRef.current.id} {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          ` : ''}
        }
        .clip-ribbon {
          clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);
        }
        .clip-ribbon-bottom {
          clip-path: polygon(50% 0, 100% 30%, 100% 100%, 0 100%, 0 30%);
        }
      `}</style>
    </div>
  );
};

export default Certificate;
