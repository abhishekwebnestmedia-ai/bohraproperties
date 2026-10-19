#!/usr/bin/env python3
import pdfplumber

def detailed_analysis(pdf_path):
    """Detailed PDF analysis"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"\n{'='*100}")
            print(f"FILE: {pdf_path}")
            print(f"TOTAL PAGES: {len(pdf.pages)}")
            print(f"{'='*100}\n")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"\n>>> PAGE {page_num} ANALYSIS")
                print(f"Width: {page.width}, Height: {page.height}")
                print(f"Characters count: {len(page.chars) if page.chars else 0}")
                print(f"Rects count: {len(page.rects) if page.rects else 0}")
                print(f"Lines count: {len(page.lines) if page.lines else 0}")
                print(f"Curves count: {len(page.curves) if page.curves else 0}")
                
                # Try to extract all objects
                print(f"\nALL OBJECTS ON PAGE:")
                for obj_type in ['char', 'line', 'rect', 'curve']:
                    objs = getattr(page, f'{obj_type}s', None)
                    if objs and len(objs) > 0:
                        print(f"\n{obj_type.upper()}S ({len(objs)}):")
                        for i, obj in enumerate(objs[:10]):  # First 10
                            print(f"  {i+1}. {obj}")
                
                # Try OCR
                print("\n\n>>> TRYING OCR...")
                try:
                    text_ocr = page.extract_text(layout=True)
                    if text_ocr:
                        print("OCR TEXT:")
                        print(text_ocr[:2000])
                except:
                    print("OCR not available or failed")
                
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    residential = r"D:\webnest2026\bohra\bohra\Residential (3).pdf"
    commercial = r"D:\webnest2026\bohra\bohra\Commercial (3).pdf"
    
    detailed_analysis(residential)
    detailed_analysis(commercial)
