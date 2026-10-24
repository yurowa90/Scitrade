import json,sys,glob,os
O=sys.argv[1]; other=sys.argv[2]
ids=sorted({os.path.basename(f).rsplit('-b59',1)[0] for f in glob.glob(O+'/*-b59base.json')})
def strip(j):
    j=dict(j); [j.pop(k,None) for k in ('dist','dist_index_sha256')]; return j
for i in ids:
    fb=f'{O}/{i}-b59base.json'; fo=f'{O}/{i}-{other}.json'
    if not os.path.exists(fo): print(i,'(없음)'); continue
    a=strip(json.load(open(fb))); b=strip(json.load(open(fo)))
    ra,rb=a['runs'],b['runs']
    nd=sum(1 for x,y in zip(ra,rb) if x!=y)
    vals=sum(len(r.get('measurements',r.get('values',{})) or []) for r in ra) if isinstance(ra,list) else 0
    errs=sum(len(r.get('page_errors',[]) or [])+len(r.get('step_errors',[]) or []) for r in rb)
    print(f"{i:22s} runs {len(ra)}/{len(rb)} diffRuns {nd} ok {a['ok']}/{b['ok']} errs {errs}")
    if nd:
        for x,y in zip(ra,rb):
            if x!=y:
                print('   ', {k:(x.get(k),y.get(k)) for k in x if x.get(k)!=y.get(k)}); break
