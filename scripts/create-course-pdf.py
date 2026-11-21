"""Create a readable PDF from docs/kursdokumentation.md."""

from pathlib import Path
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "kursdokumentation.md"
OUTPUT = ROOT / "output" / "pdf" / "kursdokumentation-leo-spegel.pdf"


def register_fonts() -> tuple[str, str]:
    regular = Path("C:/Windows/Fonts/arial.ttf")
    bold = Path("C:/Windows/Fonts/arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("Arial", str(regular)))
        pdfmetrics.registerFont(TTFont("Arial-Bold", str(bold)))
        return "Arial", "Arial-Bold"
    return "Helvetica", "Helvetica-Bold"


def inline(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    code_parts: list[str] = []

    def save_code(match: re.Match[str]) -> str:
        code_parts.append(f'<font name="Courier">{escape(match.group(1))}</font>')
        return f"@@CODE{len(code_parts) - 1}@@"

    text = re.sub(r"`([^`]+)`", save_code, text)
    text = escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    for index, value in enumerate(code_parts):
        text = text.replace(f"@@CODE{index}@@", value)
    return text


def table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def is_separator(line: str) -> bool:
    return bool(re.match(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$", line))


def on_page(canvas, document) -> None:
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D9E2EC"))
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#52606D"))
    canvas.drawString(18 * mm, 9 * mm, "Kursprojekt - En rigg för en kodbas - Leo Spegel")
    canvas.drawRightString(192 * mm, 9 * mm, f"Sida {document.page}")
    canvas.restoreState()


def build_story(font: str, bold_font: str):
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CourseTitle",
            parent=styles["Title"],
            fontName=bold_font,
            fontSize=20,
            leading=25,
            textColor=colors.HexColor("#102A43"),
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CourseH2",
            parent=styles["Heading2"],
            fontName=bold_font,
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1F4E79"),
            spaceBefore=12,
            spaceAfter=6,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CourseH3",
            parent=styles["Heading3"],
            fontName=bold_font,
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#334E68"),
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CourseBody",
            parent=styles["BodyText"],
            fontName=font,
            fontSize=8.8,
            leading=12,
            textColor=colors.HexColor("#243B53"),
            alignment=TA_LEFT,
            spaceAfter=3,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CourseBullet",
            parent=styles["BodyText"],
            fontName=font,
            fontSize=8.8,
            leading=12,
            leftIndent=12,
            firstLineIndent=-8,
            textColor=colors.HexColor("#243B53"),
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CourseCode",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8.2,
            leading=11,
            backColor=colors.HexColor("#F0F4F8"),
            borderPadding=5,
            spaceAfter=6,
        )
    )

    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    story = []
    index = 0
    in_code = False
    while index < len(lines):
        line = lines[index]
        if line.startswith("```"):
            in_code = not in_code
            index += 1
            continue
        if in_code:
            story.append(Paragraph(inline(line) or " ", styles["CourseCode"]))
            index += 1
            continue
        if not line.strip():
            story.append(Spacer(1, 2))
            index += 1
            continue
        if line.startswith("|") and index + 1 < len(lines) and is_separator(lines[index + 1]):
            rows = [table_row(line)]
            index += 2
            while index < len(lines) and lines[index].startswith("|"):
                rows.append(table_row(lines[index]))
                index += 1
            column_count = max(len(row) for row in rows)
            rows = [row + [""] * (column_count - len(row)) for row in rows]
            table_data = [[Paragraph(inline(cell), styles["CourseBody"]) for cell in row] for row in rows]
            widths = [174 * mm / column_count] * column_count
            table = Table(table_data, colWidths=widths, repeatRows=1, hAlign="LEFT")
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D9EAF7")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#102A43")),
                        ("FONTNAME", (0, 0), (-1, 0), bold_font),
                        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#BCCCDC")),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            story.extend([table, Spacer(1, 7)])
            continue
        if line.startswith("# "):
            story.append(Paragraph(inline(line[2:]), styles["CourseTitle"]))
        elif line.startswith("## "):
            story.append(Paragraph(inline(line[3:]), styles["CourseH2"]))
        elif line.startswith("### "):
            story.append(Paragraph(inline(line[4:]), styles["CourseH3"]))
        elif re.match(r"^\s*[-*] ", line):
            story.append(Paragraph("• " + inline(re.sub(r"^\s*[-*] ", "", line)), styles["CourseBullet"]))
        elif re.match(r"^\s*\d+\. ", line):
            story.append(Paragraph(inline(line.strip()), styles["CourseBullet"]))
        else:
            combined = line
            while combined.count("**") % 2 == 1 and index + 1 < len(lines):
                index += 1
                combined += " " + lines[index].strip()
            story.append(Paragraph(inline(combined), styles["CourseBody"]))
        index += 1
    return story


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    font, bold_font = register_fonts()
    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=17 * mm,
        bottomMargin=20 * mm,
        title="Kursprojekt - En rigg för en kodbas",
        author="Leo Spegel",
    )
    document.build(build_story(font, bold_font), onFirstPage=on_page, onLaterPages=on_page)
    print(OUTPUT)


if __name__ == "__main__":
    main()
