declare module "pdfjs-dist/build/pdf.mjs" {
  export interface TextContentItem {
    str?: string;
  }

  export interface TextContent {
    items: TextContentItem[];
  }

  export interface PdfPage {
    getTextContent(): Promise<TextContent>;
  }

  export interface PdfDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPage>;
  }

  export function getDocument(options: {
    data: Uint8Array;
    disableWorker?: boolean;
  }): {
    promise: Promise<PdfDocument>;
  };
}
