#!/usr/bin/env python3
"""
Fix mojibake (encoding corruption) in JavaScript files.
Replaces corrupted UTF-8 sequences with correct ASCII/UTF-8 characters.
"""
import re
import os

def fix_mojibake():
    file_path = os.path.join(os.path.dirname(__file__), '..', 'Frontend', 'assets', 'js', 'main.js')
    file_path = os.path.normpath(file_path)
    
    print(f"Reading: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_length = len(content)
    fixes = 0
    
    # Replace corrupted strings with correct ones
    replacements = [
        # Malayalam text "Prarthi" was corrupted
        (r'à´ªàµ\$à´°à´¸à´‚à´—à´•àµ\$à´•àµà´±à´¿à´ªàµ\$à´ªàµ', 'Prarthi'),
        
        # Emoji and symbols - these got double-encoded
        (r'ðŸ›', '[TYPE]'),
        (r'ðŸ"', '[LOC]'),
        (r'ðŸ"', '[BY]'),  
        (r'ðŸ"', '[GLORY]'),
        (r'ð"', '[LINK]'),
        (r'ð"', ''),
        
        # Speech card kicker corrupted
        (r"à´ªàµ\$à´°à´¸à´‚à´—à´•àµ\$à´•àµà´±à´¿à´ªàµ\$à´ªàµ", 'Prarthi'),
    ]
    
    for pattern, replacement in replacements:
        matches = len(re.findall(pattern, content))
        if matches > 0:
            print(f"Found {matches} matches for pattern: {pattern[:30]}...")
            content = re.sub(pattern, replacement, content)
            fixes += matches
    
    # Alternative approach: replace specific known corrupted sequences
    # These are the actual bytes that appear in the file
    corruption_map = {
        'à´ªàµ$': 'P',
        'à´°': 'r',
        'à´¸': 'a',
        'à´‚': 't',
        'à´—': 'h',
        'à´•': 'i',
        'àµ$': '',
        'àµ': '',
        'à´±': '',
        'à´¿': '',
        'à´ª': '',
        'à´µ': '',
        
        # Emoji fixes  
        'ðŸ›\'': '[TYPE]',
        'ðŸ"Œ': '[LOC]',
        'ðŸ"¢': '[BY]',
        'ðŸ"—': '[LINK]',
        'ðŸ"–': '[BOOK]',
        'ðŸ\'&': '[GLORY]',
    }
    
    # Handle specific known corruptions in the file
    if 'à´ªàµ$à´°' in content:
        content = content.replace('à´ªàµ$à´°à´¸à´‚à´—à´•àµ$à´•àµà´±à´¿à´ªàµ$à´ªàµ', 'Prarthi')
        fixes += 1
        print("Fixed: Malayalam 'Prarthi' corruption")
    
    if 'ðŸ›\'' in content:
        content = content.replace('ðŸ›\'', '[TYPE]')
        fixes += 1
        print("Fixed: emoji 1")
        
    if 'ðŸ"Œ' in content:
        content = content.replace('ðŸ"Œ', '[LOC]')
        fixes += 1
        print("Fixed: emoji 2")
        
    if 'ðŸ"¢' in content:
        content = content.replace('ðŸ"¢', '[BY]')
        fixes += 1
        print("Fixed: emoji 3")
        
    if 'ðŸ"—' in content:
        content = content.replace('ðŸ"—', '[LINK]')
        fixes += 1
        print("Fixed: emoji 4")
        
    if 'ðŸ\'&' in content or 'ðŸ' in content:
        # Handle various emoji corruptions
        content = re.sub(r'ðŸ[^â€¦]', '[EMOJI]', content)
        fixes += 1
        print("Fixed: remaining emojis")
        
    if 'ð' in content:
        # Replace remaining garbled emoji sequences
        content = re.sub(r'ðŸ[a-zA-Z\'\"&]', '', content)
        fixes += 1
    
    if fixes > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\nApplied {fixes} fixes")
        print(f"File size: {original_length} -> {len(content)} bytes")
    else:
        print("No mojibake found to fix")

if __name__ == '__main__':
    fix_mojibake()
