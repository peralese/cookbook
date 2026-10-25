"""Local recipe import and review tool. Run on localhost, never public hosting."""
import hashlib
import json
import secrets
from pathlib import Path
from urllib.parse import urlencode

from flask import Flask, abort, flash, redirect, render_template, request, session
from werkzeug.utils import secure_filename
from itsdangerous import BadSignature, URLSafeSerializer
from recipe_import import extract_text, parse_recipe_text

ROOT = Path(__file__).resolve().parent
app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
app.config.update(CONTENT_FOLDER=ROOT / 'content', INPUT_FOLDER=ROOT / 'inputs', MAX_CONTENT_LENGTH=12 * 1024 * 1024)


def input_digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def matching_input(upload):
    """Bind cleanup to the exact uploaded file, never just its filename."""
    name = upload.filename
    if not name or Path(name).name != name or '/' in name or '\\' in name:
        return ''
    path = Path(app.config['INPUT_FOLDER']) / name
    if path.is_symlink() or not path.is_file():
        return ''
    digest = hashlib.sha256(upload.read()).hexdigest()
    upload.stream.seek(0)
    if input_digest(path) != digest:
        return ''
    return URLSafeSerializer(app.secret_key, salt='recipe-input').dumps([name, digest])


def clean_input(token):
    if not token:
        return
    try:
        name, digest = URLSafeSerializer(app.secret_key, salt='recipe-input').loads(token)
        if not name or Path(name).name != name or '/' in name or '\\' in name:
            raise ValueError('Invalid input name')
        path = Path(app.config['INPUT_FOLDER']) / name
        if not path.exists():
            return
        if path.is_symlink() or input_digest(path) != digest:
            flash('Recipe saved, but the source file changed and was kept in inputs.')
            return
        path.unlink()
    except (BadSignature, ValueError, TypeError, OSError):
        app.logger.warning('Could not clean up recipe input', exc_info=True)
        flash('Recipe saved, but its source could not be removed from inputs. Please remove it manually.')


def get_categories():
    return sorted(p.name for p in Path(app.config['CONTENT_FOLDER']).iterdir() if p.is_dir())


def category_path(category):
    if category not in get_categories():
        abort(400, 'Choose an existing category.')
    return Path(app.config['CONTENT_FOLDER']) / category


def recipe_path(category, name):
    if not name or Path(name).name != name or '/' in name or '\\' in name:
        abort(400, 'Invalid recipe name.')
    return category_path(category) / (name + '.json')


def normalize(data):
    result = {}
    for key, aliases in {'title': ['title', 'Title'], 'ingredients': ['ingredients', 'Ingredients'],
                         'instructions': ['instructions', 'Instructions', 'directions', 'Directions'],
                         'remarks': ['remarks', 'Remarks'], 'yield': ['yield', 'Yield'],
                         'source': ['source', 'Source'], 'tags': ['tags', 'Tags'], 'requires': ['requires']}.items():
        value = next((data[a] for a in aliases if a in data), '')
        if isinstance(value, list):
            value = (', ' if key == 'tags' else '\n').join(str(v.get('text', '') if isinstance(v, dict) else v) for v in value)
        result[key] = value
    return result


def page(data=None, error=None, raw='', status=200, input_token=None):
    categories = get_categories()
    category = request.values.get('category', categories[0] if categories else '')
    folder = category_path(category)
    session.setdefault('csrf', secrets.token_hex(32))
    return render_template('recipe_editor.html', categories=categories, category=category,
                           recipes=sorted(p.stem for p in folder.glob('*.json')),
                           selected=request.values.get('recipe', ''), data=normalize(data or {}),
                           raw=raw, error=error, input_token=input_token if input_token is not None else request.form.get('input_token', ''), saved=request.args.get('saved'), csrf=session['csrf']), status


@app.before_request
def check_csrf():
    if request.method == 'POST' and not secrets.compare_digest(request.form.get('csrf', ''), session.get('csrf', 'missing')):
        abort(400, 'Session expired. Reload the editor and try again.')


@app.errorhandler(413)
def too_large(error):
    return 'File too large. Maximum upload size is 12 MB. Go back and choose a smaller file.', 413


@app.get('/')
def index():
    name = request.args.get('recipe')
    data = {}
    if name:
        path = recipe_path(request.args.get('category', ''), name)
        if not path.is_file():
            abort(404)
        data = json.loads(path.read_text(encoding='utf-8'))
    return page(data)


@app.post('/import')
def import_recipe():
    raw = request.form.get('raw', '').strip()
    upload = request.files.get('document')
    input_token = ''
    try:
        if upload and upload.filename:
            input_token = matching_input(upload)
            raw = extract_text(upload).strip()
        if not raw:
            raise ValueError('No text found. Try a clearer photo or paste the recipe text.')
        data = parse_recipe_text(raw)
        return page(data, raw=raw, input_token=input_token)
    except Exception as exc:
        message = str(exc) if isinstance(exc, ValueError) else 'Could not read this document. Check the file or paste the text instead.'
        return page(error=message, raw=raw, status=400)


@app.post('/submit')
def submit():
    data = {key: request.form.get(key, '').strip() for key in ('title', 'requires', 'remarks', 'yield', 'source')}
    data['ingredients'] = [v.strip() for v in request.form.get('ingredients', '').splitlines() if v.strip()]
    data['instructions'] = [v.strip() for v in request.form.get('instructions', '').splitlines() if v.strip()]
    data['tags'] = list(dict.fromkeys(v.strip() for v in request.form.get('tags', '').split(',') if v.strip()))
    category = request.form.get('category', '')
    data['category'] = category
    filename = secure_filename(data['title']).removesuffix('.json')
    if not filename or not data['ingredients'] or not data['instructions']:
        return page(data, error='Enter a title, at least one ingredient, and at least one instruction.', raw=request.form.get('raw', ''), status=400)
    target = recipe_path(category, filename)
    original = request.form.get('recipe', '')
    old = recipe_path(category, original) if original else None
    if target.exists() and target != old:
        return page(data, error='A recipe with this filename already exists. Choose a different title.', status=409)
    if old:
        if not old.exists():
            abort(404)
        previous = json.loads(old.read_text(encoding='utf-8'))
        previous.update(data)
        data = previous
        # Older directions fields take precedence in some loaders.
        for key in ('directions', 'Directions', 'Instructions'):
            if key in data:
                data[key] = data['instructions']
    target.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    if old and old != target:
        old.unlink()
    clean_input(request.form.get('input_token', ''))
    return redirect('/?' + urlencode(dict(category=category, recipe=filename, saved='1')))


if __name__ == '__main__':
    app.run(host='127.0.0.1', debug=False)
