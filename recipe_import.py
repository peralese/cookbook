"""Local document extraction and conservative recipe section detection."""
import re
import subprocess
import tempfile
from pathlib import Path
from zipfile import ZipFile

IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp', '.webp'}
SUPPORTED_EXTENSIONS = IMAGE_EXTENSIONS | {'.docx', '.txt'}


def extract_text(upload):
    suffix = Path(upload.filename or '').suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError('Choose a PNG, JPEG, TIFF, BMP, WebP, DOCX, or UTF-8 text file. For older .doc files, save as .docx first.')
    if suffix == '.txt':
        try:
            return upload.read().decode('utf-8-sig')
        except UnicodeDecodeError as exc:
            raise ValueError('Please save the text file with UTF-8 encoding.') from exc
    if suffix == '.docx':
        from docx import Document
        # Bound decompressed size as well as uploaded size.
        with ZipFile(upload.stream) as archive:
            if sum(item.file_size for item in archive.infolist()) > 40 * 1024 * 1024:
                raise ValueError('This Word document is too large to extract.')
        upload.stream.seek(0)
        document = Document(upload.stream)
        from docx.oxml.ns import qn
        return '\n'.join(
            ''.join(t.text or '' for t in p.iter(qn('w:t')))
            for p in document.element.body.iter(qn('w:p')))
    with tempfile.TemporaryDirectory(prefix='recipe-import-') as folder:
        path = Path(folder) / ('scan' + suffix)
        upload.save(path)
        try:
            result = subprocess.run(['tesseract', str(path), 'stdout'], capture_output=True,
                                    text=True, timeout=60, check=False)
        except FileNotFoundError as exc:
            raise ValueError('Image extraction needs Tesseract installed on this computer. You can also paste the recipe text below.') from exc
        except subprocess.TimeoutExpired as exc:
            raise ValueError('Image extraction took too long. Try a smaller, clearer image.') from exc
        if result.returncode:
            raise ValueError('Could not read this image. Try a clear, upright photo or paste the text.')
        return result.stdout


# These cues organize text; they do not correct OCR or invent missing quantities.
ACTION = re.compile(
    r"^(?:(?:step\s+)?\d+[.)]\s*)?(?:preheat|mix|combine|stir|beat|whisk|"
    r"cream|fold|add|pour|bake|cook|heat|boil|simmer|fry|saute|sauté|roast|"
    r"grill|sprinkle|season|place|put|spread|arrange|cover|uncover|remove|"
    r"serve|chill|refrigerate|freeze|let|allow|drain|rinse|wash|peel|chop|"
    r"slice|cut|melt|bring|reduce|turn|transfer|knead|roll|cool|"
    r"the next day|reseal|unseal)\b", re.I)
AMOUNT = re.compile(r"^(?:[-•*]\s*)?(?:\d|[¼½¾⅓⅔⅛⅜⅝⅞])")
SEASONING = re.compile(
    r"^(?:(?:garlic|onion|celery)\s+(?:powder|salt)|salt|pepper|"
    r"salt and pepper|worcestershire sauce|cooking spray)(?:\s+to taste)?[.]?$", re.I)


def ingredient_cue(line):
    return bool((AMOUNT.match(line) and not re.match(r"^\d+[.)]\s", line)
                 and len(line.split()) <= 18) or SEASONING.match(line))


def parse_recipe_text(text):
    result = dict(title='', ingredients=[], instructions=[], remarks='', **{'yield': '', 'source': '', 'requires': ''})
    aliases = {'ingredients': 'ingredients', 'directions': 'instructions', 'instructions': 'instructions',
               'method': 'instructions', 'preparation': 'instructions', 'notes': 'remarks', 'remarks': 'remarks',
               'yield': 'yield', 'servings': 'yield', 'serves': 'yield', 'source': 'source', 'requires': 'requires'}
    pattern = re.compile(r'^(%s)\s*(?::\s*(.*))?$' % '|'.join(aliases), re.I)
    section = None
    explicit = False
    paragraph_start = True
    for line in text.splitlines():
        line = line.strip()
        if not line:
            paragraph_start = True
            continue
        match = pattern.match(line)
        if match:
            section = aliases[match[1].lower()]
            explicit = True
            paragraph_start = True
            line = (match[2] or '').strip()
            if not line:
                continue
        elif not result['title'] and section is None:
            result['title'] = line
            continue
        elif not explicit or section == 'ingredients':
            # Instruction verbs also detect an omitted Directions heading after
            # an explicit Ingredients heading. Other explicit sections win.
            if ACTION.match(line):
                section, explicit = 'instructions', False
            elif not explicit and ingredient_cue(line):
                section = 'ingredients'
            elif not explicit and section == 'ingredients':
                # Short ingredient names often have no quantity (e.g. Vanilla).
                # Leave prose in Notes rather than swallowing it as an ingredient.
                if len(line.split()) > 6 or re.search(r'[.!?]$', line):
                    section = None
            elif not explicit and section != 'instructions':
                section = None
        if section == 'instructions':
            if not explicit and result['instructions'] and not paragraph_start and not ACTION.match(line):
                # Join wrapped prose, including a word hyphenated by a clipping.
                previous = result['instructions'][-1]
                separator = '' if previous.endswith('-') else ' '
                result['instructions'][-1] = previous.rstrip('-') + separator + line
            else:
                result['instructions'].append(line)
        elif section == 'ingredients':
            result['ingredients'].append(line)
        else:
            key = section or 'remarks'
            result[key] = (result[key] + '\n' + line).strip()
        paragraph_start = False
    return result
