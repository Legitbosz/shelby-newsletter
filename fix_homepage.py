with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("clamp(3.5rem, 9vw, 7rem)", "clamp(1.8rem, 4vw, 3rem)")
c = c.replace("marginBottom: '52px' }}>", "marginBottom: '52px', textAlign: 'center' }}>")

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done!')
