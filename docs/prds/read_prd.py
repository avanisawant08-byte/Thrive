import docx
import os

def read_docx(file_path):
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

prd_path = r'd:\WORK\SOCIAL-APP\app\social-impact-app\Shopkeeper_Verification_Portal_PRD_1.docx'
if os.path.exists(prd_path):
    print(read_docx(prd_path))
else:
    print(f"File not found: {prd_path}")
