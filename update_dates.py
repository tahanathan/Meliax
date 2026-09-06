import re
import glob

def process_file(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    if 'formatDate' not in content:
        # Add import
        if 'import' in content:
            # try finding last import
            parts = content.split('\n\n')
            for i, p in enumerate(parts):
                if 'import' in p:
                    pass
        content = "import { formatDate } from '../utils';\n" + content if not filename.endswith('App.tsx') else "import { formatDate } from './utils';\n" + content
    
    # CheckInsTimeline.tsx:
    content = re.sub(r"new Date\(ck\.timestamp\)\.toLocaleDateString\('pt-BR', {[^}]*}\)", r"formatDate(ck.timestamp)", content)
    # MapView.tsx:
    content = re.sub(r"new Date\(selectedTrip\.startDate\)\.toLocaleDateString\('pt-BR', {[^}]*}\)", r"formatDate(selectedTrip.startDate)", content)
    content = re.sub(r"new Date\(selectedTrip\.endDate\)\.toLocaleDateString\('pt-BR', {[^}]*}\)", r"formatDate(selectedTrip.endDate)", content)
    # TripDashboardBento.tsx
    content = re.sub(r"new Date\(currentTrip\.startDate\)\.toLocaleDateString\('pt-BR', {[^}]*}\)", r"formatDate(currentTrip.startDate)", content)
    content = re.sub(r"new Date\(currentTrip\.endDate\)\.toLocaleDateString\('pt-BR', {[^}]*}\)", r"formatDate(currentTrip.endDate)", content)
    # DestinosView.tsx
    content = re.sub(r"new Date\(dest\.startDate\)\.toLocaleDateString\('pt-BR'\)", r"formatDate(dest.startDate)", content)
    # App.tsx
    content = re.sub(r"new Date\(image1\.startDate\)\.toLocaleDateString\(\)", r"formatDate(image1.startDate)", content)
    
    # TripDetailModal.tsx
    content = re.sub(r"new Date\(trip\.startDate\)\.toLocaleDateString\('pt-BR'\)", r"formatDate(trip.startDate)", content)
    content = re.sub(r"new Date\(trip\.endDate\)\.toLocaleDateString\('pt-BR'\)", r"formatDate(trip.endDate)", content)

    with open(filename, 'w') as f:
        f.write(content)

process_file('src/components/CheckInsTimeline.tsx')
process_file('src/components/MapView.tsx')
process_file('src/components/TripDashboardBento.tsx')
process_file('src/components/DestinosView.tsx')
process_file('src/components/TripDetailModal.tsx')
process_file('src/App.tsx')
