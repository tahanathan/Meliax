import re

with open('src/components/TripFormModal.tsx', 'r') as f:
    content = f.read()

# I need to add geocoding to TripFormModal before saving.
geocode_func = '''    const defaultImg = coverImage || STANDARD_COVER_PHOTOS[0].url;
    const finalTitle = title.trim() || `Tour inesquecível em ${destination.trim()}`;

    // Geocode to get coordinates
    let finalLat = lat;
    let finalLng = lng;
    
    try {
      const q = [destination.trim(), stateName.trim(), country.trim()].filter(Boolean).join(', ');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        finalLat = parseFloat(data[0].lat);
        finalLng = parseFloat(data[0].lon);
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }

    const newTrip: Trip = {'''

# Need to change handleSubmit to async
content = content.replace("const handleSubmit = (e: React.FormEvent) => {", "const handleSubmit = async (e: React.FormEvent) => {")
content = content.replace("const defaultImg = coverImage || STANDARD_COVER_PHOTOS[0].url;\n    const finalTitle = title.trim() || `Tour inesquecível em ${destination.trim()}`;\n\n    const newTrip: Trip = {", geocode_func)

with open('src/components/TripFormModal.tsx', 'w') as f:
    f.write(content)
