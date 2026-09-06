import re

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Apply glassmorphism to backdrop
    content = content.replace(
        'className="fixed inset-0 z-[200] bg-black/60 flex',
        'className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[15px] flex'
    )
    
    # Apply glassmorphism to modal container (TripFormModal)
    content = content.replace(
        'bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl',
        'bg-white/70 dark:bg-[#1a1b1e]/70 backdrop-blur-[15px]'
    )
    
    # Apply glassmorphism to modal container (CustomizationModal)
    content = content.replace(
        'bg-white dark:bg-slate-900',
        'bg-white/70 dark:bg-[#1a1b1e]/70 backdrop-blur-[15px]'
    )
    content = content.replace(
        'bg-white dark:bg-slate-950',
        'bg-white/70 dark:bg-[#1a1b1e]/70 backdrop-blur-[15px]'
    )

    # Downgrade font weights in forms and buttons
    content = re.sub(r'font-black', 'font-medium', content)
    content = re.sub(r'font-extrabold', 'font-medium', content)
    content = re.sub(r'font-bold', 'font-medium', content)

    with open(filename, 'w') as f:
        f.write(content)

process_file('src/components/TripFormModal.tsx')
process_file('src/components/CustomizationModal.tsx')
