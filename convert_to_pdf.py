#!/usr/bin/env python3
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.pdfgen import canvas
import re

# Read markdown file
with open('/app/CLIENT_MANUAL_BOOK.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

# Create PDF
pdf_file = '/app/frontend/public/CLIENT_MANUAL_BOOK.pdf'
doc = SimpleDocTemplate(pdf_file, pagesize=A4, 
                       topMargin=0.75*inch, bottomMargin=0.75*inch,
                       leftMargin=0.75*inch, rightMargin=0.75*inch)

# Styles
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name='CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=HexColor('#667eea'),
    spaceAfter=20,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
))

styles.add(ParagraphStyle(
    name='CustomHeading1',
    parent=styles['Heading1'],
    fontSize=18,
    textColor=HexColor('#667eea'),
    spaceAfter=12,
    spaceBefore=12,
    fontName='Helvetica-Bold'
))

styles.add(ParagraphStyle(
    name='CustomHeading2',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=HexColor('#764ba2'),
    spaceAfter=10,
    spaceBefore=10,
    fontName='Helvetica-Bold'
))

styles.add(ParagraphStyle(
    name='CustomHeading3',
    parent=styles['Heading3'],
    fontSize=12,
    textColor=HexColor('#555555'),
    spaceAfter=8,
    spaceBefore=8,
    fontName='Helvetica-Bold'
))

styles.add(ParagraphStyle(
    name='CustomBody',
    parent=styles['BodyText'],
    fontSize=10,
    leading=14,
    alignment=TA_JUSTIFY,
    spaceAfter=10
))

# Story (content)
story = []

# Cover page
story.append(Spacer(1, 2*inch))
story.append(Paragraph("📖 Manual Book", styles['CustomTitle']))
story.append(Spacer(1, 0.2*inch))
story.append(Paragraph("Rimuru Client Platform", styles['CustomHeading1']))
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph("Platform Manajemen Akun Iklan Digital", styles['CustomBody']))
story.append(Spacer(1, 1*inch))
story.append(Paragraph("Version 1.0 - Januari 2025", styles['CustomBody']))
story.append(PageBreak())

# Parse markdown content
lines = md_content.split('\n')
i = 0
while i < len(lines):
    line = lines[i].strip()
    
    if not line or line == '---':
        i += 1
        continue
    
    # H1
    if line.startswith('# '):
        text = line[2:].strip()
        story.append(Paragraph(text, styles['CustomTitle']))
        story.append(Spacer(1, 0.2*inch))
    
    # H2
    elif line.startswith('## '):
        text = line[3:].strip()
        story.append(Paragraph(text, styles['CustomHeading1']))
        story.append(Spacer(1, 0.1*inch))
    
    # H3
    elif line.startswith('### '):
        text = line[4:].strip()
        story.append(Paragraph(text, styles['CustomHeading2']))
        story.append(Spacer(1, 0.08*inch))
    
    # H4
    elif line.startswith('#### '):
        text = line[5:].strip()
        story.append(Paragraph(text, styles['CustomHeading3']))
        story.append(Spacer(1, 0.06*inch))
    
    # Bullet list
    elif line.startswith('- ') or line.startswith('* '):
        text = line[2:].strip()
        # Convert markdown bold to reportlab bold
        text = text.replace('**', '<b>').replace('**', '</b>')
        story.append(Paragraph(f"• {text}", styles['CustomBody']))
    
    # Numbered list
    elif re.match(r'^\d+\.', line):
        text = re.sub(r'^\d+\.\s*', '', line)
        text = text.replace('**', '<b>').replace('**', '</b>')
        story.append(Paragraph(f"{line.split('.')[0]}. {text}", styles['CustomBody']))
    
    # Regular paragraph
    else:
        if line:
            # Convert markdown bold to reportlab bold (proper pairing)
            text = line
            # Replace ** pairs with <b></b>
            while '**' in text:
                text = text.replace('**', '<b>', 1)
                if '**' in text:
                    text = text.replace('**', '</b>', 1)
            # Convert markdown code to monospace
            text = re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', text)
            # Escape any remaining problematic characters
            text = text.replace('<', '&lt;').replace('>', '&gt;')
            # Restore our HTML tags
            text = text.replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
            text = text.replace('&lt;font name="Courier"&gt;', '<font name="Courier">').replace('&lt;/font&gt;', '</font>')
            story.append(Paragraph(text, styles['CustomBody']))
    
    i += 1

# Footer
story.append(Spacer(1, 0.5*inch))
story.append(Paragraph("© 2025 Rimuru - Platform Manajemen Akun Iklan Digital", 
                      ParagraphStyle(name='Footer', parent=styles['CustomBody'], 
                                   alignment=TA_CENTER, fontSize=9, 
                                   textColor=HexColor('#666666'))))

# Build PDF
print("Converting markdown to PDF...")
doc.build(story)
print("✅ PDF created successfully!")
print("📄 Location: /app/frontend/public/CLIENT_MANUAL_BOOK.pdf")
print("🌐 Access via: http://your-domain.com/CLIENT_MANUAL_BOOK.pdf")
