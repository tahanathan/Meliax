import re
import os

files = [
  'src/components/MapView.tsx',
  'src/components/TripDashboardBento.tsx',
  'src/components/TripDetailModal.tsx'
]

for filename in files:
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    skip = False
    for i, line in enumerate(lines):
        if "Roteiro Ativo" in line:
            # We are inside the span block
            # Pop lines backwards until we hit <span
            while new_lines and "<span" not in new_lines[-1] and "Roteiro Ativo" not in new_lines[-1]:
                new_lines.pop()
            if new_lines and "<span" in new_lines[-1]:
                new_lines.pop() # remove <span line
            skip = True
            
        if skip:
            if "</span>" in line:
                skip = False
            continue
            
        new_lines.append(line)
        
    with open(filename, 'w') as f:
        f.writelines(new_lines)

