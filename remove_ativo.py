import re

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # We need to remove the HTML blocks that contain "Roteiro Ativo".
    # Usually they look like:
    # <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#a3e635]/20 text-[#a3e635] backdrop-blur-md font-bold text-xs border border-[#a3e635]/40 shadow-sm">
    #   <div className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" />
    #   Roteiro Ativo
    # </span>
    
    # Just regex remove anything matching <span[^>]*>[^<]*<div[^>]*animate-pulse[^>]*/>[^<]*Roteiro Ativo[^<]*</span>
    
    # Actually, simpler regex:
    pattern = r'<span[^>]*>\s*<div[^>]*animate-pulse[^>]*\s*/>\s*Roteiro Ativo\s*</span>'
    content = re.sub(pattern, '', content, flags=re.IGNORECASE)
    
    # Look for simpler ones too
    pattern2 = r'<span[^>]*Roteiro Ativo[^<]*</span>'
    content = re.sub(pattern2, '', content, flags=re.IGNORECASE)

    with open(filename, 'w') as f:
        f.write(content)

process_file('src/components/MapView.tsx')
process_file('src/components/TripDashboardBento.tsx')
process_file('src/components/TripDetailModal.tsx')

