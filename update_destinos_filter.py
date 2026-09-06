import re
with open('src/components/DestinosView.tsx', 'r') as f:
    content = f.read()

# Add imports
imports = "import { getContinent, getBrazilRegion, getDynamicCategories } from '../lib/regions';\n"
content = re.sub(r'(import { Trip } from \'../types\';)', r'\1\n' + imports, content)

# Update dynamicCategories
dynamic = """  const dynamicCategories = useMemo(() => {
    return getDynamicCategories(trips);
  }, [trips]);"""
content = re.sub(r'  const dynamicCategories = useMemo\(\(\) => \{\n    return Array\.from.*?slice\(0, 10\);\n  \}, \[trips\]\);', dynamic, content, flags=re.DOTALL)

# Update filteredTrips logic
logic = """        // Region/Category filter
        if (activeCategory) {
          const cat = activeCategory.toLowerCase();
          const continent = getContinent(dest.country).toLowerCase();
          const region = getBrazilRegion(dest.destination).toLowerCase();
          
          const isMatch = (
            continent === cat || 
            region === cat ||
            dest.country?.toLowerCase() === cat ||
            dest.destination?.toLowerCase() === cat ||
            dest.category?.toLowerCase().includes(cat) || 
            dest.title?.toLowerCase().includes(cat)
          );
          if (!isMatch) return false;
        }"""
content = re.sub(r'        // Region/Category filter\s*if \(activeCategory\) \{\s*const cat = activeCategory.toLowerCase\(\);\s*const matchC = dest.country\?\.toLowerCase\(\) === cat;\s*const matchD = dest.destination\?\.toLowerCase\(\) === cat;\s*if \(!matchC && !matchD\) return false;\s*\}', logic, content, flags=re.DOTALL)

with open('src/components/DestinosView.tsx', 'w') as f:
    f.write(content)
