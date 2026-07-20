import { useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "./ImportShipment.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type ParsedPdfResult = {
  fileName: string;
  fullText: string;
};

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n");
}

export default function ImportShipment() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualSerial, setManualSerial] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedPdfResult | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState("");

  const fileName = useMemo(() => {
    if (!selectedFile) return "No file selected";
    return selectedFile.name;
  }, [selectedFile]);

  const handlePreview = async () => {
    setError("");
    setParsedResult(null);

    if (!selectedFile) {
      setError("Please select a PDF invoice first.");
      return;
    }

    try {
      setIsReading(true);
      const fullText = await extractPdfText(selectedFile);
      setParsedResult({
        fileName: selectedFile.name,
        fullText,
      });
    } catch {
      setError("Could not read the PDF. Please try another file.");
    } finally {
      setIsReading(false);
    }
  };

  return (
    <main className="import-page">
      <header className="page-header">
        <p className="page-tag">Inventory</p>
        <h1>Import Shipment</h1>
        <p>
          Upload a PDF invoice to extract the model name and serial number.
        </p>
      </header>

      <section className="import-card">
        <div className="form-group">
          <label htmlFor="invoice">Invoice PDF</label>
          <input
            id="invoice"
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <p className="helper-text">{fileName}</p>
        </div>

        <div className="form-group">
          <label htmlFor="manual-serial">Manual Serial Number</label>
          <input
            id="manual-serial"
            type="text"
            placeholder="Optional fallback when invoice is unavailable"
            value={manualSerial}
            onChange={(e) => setManualSerial(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="manual-model">Manual Model</label>
          <input
            id="manual-model"
            type="text"
            placeholder="Enter product model manually"
            value={manualModel}
            onChange={(e) => setManualModel(e.target.value)}
          />
        </div>

        <div className="button-row">
          <button type="button" onClick={handlePreview} disabled={isReading}>
            {isReading ? "Reading PDF..." : "Preview Import"}
          </button>
          <button type="button" className="secondary">
            Clear
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        {parsedResult ? (
          <section className="preview">
            <h2>Extracted PDF Text</h2>
            <p className="helper-text">{parsedResult.fileName}</p>
            <pre>{parsedResult.fullText || "No text found in PDF."}</pre>
          </section>
        ) : null}
      </section>
    </main>
  );
}
