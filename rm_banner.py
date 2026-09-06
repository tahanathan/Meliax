import re

with open('src/components/TripDashboardBento.tsx', 'r') as f:
    content = f.read()

pattern = r'\{\/\* Security Banner \*\/\}.*?</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('src/components/TripDashboardBento.tsx', 'w') as f:
    f.write(content)
