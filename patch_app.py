import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r'\{\/\* Weather Widget \*\/\}.*?</div>\s*</div>\s*</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)

