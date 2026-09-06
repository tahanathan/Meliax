import re

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Remove blur from backdrop, put back to bg-black/60
    content = content.replace(
        'className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[15px] flex',
        'className="fixed inset-0 z-[200] bg-black/60 flex'
    )
    content = content.replace(
        'className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[15px] flex',
        'className="fixed inset-0 z-50 bg-black/60 flex'
    )

    with open(filename, 'w') as f:
        f.write(content)

process_file('src/components/TripFormModal.tsx')
process_file('src/components/CustomizationModal.tsx')
