(() => {
  const root = document.getElementById("mensuration-mobile");
  const $ = s => root.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";

  const state = {
    mode: "2d",
    shape: "rectangle",
    unit: "cm",
    piMode: "exact",
    values: {},
    challenge: null
  };

  const PI = () => state.piMode === "22/7" ? 22/7 : state.piMode === "3.14" ? 3.14 : Math.PI;
  const f = n => Number(Number(n).toFixed(2)).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const U = p => p === 1 ? state.unit : p === 2 ? state.unit + "²" : state.unit + "³";
  const R = (name, value, power, formula, working, primary=false) => ({ name, value, power, formula, working, primary });

  const shapes = {
    rectangle: {
      name: "Rectangle", mode: "2d", icon: "▭",
      fields: [["l","Length","l",1,30,12],["b","Breadth","b",1,30,7]],
      results: v => [
        R("Area", v.l*v.b, 2, "A = lb", `${f(v.l)} × ${f(v.b)} = ${f(v.l*v.b)}`, true),
        R("Perimeter", 2*(v.l+v.b), 1, "P = 2(l+b)", `2(${f(v.l)} + ${f(v.b)}) = ${f(2*(v.l+v.b))}`)
      ],
      tip: "Predict what happens to area if only the length doubles.",
      remember: "Area uses square units.",
      draw: drawRectangle
    },

    triangle: {
      name: "Triangle", mode: "2d", icon: "△",
      fields: [["b","Base","b",1,30,12],["h","Height","h",1,25,8]],
      results: v => [
        R("Area", .5*v.b*v.h, 2, "A = ½bh", `½ × ${f(v.b)} × ${f(v.h)} = ${f(.5*v.b*v.h)}`, true)
      ],
      tip: "Compare it with a rectangle of the same base and height.",
      remember: "Triangle area = half of base × height.",
      draw: drawTriangle
    },

    circle: {
      name: "Circle", mode: "2d", icon: "○",
      fields: [["r","Radius","r",1,15,6]],
      results: v => [
        R("Area", PI()*v.r*v.r, 2, "A = πr²", `π × ${f(v.r)}² = ${f(PI()*v.r*v.r)}`, true),
        R("Circumference", 2*PI()*v.r, 1, "C = 2πr", `2π × ${f(v.r)} = ${f(2*PI()*v.r)}`)
      ],
      tip: "Double radius and compare circumference and area.",
      remember: "Diameter = 2r.",
      draw: drawCircle
    },

    cuboid: {
      name: "Cuboid", mode: "3d", icon: "▰",
      fields: [["l","Length","l",1,30,12],["b","Breadth","b",1,25,7],["h","Height","h",1,25,6]],
      results: v => [
        R("Volume", v.l*v.b*v.h, 3, "V = lbh", `${f(v.l)} × ${f(v.b)} × ${f(v.h)} = ${f(v.l*v.b*v.h)}`, true),
        R("TSA", 2*(v.l*v.b+v.b*v.h+v.h*v.l), 2, "TSA = 2(lb+bh+hl)", `= ${f(2*(v.l*v.b+v.b*v.h+v.h*v.l))}`)
      ],
      tip: "Keep the base fixed and double the height.",
      remember: "Volume = base area × height.",
      draw: drawCuboid
    },

    cylinder: {
      name: "Cylinder", mode: "3d", icon: "◉",
      fields: [["r","Radius","r",1,15,5],["h","Height","h",1,30,12]],
      results: v => [
        R("Volume", PI()*v.r*v.r*v.h, 3, "V = πr²h", `= ${f(PI()*v.r*v.r*v.h)}`, true),
        R("CSA", 2*PI()*v.r*v.h, 2, "CSA = 2πrh", `= ${f(2*PI()*v.r*v.h)}`),
        R("TSA", 2*PI()*v.r*(v.r+v.h), 2, "TSA = 2πr(r+h)", `= ${f(2*PI()*v.r*(v.r+v.h))}`)
      ],
      tip: "Unroll the curved surface. Which 2D shape appears?",
      remember: "Cylinder CSA = circumference × height.",
      draw: drawCylinder
    },

    cone: {
      name: "Cone", mode: "3d", icon: "△",
      fields: [["r","Radius","r",1,15,5],["h","Height","h",1,25,12]],
      results: v => {
        const l = Math.sqrt(v.r*v.r+v.h*v.h);
        return [
          R("Volume", PI()*v.r*v.r*v.h/3, 3, "V = ⅓πr²h", `= ${f(PI()*v.r*v.r*v.h/3)}`, true),
          R("Slant height", l, 1, "l = √(r²+h²)", `= ${f(l)}`),
          R("CSA", PI()*v.r*l, 2, "CSA = πrl", `= ${f(PI()*v.r*l)}`)
        ];
      },
      tip: "Use Pythagoras for slant height.",
      remember: "Cone volume is one-third of a matching cylinder.",
      draw: drawCone
    },

    stadium: {
      name: "Rectangle + Semicircles", mode: "combined", icon: "▭○",
      fields: [["l","Middle length","l",1,30,12],["r","Radius","r",1,12,4]],
      results: v => [
        R("Combined area", 2*v.r*v.l+PI()*v.r*v.r, 2, "A = 2rl + πr²", `= ${f(2*v.r*v.l+PI()*v.r*v.r)}`, true),
        R("Outer perimeter", 2*v.l+2*PI()*v.r, 1, "P = 2l + 2πr", `= ${f(2*v.l+2*PI()*v.r)}`)
      ],
      tip: "Two semicircles make one complete circle.",
      remember: "Do not count internal diameter lines.",
      draw: drawStadium
    },

    house: {
      name: "Rectangle + Triangle", mode: "combined", icon: "⌂",
      fields: [["w","Width","w",2,24,12],["hr","Rectangle height","hᵣ",1,20,8],["ht","Triangle height","hₜ",1,15,5]],
      results: v => {
        const s = Math.sqrt((v.w/2)**2+v.ht**2);
        return [
          R("Combined area", v.w*v.hr+.5*v.w*v.ht, 2, "A = whᵣ + ½whₜ", `= ${f(v.w*v.hr+.5*v.w*v.ht)}`, true),
          R("Outer perimeter", v.w+2*v.hr+2*s, 1, "P = w + 2hᵣ + 2s", `= ${f(v.w+2*v.hr+2*s)}`)
        ];
      },
      tip: "Break the figure into simple shapes first.",
      remember: "Shared internal edges do not count in perimeter.",
      draw: drawHouse
    },

    cylCone: {
      name: "Cylinder + Cone", mode: "combined", icon: "◉△",
      fields: [["r","Radius","r",1,12,4],["hc","Cylinder height","h₁",1,25,10],["hn","Cone height","h₂",1,20,7]],
      results: v => {
        const l = Math.sqrt(v.r*v.r+v.hn*v.hn);
        return [
          R("Combined volume", PI()*v.r*v.r*v.hc+PI()*v.r*v.r*v.hn/3, 3, "V = πr²h₁ + ⅓πr²h₂", `= ${f(PI()*v.r*v.r*v.hc+PI()*v.r*v.r*v.hn/3)}`, true),
          R("External area", 2*PI()*v.r*v.hc+PI()*v.r*l+PI()*v.r*v.r, 2, "SA = 2πrh₁ + πrl + πr²", `= ${f(2*PI()*v.r*v.hc+PI()*v.r*l+PI()*v.r*v.r)}`)
        ];
      },
      tip: "The joined circular face is hidden inside.",
      remember: "Joined faces are excluded from outside surface area.",
      draw: drawCylinderCone
    },

    prismPyramid: {
      name: "Prism + Pyramid", mode: "combined", icon: "▰△",
      fields: [["a","Square base side","a",2,18,8],["hp","Prism height","h₁",1,20,8],["hy","Pyramid height","h₂",1,18,7]],
      results: v => {
        const l = Math.sqrt(v.hy*v.hy+(v.a/2)**2);
        return [
          R("Combined volume", v.a*v.a*v.hp+v.a*v.a*v.hy/3, 3, "V = a²h₁ + ⅓a²h₂", `= ${f(v.a*v.a*v.hp+v.a*v.a*v.hy/3)}`, true),
          R("External area", 4*v.a*v.hp+v.a*v.a+2*v.a*l, 2, "SA = 4ah₁ + a² + 2al", `= ${f(4*v.a*v.hp+v.a*v.a+2*v.a*l)}`),
          R("Slant height", l, 1, "l = √(h₂²+(a/2)²)", `= ${f(l)}`)
        ];
      },
      tip: "The top prism face is covered by the pyramid.",
      remember: "Add volumes; remove joined faces from external area.",
      draw: drawPrismPyramid
    },

    crystal: {
      name: "Crystal: Prism + 2 Pyramids", mode: "combined", icon: "◆",
      fields: [["a","Square width","a",2,16,7],["hp","Prism height","h",1,18,8],["ht","Top pyramid height","p₁",1,15,6],["hb","Bottom pyramid height","p₂",1,15,6]],
      results: v => {
        const lt = Math.sqrt(v.ht*v.ht+(v.a/2)**2);
        const lb = Math.sqrt(v.hb*v.hb+(v.a/2)**2);
        return [
          R("Crystal volume", v.a*v.a*v.hp+v.a*v.a*(v.ht+v.hb)/3, 3, "V = a²h + ⅓a²(p₁+p₂)", `= ${f(v.a*v.a*v.hp+v.a*v.a*(v.ht+v.hb)/3)}`, true),
          R("External area", 4*v.a*v.hp+2*v.a*lt+2*v.a*lb, 2, "SA = 4ah + 2al₁ + 2al₂", `= ${f(4*v.a*v.hp+2*v.a*lt+2*v.a*lb)}`)
        ];
      },
      tip: "This crystal has a prism in the middle and a pyramid at each end.",
      remember: "Both square prism ends are internal.",
      draw: drawCrystal
    },

    doublePyramid: {
      name: "Double-Pyramid Crystal", mode: "combined", icon: "◇",
      fields: [["a","Square side","a",2,18,8],["h1","Top height","h₁",1,18,7],["h2","Bottom height","h₂",1,18,7]],
      results: v => {
        const l1 = Math.sqrt(v.h1*v.h1+(v.a/2)**2);
        const l2 = Math.sqrt(v.h2*v.h2+(v.a/2)**2);
        return [
          R("Combined volume", v.a*v.a*(v.h1+v.h2)/3, 3, "V = ⅓a²(h₁+h₂)", `= ${f(v.a*v.a*(v.h1+v.h2)/3)}`, true),
          R("External area", 2*v.a*(l1+l2), 2, "SA = 2a(l₁+l₂)", `= ${f(2*v.a*(l1+l2))}`)
        ];
      },
      tip: "This is two square pyramids joined base-to-base.",
      remember: "The common square base is internal.",
      draw: drawDoublePyramid
    }
  };

  function defaults() {
    state.values = {};
    shapes[state.shape].fields.forEach(x => state.values[x[0]] = x[5]);
  }

  function firstOf(mode) {
    return Object.keys(shapes).find(k => shapes[k].mode === mode);
  }

  function renderShapes() {
    const g = $("#shapeGrid");
    g.innerHTML = "";
    Object.entries(shapes)
      .filter(([,s]) => s.mode === state.mode)
      .forEach(([k,s]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "shape-btn";
        b.setAttribute("aria-pressed", k === state.shape ? "true" : "false");
        b.innerHTML = `<span class="icon" aria-hidden="true">${s.icon}</span><span>${s.name}</span>`;
        b.addEventListener("click", () => selectShape(k));
        g.appendChild(b);
      });
  }

  function renderControls() {
    const c = $("#controls");
    c.innerHTML = "";

    shapes[state.shape].fields.forEach(([key,name,symbol,min,max]) => {
      const d = document.createElement("div");
      d.className = "control";
      d.innerHTML = `
        <div class="control-top">
          <div class="control-name">${name} <span style="font-family:Georgia,serif;font-style:italic;color:var(--accent)">${symbol}</span></div>
          <div class="num-wrap">
            <input data-num="${key}" type="number" min="${min}" max="${max}" step="0.5" value="${state.values[key]}" />
            <span>${state.unit}</span>
          </div>
        </div>
        <input data-range="${key}" type="range" min="${min}" max="${max}" step="0.5" value="${state.values[key]}" />
      `;

      const n = d.querySelector("[data-num]");
      const r = d.querySelector("[data-range]");

      const apply = val => {
        let x = Number(val);
        if (!Number.isFinite(x)) x = min;
        x = Math.max(min, Math.min(max, x));
        state.values[key] = x;
        n.value = x;
        r.value = x;
        update();
      };

      n.addEventListener("input", () => apply(n.value));
      r.addEventListener("input", () => apply(r.value));

      c.appendChild(d);
    });
  }

  function renderResults() {
    const rs = shapes[state.shape].results(state.values);
    const g = $("#results");

    g.innerHTML = rs.map(x => `
      <article class="result${x.primary ? " primary" : ""}">
        <div class="result-name">${x.name}</div>
        <div class="result-value">${f(x.value)} ${U(x.power)}</div>
        <div class="formula">${x.formula}</div>
        <div class="working">${x.working} ${U(x.power)}</div>
      </article>
    `).join("");

    g.classList.toggle("show-working", $("#showWorking").checked);
  }

  function tabs() {
    [["2d","#tab2d"],["3d","#tab3d"],["combined","#tabCombined"]]
      .forEach(([m,id]) => $(id).setAttribute("aria-selected", state.mode === m ? "true" : "false"));
  }

  function update() {
    const s = shapes[state.shape];
    $("#shapeName").textContent = s.name;
    $("#shapeBadge").textContent = s.mode === "combined" ? "COMBINED" : s.mode.toUpperCase();
    $("#tip").textContent = s.tip;
    $("#remember").textContent = s.remember;
    renderResults();
    draw();
  }

  function selectShape(k) {
    state.shape = k;
    state.mode = shapes[k].mode;
    defaults();
    tabs();
    renderShapes();
    renderControls();
    update();
    closeChallenge();
  }

  function E(name, attrs={}) {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v));
    return e;
  }

  function T(svg, x, y, txt, anchor="middle") {
    const t = E("text", { x, y, "text-anchor": anchor, class: "svgtext" });
    t.textContent = txt;
    svg.appendChild(t);
  }

  function pair(a,b,mw,mh) {
    const k = Math.min(mw/Math.max(a,1), mh/Math.max(b,1));
    return [a*k,b*k];
  }

  function draw() {
    const svg = $("#canvas");
    svg.innerHTML = "";
    shapes[state.shape].draw(svg, state.values);
  }

  function drawRectangle(s,v) {
    const [w,h] = pair(v.l,v.b,340,215);
    const x=(600-w)/2, y=(440-h)/2;
    s.appendChild(E("rect",{x,y,width:w,height:h,rx:6,class:"shape-fill"}));
    T(s,300,y+h+34,`l = ${f(v.l)} ${state.unit}`);
    T(s,x-12,y+h/2,`b = ${f(v.b)} ${state.unit}`,"end");
  }

  function drawTriangle(s,v) {
    const [w,h]=pair(v.b,v.h,350,225);
    const x=(600-w)/2, y=340-h, ax=x+w*.55;
    s.appendChild(E("path",{d:`M ${x} 340 L ${x+w} 340 L ${ax} ${y} Z`,class:"shape-fill"}));
    s.appendChild(E("line",{x1:ax,y1:y,x2:ax,y2:340,class:"guide"}));
    T(s,300,375,`b = ${f(v.b)} ${state.unit}`);
    T(s,ax+15,(y+340)/2,`h = ${f(v.h)} ${state.unit}`,"start");
  }

  function drawCircle(s,v) {
    const r=Math.min(130,Math.max(65,v.r*13)), cx=300, cy=220;
    s.appendChild(E("circle",{cx,cy,r,class:"shape-fill"}));
    s.appendChild(E("line",{x1:cx,y1:cy,x2:cx+r,y2:cy,class:"guide"}));
    T(s,cx+r/2,cy-15,`r = ${f(v.r)} ${state.unit}`);
  }

  function drawCuboid(s,v) {
    const [w,h]=pair(v.l,v.h,280,185);
    const d=Math.min(95,Math.max(42,v.b*6)), x=(600-w-d)/2, y=145;
    s.appendChild(E("path",{d:`M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h} L ${x} ${y+h} Z
      M ${x+d} ${y-d*.55} L ${x+w+d} ${y-d*.55} L ${x+w+d} ${y+h-d*.55} L ${x+w} ${y+h}
      M ${x} ${y} L ${x+d} ${y-d*.55}
      M ${x+w} ${y} L ${x+w+d} ${y-d*.55}`,class:"shape-fill"}));
    T(s,x+w/2,y+h+35,`l = ${f(v.l)} ${state.unit}`);
  }

  function drawCylinder(s,v) {
    const r=Math.min(105,Math.max(48,v.r*12)), h=Math.min(215,Math.max(90,v.h*10)), cx=300, y=(440-h)/2, ry=Math.max(16,r*.23);
    s.appendChild(E("ellipse",{cx,cy:y,rx:r,ry,class:"shape-fill"}));
    s.appendChild(E("path",{d:`M ${cx-r} ${y} L ${cx-r} ${y+h} M ${cx+r} ${y} L ${cx+r} ${y+h}`,class:"shape-fill"}));
    s.appendChild(E("ellipse",{cx,cy:y+h,rx:r,ry,class:"shape-fill-2"}));
    T(s,cx+r+16,y+h/2,`h = ${f(v.h)} ${state.unit}`,"start");
  }

  function drawCone(s,v) {
    const r=Math.min(108,Math.max(48,v.r*12)), h=Math.min(230,Math.max(95,v.h*10)), cx=300, by=355, ty=by-h, ry=Math.max(16,r*.22);
    s.appendChild(E("path",{d:`M ${cx} ${ty} L ${cx-r} ${by} A ${r} ${ry} 0 0 0 ${cx+r} ${by} Z`,class:"shape-fill"}));
    s.appendChild(E("ellipse",{cx,cy:by,rx:r,ry,class:"shape-fill-2"}));
    T(s,cx+15,(ty+by)/2,`h = ${f(v.h)} ${state.unit}`,"start");
  }

  function drawStadium(s,v) {
    const r=Math.min(85,Math.max(42,v.r*12)), w=Math.min(270,Math.max(95,v.l*11)), cx=300, cy=220, x=cx-w/2;
    s.appendChild(E("rect",{x,y:cy-r,width:w,height:2*r,class:"shape-fill"}));
    s.appendChild(E("path",{d:`M ${x} ${cy-r} A ${r} ${r} 0 0 0 ${x} ${cy+r}
      M ${x+w} ${cy-r} A ${r} ${r} 0 0 1 ${x+w} ${cy+r}`,class:"shape-fill"}));
    T(s,cx,cy+r+35,`l = ${f(v.l)} ${state.unit}`);
  }

  function drawHouse(s,v) {
    const [w,hr]=pair(v.w,v.hr,295,145);
    const ht=Math.min(140,Math.max(50,v.ht*11)), x=(600-w)/2, base=345;
    s.appendChild(E("rect",{x,y:base-hr,width:w,height:hr,class:"shape-fill"}));
    s.appendChild(E("path",{d:`M ${x} ${base-hr} L ${x+w/2} ${base-hr-ht} L ${x+w} ${base-hr} Z`,class:"shape-fill-2"}));
    T(s,300,base+33,`w = ${f(v.w)} ${state.unit}`);
  }

  function drawCylinderCone(s,v) {
    const r=Math.min(100,Math.max(46,v.r*12)), hc=Math.min(135,Math.max(65,v.hc*7)), hn=Math.min(135,Math.max(60,v.hn*8)), cx=300, join=205, top=join-hn, ry=Math.max(14,r*.21);
    s.appendChild(E("path",{d:`M ${cx} ${top} L ${cx-r} ${join} L ${cx+r} ${join} Z`,class:"shape-fill-2"}));
    s.appendChild(E("path",{d:`M ${cx-r} ${join} L ${cx-r} ${join+hc} M ${cx+r} ${join} L ${cx+r} ${join+hc}`,class:"shape-fill"}));
    s.appendChild(E("ellipse",{cx,cy:join+hc,rx:r,ry,class:"shape-fill"}));
    T(s,cx+r+14,join+hc/2,`h₁ = ${f(v.hc)} ${state.unit}`,"start");
  }

  function drawPrismPyramid(s,v) {
    const a=Math.min(170,Math.max(80,v.a*11)), hp=Math.min(130,Math.max(60,v.hp*7)), hy=Math.min(125,Math.max(55,v.hy*8)), cx=300, baseY=350, top=baseY-hp, left=cx-a/2, right=cx+a/2, apexY=top-hy;
    s.appendChild(E("rect",{x:left,y:top,width:a,height:hp,class:"shape-fill"}));
    s.appendChild(E("path",{d:`M ${cx} ${apexY} L ${left} ${top} L ${right} ${top} Z`,class:"shape-fill-2"}));
    T(s,right+16,(top+baseY)/2,`h₁ = ${f(v.hp)} ${state.unit}`,"start");
    T(s,cx+14,(apexY+top)/2,`h₂ = ${f(v.hy)} ${state.unit}`,"start");
  }

  function drawCrystal(s,v) {
    const a=Math.min(155,Math.max(76,v.a*11)), hp=Math.min(105,Math.max(50,v.hp*6)), ht=Math.min(96,Math.max(42,v.ht*6)), hb=Math.min(96,Math.max(42,v.hb*6)), cx=300, top=190, bottom=top+hp, left=cx-a/2, right=cx+a/2;
    s.appendChild(E("rect",{x:left,y:top,width:a,height:hp,class:"shape-fill"}));
    s.appendChild(E("path",{d:`M ${cx} ${top-ht} L ${left} ${top} L ${right} ${top} Z`,class:"shape-fill-2"}));
    s.appendChild(E("path",{d:`M ${left} ${bottom} L ${cx} ${bottom+hb} L ${right} ${bottom} Z`,class:"shape-fill-2"}));
    T(s,right+16,top+hp/2,`h = ${f(v.hp)} ${state.unit}`,"start");
  }

  function drawDoublePyramid(s,v) {
    const a=Math.min(180,Math.max(86,v.a*11)), h1=Math.min(140,Math.max(58,v.h1*7)), h2=Math.min(140,Math.max(58,v.h2*7)), cx=300, mid=220, left=cx-a/2, right=cx+a/2;
    s.appendChild(E("path",{d:`M ${cx} ${mid-h1} L ${left} ${mid} L ${cx} ${mid+h2} L ${right} ${mid} Z`,class:"shape-fill"}));
    s.appendChild(E("line",{x1:left,y1:mid,x2:right,y2:mid,class:"guide"}));
    T(s,cx+14,mid-h1/2,`h₁ = ${f(v.h1)} ${state.unit}`,"start");
    T(s,cx+14,mid+h2/2,`h₂ = ${f(v.h2)} ${state.unit}`,"start");
  }

  function randomize() {
    shapes[state.shape].fields.forEach(([k,n,s,min,max]) => {
      const steps = Math.round((max-min)/.5);
      state.values[k] = min + Math.floor(Math.random()*(steps+1))*.5;
    });
    renderControls();
    update();
    closeChallenge();
  }

  function openChallenge() {
    const rs = shapes[state.shape].results(state.values);
    const t = rs[Math.floor(Math.random()*rs.length)];
    state.challenge = t;
    $("#challengeBox").classList.add("open");
    $("#challengeQ").textContent = `Calculate the ${t.name.toLowerCase()}. Round to 2 decimal places if needed.`;
    $("#challengeAnswer").value = "";
    $("#challengeFeedback").textContent = "";
  }

  function closeChallenge() {
    state.challenge = null;
    $("#challengeBox").classList.remove("open");
  }

  function checkChallenge() {
    if (!state.challenge) return;
    const x = Number($("#challengeAnswer").value);
    const a = state.challenge.value;

    if (!Number.isFinite(x)) {
      $("#challengeFeedback").textContent = "Enter a number first.";
      return;
    }

    const ok = Math.abs(x-a) <= Math.max(.02,Math.abs(a)*.002);
    $("#challengeFeedback").textContent = ok ? "✅ Correct!" : `Try again. Hint: ${state.challenge.formula}`;
    $("#challengeFeedback").style.color = ok ? "var(--series-3)" : "var(--series-4)";
  }

  $("#tab2d").addEventListener("click", () => selectShape(firstOf("2d")));
  $("#tab3d").addEventListener("click", () => selectShape(firstOf("3d")));
  $("#tabCombined").addEventListener("click", () => selectShape(firstOf("combined")));
  $("#unit").addEventListener("change", e => {
    state.unit = e.target.value;
    renderControls();
    update();
  });
  $("#piMode").addEventListener("change", e => {
    state.piMode = e.target.value;
    update();
  });
  $("#randomBtn").addEventListener("click", randomize);
  $("#challengeBtn").addEventListener("click", openChallenge);
  $("#closeChallenge").addEventListener("click", closeChallenge);
  $("#checkChallenge").addEventListener("click", checkChallenge);
  $("#challengeAnswer").addEventListener("keydown", e => {
    if (e.key === "Enter") checkChallenge();
  });
  $("#showWorking").addEventListener("change", renderResults);

  defaults();
  tabs();
  renderShapes();
  renderControls();
  update();
})();
