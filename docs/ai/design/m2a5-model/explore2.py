import statistics
from explore import run_cfg, report, VARS
from market import DEFAULT_TEMPLATES
H6 = [
    dict(id='H1', good='ELECTRONICS', qty=200, dest='HAIPHONG', fee=50000, dl=14, pay=16, cls='HANDLING'),
    dict(id='H2', good='COSMETICS', qty=300, dest='SHANGHAI', fee=48000, dl=14, pay=18, cls='HANDLING'),
    dict(id='H3', good='APPAREL', qty=2000, dest='HAIPHONG', fee=52000, dl=14, pay=16, cls='HANDLING'),
    dict(id='H4', good='ELECTRONICS', qty=300, dest='SHANGHAI', fee=60000, dl=14, pay=18, cls='HANDLING'),
    dict(id='H5', good='AUTO_PARTS', qty=150, dest='SHANGHAI', fee=48000, dl=14, pay=18, cls='HANDLING'),
    dict(id='H6', good='APPAREL', qty=3000, dest='HAIPHONG', fee=64000, dl=14, pay=16, cls='HANDLING'),
]
VARS.update({'H04@36': dict(hires=[('EMP04', 36)]), 'E+H04@21': dict(expand_day=7, hires=[('EMP04', 21)])})
names = ['V0', 'H06', 'H04', 'H04@21', 'H04@36', 'E', 'E+H04', 'E+H04@21', 'ES', 'ES+H04']
if __name__ == "__main__":
  for label, p, m in [
      ('D 6F+6H, 5건, H 1pt/m³', dict(), dict(templates=DEFAULT_TEMPLATES + H6)),
      ('E 6F+6H, 6건, H 1pt/m³', dict(), dict(templates=DEFAULT_TEMPLATES + H6, forwarding_per_batch=6)),
      ('F 6F+6H, 8건, H 1pt/m³', dict(), dict(templates=DEFAULT_TEMPLATES + H6, forwarding_per_batch=8)),
  ]:
      res = run_cfg(p, m, names)
      report(label, res)
      import explore
      for a, b in [('V0','H04@36'), ('E','E+H04@21')]:
          print('   ', a, '→', b, explore.cmp(res, a, b))
