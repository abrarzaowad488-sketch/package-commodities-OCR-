import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs/promises';
import { PDFParse as pdfParse } from 'pdf-parse';

const DB_FILE = path.join(process.cwd(), 'database.json');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function getHistory() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveHistory(history: any[]) {
  await fs.writeFile(DB_FILE, JSON.stringify(history, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // Database API Routes
  app.get("/api/history", async (req, res) => {
    try {
      const history = await getHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const inspection = req.body;
      const history = await getHistory();
      // Check if it already exists, if so update it, otherwise add it
      const existingIndex = history.findIndex((i: any) => i.id === inspection.id);
      if (existingIndex >= 0) {
        history[existingIndex] = inspection;
      } else {
        history.unshift(inspection);
      }
      await saveHistory(history);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save inspection" });
    }
  });

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { inputs } = req.body;
      if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
         res.status(400).json({ error: "No inputs provided" });
         return;
      }

      const parts: any[] = [];
      for (const input of inputs) {
        if (input.type === 'text') {
          parts.push({ text: input.data });
        } else if (input.type === 'pdf') {
          try {
            const buffer = Buffer.from(input.data, 'base64');
            const pdfData = await pdfParse(buffer);
            parts.push({ text: `[REFERENCE PDF DOCUMENT CONTENT]\n\n${pdfData.text}\n\n[/REFERENCE PDF DOCUMENT CONTENT]` });
          } catch (err) {
            console.error('Failed to parse PDF with pdf-parse:', err);
            // Fallback to sending native PDF
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: input.data
              }
            });
          }
        } else {
          const mimeType = input.mimeType || "image/jpeg";
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: input.data
            }
          });
        }
      }

      parts.push({
        text: `Analyze the provided packaging images, documents, or text of a commodity. Extract the following Legal Metrology mandatory declarations. 

CRITICAL INSTRUCTION: DO NOT search the web. You MUST strictly use the provided document context (the uploaded Legal Metrology Rules PDF) to analyze the package compliance. 
You must match the extracted packaged commodities data strictly against the rules listed in the provided PDF.

For each field you extract:
1. Extract the 'value' if it is clearly visible. If NOT visible, you MUST return null. Do NOT guess.
2. Provide a 'confidence' score (0.0 to 1.0).
3. Provide an 'evidence' string (e.g., 'MRP ₹420', 'Net Wt. 500g', 'Volume: 1 Litre'). Be sure to capture weights (g, kg) and volumes (ml, Liters) accurately.
4. Evaluate 'is_compliant' (boolean): If the extracted value matches the rules required in the provided PDF for that specific commodity/field, return true. If it violates the rule or is missing when required, return false.
5. Provide the 'official_rule': The specific text or rule number from the provided PDF that mandates this.

Fields to extract:
product_name
generic_name
manufacturer_name
manufacturer_address
packer_name
importer_name
country_of_origin
net_quantity (ensure you capture liters/ml or kg/g properly)
mrp (Maximum Retail Price)
manufacturing_date
best_before (Expiry date)
use_by
consumer_care
unit_sale_price
dimensions
warnings`
      });

      const fieldSchema = { 
        type: Type.OBJECT, 
        properties: { 
          value: { type: Type.STRING, nullable: true }, 
          confidence: { type: Type.NUMBER }, 
          evidence: { type: Type.STRING, nullable: true },
          is_compliant: { type: Type.BOOLEAN, description: "True if the extracted value complies with the provided PDF rules, false otherwise." },
          official_rule: { type: Type.STRING, nullable: true, description: "The specific rule from the provided PDF." }
        } 
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { role: "user", parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedData: {
                type: Type.OBJECT,
                properties: {
                  product_name: fieldSchema,
                  generic_name: fieldSchema,
                  manufacturer_name: fieldSchema,
                  manufacturer_address: fieldSchema,
                  packer_name: fieldSchema,
                  importer_name: fieldSchema,
                  country_of_origin: fieldSchema,
                  net_quantity: fieldSchema,
                  mrp: fieldSchema,
                  manufacturing_date: fieldSchema,
                  best_before: fieldSchema,
                  use_by: fieldSchema,
                  consumer_care: fieldSchema,
                  unit_sale_price: fieldSchema,
                  dimensions: fieldSchema,
                  warnings: fieldSchema,
                }
              }
            }
          }
        }
      });

      let jsonStr = response.text?.trim() || "{}";
      const data = JSON.parse(jsonStr);
      res.json(data);
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      
      const errStr = String(error) + " " + String(error.message) + " " + (error.status || "");
      
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('Quota') || errStr.includes('403')) {
        console.log("Rate limit or Quota exceeded, returning mock data fallback.");
        const mockResponse = {
          extractedData: {
            product_name: { value: "Organic Honey", confidence: 0.95, evidence: "Organic Honey", is_compliant: true, official_rule: "Rule 6(1)(b) of Legal Metrology Rules" },
            generic_name: { value: "Honey", confidence: 0.9, evidence: "Honey", is_compliant: true, official_rule: "Rule 6(1)(b)" },
            manufacturer_name: { value: "Nature's Best Ltd.", confidence: 0.9, evidence: "Nature's Best Ltd.", is_compliant: true, official_rule: "Rule 6(1)(a)" },
            manufacturer_address: { value: "123 Green Valley, Kerala", confidence: 0.85, evidence: "123 Green Valley, Kerala", is_compliant: true, official_rule: "Rule 6(1)(a)" },
            packer_name: { value: null, confidence: 0.9, evidence: null, is_compliant: false, official_rule: "Rule 6(1)(a)" },
            importer_name: { value: null, confidence: 0.9, evidence: null, is_compliant: false, official_rule: "Rule 6(1)(a)" },
            country_of_origin: { value: "India", confidence: 0.99, evidence: "Product of India", is_compliant: true, official_rule: "Rule 6(1)(ea)" },
            net_quantity: { value: "500g", confidence: 0.95, evidence: "Net Wt. 500g", is_compliant: true, official_rule: "Rule 6(1)(c)" },
            mrp: { value: "₹250", confidence: 0.98, evidence: "MRP ₹250 (Incl of all taxes)", is_compliant: true, official_rule: "Rule 6(1)(e)" },
            manufacturing_date: { value: "10/2023", confidence: 0.9, evidence: "Mfg: 10/2023", is_compliant: true, official_rule: "Rule 6(1)(d)" },
            best_before: { value: "12 Months from manufacture", confidence: 0.85, evidence: "Best before 12 months", is_compliant: true, official_rule: "Rule 6(1)(d)" },
            use_by: { value: null, confidence: 0.9, evidence: null, is_compliant: false, official_rule: "Rule 6(1)(d)" },
            consumer_care: { value: "care@naturesbest.in, 1800-123-4567", confidence: 0.95, evidence: "Customer Care: 1800-123-4567", is_compliant: true, official_rule: "Rule 6(1)(m)" },
            unit_sale_price: { value: "₹0.50/g", confidence: 0.8, evidence: "USP: ₹0.50 per g", is_compliant: true, official_rule: "Rule 6(1)(e)" },
            dimensions: { value: null, confidence: 0.9, evidence: null, is_compliant: false, official_rule: "Rule 6(1)(c)" },
            warnings: { value: "Store in a cool dry place", confidence: 0.9, evidence: "Store in a cool dry place", is_compliant: true, official_rule: "Rule 6(1)(f)" }
          },
          isMock: true
        };
        res.json(mockResponse);
        return;
      }

      let errorMessage = error.message || "Failed to analyze inputs.";
      res.status(500).json({ error: errorMessage });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support Express v4 syntax
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
