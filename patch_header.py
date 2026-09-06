import re

with open('src/components/Header.tsx', 'r') as f:
    content = f.read()

pattern = r'\{\/\* Weather Widget Pill.*?\</div>\s*</div>\s*</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('src/components/Header.tsx', 'w') as f:
    f.write(content)

