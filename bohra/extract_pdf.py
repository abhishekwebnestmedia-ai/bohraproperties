#!/usr/bin/env python3
import pdfplumber
import sys

def extract_pdf(pdf_path):
    """Extract all content from PDF"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"\n{'='*100}")
            print(f"FILE: {pdf_path}")
            print(f"TOTAL PAGES: {len(pdf.pages)}")
            print(f"{'='*100}\n")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"\n{'─'*100}")
                print(f"PAGE {page_num}")
                print(f"{'─'*100}\n")
                
                # Extract text
                text = page.extract_text()
                if text:
                    print(text)
                    print("\n")
                
                # Extract tables if any
                tables = page.extract_tables()
                if tables:
                    print("\n[TABLES DETECTED]")
                    for table_idx, table in enumerate(tables, 1):
                        print(f"\nTable {table_idx}:")
                        for row in table:
                            print("|".join(str(cell) if cell else "" for cell in row))
                    print("\n")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    residential = r"D:\webnest2026\bohra\bohra\Residential (3).pdf"
    commercial = r"D:\webnest2026\bohra\bohra\Commercial (3).pdf"
    
    extract_pdf(residential)
    extract_pdf(commercial)
