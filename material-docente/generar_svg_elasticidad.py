import sys
D=[22,26,30,27,34,38,44,92,88,46,36,30,24]
N=len(D); W=360; TOP=90; BASE=330; K=2.2
def y(v): return BASE-v*K
def x(x0,i): return x0+i*W/(N-1)
def demand_poly(x0):
    pts=[(x(x0,i),y(v)) for i,v in enumerate(D)]
    return " ".join(f"{a:.1f},{b:.1f}" for a,b in [(x0,BASE)]+pts+[(x0+W,BASE)])
def demand_line(x0):
    return " ".join(f"{x(x0,i):.1f},{y(v):.1f}" for i,v in enumerate(D))
# elastic capacity: step per interval, follows previous point + margin (lag)
C=[max(D[i],D[i+1])+8 for i in range(N-1)]; C[6]=D[6]+8  # retraso al empezar el pico
def step_pts(x0):
    pts=[]
    for i in range(N-1):
        c=C[i]
        pts+= [(x(x0,i),y(c)),(x(x0,i+1),y(c))]
    return pts
def cap_poly(x0):
    p=step_pts(x0)
    return " ".join(f"{a:.1f},{b:.1f}" for a,b in [(x0,BASE)]+p+[(x0+W,BASE)])
def above_poly(x0):
    p=step_pts(x0)
    return " ".join(f"{a:.1f},{b:.1f}" for a,b in [(x0,TOP-20)]+p+[(x0+W,TOP-20)])
def cap_line(x0):
    return " ".join(f"{a:.1f},{b:.1f}" for a,b in step_pts(x0))
FIX=60
L,R=60,500
out=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 470" role="img" aria-labelledby="t d" font-family="Roboto, Arial, sans-serif">
  <title id="t">Capacidad fija frente a capacidad elástica</title>
  <desc id="d">Dos gráficas de una semana con un pico de demanda por una campaña de ventas. Con servidores propios la capacidad es fija: casi toda la semana sobra capacidad pagada y, en el pico, la demanda la supera y parte de los clientes no recibe servicio. En la nube la capacidad sube y baja siguiendo la demanda, con un pequeño retraso al empezar el pico.</desc>
  <style>
    .lbl {{ font-size: 14px; fill: #455a64; }}
    .tit {{ font-size: 18px; font-weight: 700; fill: #263238; }}
    .cover {{ fill: #ffffff; }}
    .cursor {{ stroke: #263238; stroke-width: 2; stroke-dasharray: 4 4; opacity: 0; }}
    @media (prefers-reduced-motion: no-preference) {{
      .cover {{ transform-box: fill-box; transform-origin: right center; animation: barrido 10s linear infinite; }}
      .cursor {{ animation: cursor 10s linear infinite; }}
    }}
    @keyframes barrido {{ 0% {{ transform: scaleX(1); }} 70% {{ transform: scaleX(0); }} 100% {{ transform: scaleX(0); }} }}
    @keyframes cursor {{ 0% {{ transform: translateX(0); opacity: 1; }} 70% {{ transform: translateX({W}px); opacity: 1; }} 71% {{ opacity: 0; }} 100% {{ opacity: 0; }} }}
  </style>
  <defs>
    <pattern id="rayas" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#eceff1"/><line x1="0" y1="0" x2="0" y2="8" stroke="#b0bec5" stroke-width="3"/>
    </pattern>
    <clipPath id="sobreFija"><rect x="{L}" y="{TOP-20}" width="{W}" height="{y(FIX)-(TOP-20):.1f}"/></clipPath>
    <clipPath id="sobreElastica"><polygon points="{above_poly(R)}"/></clipPath>
  </defs>
  <rect width="900" height="470" rx="12" fill="#ffffff"/>
  <text class="tit" x="{L+W/2}" y="36" text-anchor="middle">Servidores propios: capacidad fija</text>
  <text class="tit" x="{R+W/2}" y="36" text-anchor="middle">Nube: capacidad elástica</text>
'''
def panel(x0, cap_area, cap_ln, clip):
    s=f'''  <g>
    <polygon points="{cap_area}" fill="url(#rayas)"/>
    <polygon points="{demand_poly(x0)}" fill="#90caf9"/>
    <polygon points="{demand_poly(x0)}" fill="#e57373" clip-path="url(#{clip})"/>
    <polyline points="{demand_line(x0)}" fill="none" stroke="#1565c0" stroke-width="3"/>
    <polyline points="{cap_ln}" fill="none" stroke="#e65100" stroke-width="3"/>
    <rect class="cover" x="{x0+1}" y="{TOP-25}" width="{W}" height="{BASE-TOP+24}"/>
    <line class="cursor" x1="{x0}" y1="{TOP-20}" x2="{x0}" y2="{BASE}"/>
  </g>
  <line x1="{x0}" y1="{BASE}" x2="{x0+W}" y2="{BASE}" stroke="#263238" stroke-width="2"/>
  <line x1="{x0}" y1="{BASE}" x2="{x0}" y2="{TOP-25}" stroke="#263238" stroke-width="2"/>
  <text class="lbl" x="{x0+W/2}" y="{BASE+22}" text-anchor="middle">Lunes → Domingo (campaña el jueves)</text>
  <text class="lbl" x="{x0-12}" y="{(TOP+BASE)/2}" text-anchor="middle" transform="rotate(-90 {x0-12} {(TOP+BASE)/2})">Recursos</text>
'''
    return s
fix_area=f"{L},{BASE} {L},{y(FIX):.1f} {L+W},{y(FIX):.1f} {L+W},{BASE}"
fix_line=f"{L},{y(FIX):.1f} {L+W},{y(FIX):.1f}"
out+=panel(L,fix_area,fix_line,"sobreFija")
out+=panel(R,cap_poly(R),cap_line(R),"sobreElastica")
# legend
ly=400
items=[("url(#rayas)",None,"Capacidad pagada sin usar"),("#90caf9",None,"Demanda atendida"),("#e57373",None,"Demanda sin atender: web lenta o caída")]
lx=[60,330,530]
for (fill,_,t),xx in zip(items,lx):
    out+=f'  <rect x="{xx}" y="{ly-13}" width="18" height="18" fill="{fill}" stroke="#90a4ae"/>\n  <text class="lbl" x="{xx+26}" y="{ly+1}">{t}</text>\n'
ly2=436
out+=f'''  <line x1="60" y1="{ly2-5}" x2="78" y2="{ly2-5}" stroke="#1565c0" stroke-width="3"/><text class="lbl" x="86" y="{ly2}">Demanda (visitas, pedidos…)</text>
  <line x1="330" y1="{ly2-5}" x2="348" y2="{ly2-5}" stroke="#e65100" stroke-width="3"/><text class="lbl" x="356" y="{ly2}">Capacidad disponible</text>
</svg>
'''
open(sys.argv[1],"w").write(out)
