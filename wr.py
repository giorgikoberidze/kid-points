import sys,base64,os
f=sys.argv[2]; d=base64.b64decode(sys.stdin.read().strip()); open(f,'wb').write(d); print('OK',f)
