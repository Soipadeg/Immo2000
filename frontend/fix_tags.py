import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. Fix mismatched tags: find <(tag) ... > ... </h1> and replace </h1> with </(tag)>
    # This is a bit tricky with regex. Let's look for tags that are definitely NOT h1
    # but are closed by </h1>.
    
    # Regex for finding opening tags that are not h1 but followed by </h1>
    # We'll look for <(p|h3|span|div|h2|h4|h5|h6|li)\b[^>]*>(?:(?!<\1).)*?</h1>
    # Actually, it's safer to find occurrences of </h1> and look backwards for the nearest opening tag.
    
    def replace_mismatched_h1(match):
        full_match = match.group(0)
        open_tag_name = match.group(1)
        # If open tag is not h1, change the closing tag
        if open_tag_name.lower() != 'h1':
            return full_match[:-5] + f'</{open_tag_name}>'
        return full_match

    # This regex looks for an open tag (not h1) and then some content that doesn't include other tags, then </h1>
    # It might be better to just find all </h1> and check what preceded them.
    
    parts = re.split(r'(</h1>)', content)
    new_parts = []
    fixes_count = 0
    
    for i in range(len(parts)):
        if parts[i] == '</h1>':
            # Look back in new_parts (concatenated) to find the nearest previous <TAG
            preceding_text = "".join(new_parts)
            # Find the last unclosed tag
            # Simple approach: find last <tag... but not </tag
            matches = list(re.finditer(r'<([a-zA-Z0-9]+)\b[^>]*>', preceding_text))
            if matches:
                last_tag = matches[-1].group(1)
                if last_tag.lower() != 'h1' and last_tag.lower() not in ['img', 'br', 'hr', 'input']:
                    # Mismatch found
                    new_parts.append(f'</{last_tag}>')
                    fixes_count += 1
                    continue
        new_parts.append(parts[i])
    
    content = "".join(new_parts)
    
    # 4. Fix / /> patterns
    content, slash_fixes = re.subn(r'/ />', r'/>', content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, fixes_count, slash_fixes
    return False, 0, 0

pages_dir = 'src/pages'
files_to_check = [f for f in os.listdir(pages_dir) if f.endswith('.jsx')]

report = []
for filename in files_to_check:
    filepath = os.path.join(pages_dir, filename)
    changed, mismatches, slashes = fix_file(filepath)
    if changed:
        report.append(f"{filename}: {mismatches} mismatches, {slashes} slash fixes")

for line in report:
    print(line)
