import sys, json
sys.path.insert(0, '../model')
import m2a5_model as M
ed = M.load_engine_data('../../wtccr')
P = dict(M.SPEC_P, fwd_split=(2, 4), fwd_per_batch=6, h_qty_scale=3, h_l_per_pt=750)
batches = M.generate_batches(ed, P, ed['seed'])
for b in batches[:2] + batches[-1:]:
    print('batch', b['k'], 'day', b['day'], 'index', b['index_bp'], 'steps', b['steps'], 'dest', b['dest'])
    print('  reg', b['reg'])
    print('  table', b['table'])
    print('  spread', b['spread'], 'lots', b['lots'])
    print('  chosen', b['chosen'])
    print('  draws', [round(x, 6) for x in b['draws']])
    for o in b['offers']:
        print('   ', {k: o[k] for k in o if k in ('id','kind','city','dest','good','qty','maxq','unit','fee','dl','pay','prep','valid')})
# count of H per batch across 20 sims seeds
