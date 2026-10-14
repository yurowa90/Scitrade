import struct,sys,json
d=sys.argv[1]
shp=open(d+'/ne_10m_ports.shp','rb').read(); dbf=open(d+'/ne_10m_ports.dbf','rb').read()
# dbf
n=struct.unpack('<I',dbf[4:8])[0]; hl,rl=struct.unpack('<HH',dbf[8:12]); fields=[]; i=32
while dbf[i]!=0x0D:
    name=dbf[i:i+11].split(b'\0')[0].decode(); ln=dbf[i+16]; fields.append((name,ln)); i+=32
recs=[]
for r in range(n):
    o=hl+r*rl+1; rec={}
    for name,ln in fields: rec[name]=dbf[o:o+ln].decode('latin1').strip(); o+=ln
    recs.append(rec)
# shp points
pts=[]; o=100
while o<len(shp):
    clen=struct.unpack('>I',shp[o+4:o+8])[0]*2; st=struct.unpack('<i',shp[o+8:o+12])[0]
    x,y=struct.unpack('<dd',shp[o+12:o+28]); pts.append((x,y)); o+=8+clen
b=dict(lon_min=98,lon_max=146,lat_min=-10,lat_max=44)
out=[]
for rec,(x,y) in zip(recs,pts):
    if b['lon_min']<=x<=b['lon_max'] and b['lat_min']<=y<=b['lat_max']:
        out.append({'name':rec.get('name'),'scalerank':rec.get('scalerank'),'lon':round(x,3),'lat':round(y,3)})
print(json.dumps({'fields':[f for f,_ in fields],'total':n,'inEastAsia':len(out),'sample':out[:5]},ensure_ascii=False))
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
