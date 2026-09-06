with open('src/components/TripDashboardBento.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "onClick={() => onOpenEditTrip" in line and "<button" in lines[i-1]:
        # Pop the <button> line
        new_lines.pop()
        skip = True
    elif "onDeleteTrip && (" in line:
        skip = True
    
    if skip:
        if "</button>" in line and ("Trash2" in lines[i-1] or "Edit3" in lines[i-2] or "Edit3" in lines[i-3] or "Trash2" in lines[i-2] or "Trash2" in lines[i-4]):
            skip = False
            continue
        if "}" in line and "onDeleteTrip && (" in lines[i-7]:
            skip = False
            continue
        continue
        
    new_lines.append(line)

with open('src/components/TripDashboardBento.tsx', 'w') as f:
    f.writelines(new_lines)

