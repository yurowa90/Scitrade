# NASA Black Marble 2016 0.1° 회색(BlackMarble_2016_01deg_gray_geo.tif)을 동아시아 지도 논리 격자(546×615)로 줄이고 4단계 팔레트로 바꾼다.
import sys,io
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
im=Image.open(sys.argv[1]).convert('L')
x0=int((98+180)*10); x1=int((146+180)*10); y0=int((90-44)*10); y1=int((90+10)*10)
ea=im.crop((x0,y0,x1,y1)).resize((546,615),Image.BOX)
th=[12,28,55,100]; cols=[(110,80,25),(170,125,40),(225,175,70),(255,225,140)]
pal=[0,0,0]+[c for col in cols for c in col]
q=Image.new('P',ea.size); q.putpalette(pal+[0]*(768-len(pal)))
px=ea.load(); qp=q.load()
for y in range(ea.size[1]):
    for x in range(ea.size[0]):
        v=px[x,y]; qp[x,y]=sum(1 for t in th if v>=t)
q.save(sys.argv[2],'PNG',optimize=True,transparency=0)
