import sys,base64,os
d=base64.b64decode(sys.argv[1])
p=sys.argv[2]
os.makedirs(os.path.dirname(p),exist_ok=True)
open(p,'wb').write(d)
print('Wrote',p)
