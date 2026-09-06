import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'  const \[activeCategory, setActiveCategory\] = useState\(\'\'\);\n', '', content)
content = re.sub(r'  const dynamicCategories = getDynamicCategories\(activeTrips\);\n', '', content)
content = re.sub(r'  const filteredTrips = activeTrips.filter\(t => \{.*?\}\);\n', '  const filteredTrips = activeTrips;\n', content, flags=re.DOTALL)
content = re.sub(r'  const hasNoFilteredTrips = activeTrips.length === 0 \|\| \(activeCategory !== "" && filteredTrips.length === 0\);', '  const hasNoFilteredTrips = activeTrips.length === 0;', content)
content = re.sub(r'  \}, \[activeCategory, trips\.length\]\);', '  }, [trips.length]);', content)
content = re.sub(r'  \}, \[recentTrips\.length, activeCategory\]\);', '  }, [recentTrips.length]);', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
