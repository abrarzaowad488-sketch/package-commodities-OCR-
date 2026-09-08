export interface ExtractedField {
  value: string | null;
  confidence: number;
  evidence: string | null;
  is_compliant?: boolean;
  official_rule: string | null;
}

export interface AIExtractionResult {
  isMock?: boolean;
  extractedData: {
    product_name?: ExtractedField;
    generic_name?: ExtractedField;
    manufacturer_name?: ExtractedField;
    manufacturer_address?: ExtractedField;
    packer_name?: ExtractedField;
    importer_name?: ExtractedField;
    country_of_origin?: ExtractedField;
    net_quantity?: ExtractedField;
    mrp?: ExtractedField;
    manufacturing_date?: ExtractedField;
    best_before?: ExtractedField;
    use_by?: ExtractedField;
    consumer_care?: ExtractedField;
    unit_sale_price?: ExtractedField;
    dimensions?: ExtractedField;
    warnings?: ExtractedField;
  }
}

export type InspectionStatus = 'Compliant' | 'Needs Review' | 'Potential Issue';

export interface Finding {
  id: string;
  field: string;
  label: string;
  detectedValue: string | null;
  status: 'detected' | 'not_detected' | 'unclear' | 'not_applicable';
  requirement: string;
  officialRule?: string | null;
  evidence: string | null;
  inspectorRemark?: string;
  verificationStatus: 'pending' | 'confirmed' | 'edited' | 'dismissed';
}

export type InspectionInput = 
  | { type: 'image'; url: string }
  | { type: 'pdf'; name: string }
  | { type: 'text'; content: string };

export interface Inspection {
  id: string;
  date: string;
  productName: string;
  category: string;
  status: InspectionStatus;
  inputs: InspectionInput[];
  findings: Finding[];
  isMock?: boolean;
}

export const LEGAL_REQUIREMENTS: Record<string, string> = {
  product_name: "Common or generic name of the commodity must be declared.",
  generic_name: "Common or generic name of the commodity must be declared.",
  manufacturer_name: "Name of the manufacturer, packer or importer must be declared.",
  manufacturer_address: "Complete address of the manufacturer, packer or importer must be declared.",
  net_quantity: "Net quantity in standard units of weight, measure or number must be declared.",
  mrp: "Maximum Retail Price (MRP) inclusive of all taxes must be declared.",
  manufacturing_date: "Month and year of manufacture or pre-packing or import must be declared.",
  best_before: "Best before or use by date must be declared if applicable (e.g., food, cosmetics).",
  consumer_care: "Consumer care details including name, address, telephone number, and email must be declared.",
};
