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
          <div class="control-name">
            ${name}
            <span style="font-family:Georgia,serif;font-style:italic;color:var(--accent)">
              ${symbol}
            </span>
          </div>

          <div class="num-wrap">
            <input
              data-num="${key}"
              type="number"
              min="${min}"
              max="${max}"
              step="0.5"
              value="${state.values[key]}"
            />
            <span>${state.unit}</span>
          </div>
        </div>

        <input
          data-range="${key}"
          type="range"
          min="${min}"
          max="${max}"
          step="0.5"
          value="${state.values[key]}"
        />
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

        <div class="result-value">
          ${f(x.value)} ${U(x.power)}
        </div>

        <div class="formula">
          ${x.formula}
        </div>

        <div class="working">
          ${x.working} ${U(x.power)}
        </div>
      </article>
    `).join("");

    g.classList.toggle(
      "show-working",
      $("#showWorking").checked
    );
  }

  function tabs() {
    [
      ["2d","#tab2d"],
      ["3d","#tab3d"],
      ["combined","#tabCombined"]
    ].forEach(([m,id]) => {
      $(id).setAttribute(
        "aria-selected",
        state.mode === m ? "true" : "false"
      );
    });
  }

  function update() {
    const s = shapes[state.shape];

    $("#shapeName").textContent = s.name;

    $("#shapeBadge").textContent =
      s.mode === "combined"
        ? "COMBINED"
        : s.mode.toUpperCase();

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

    Object.entries(attrs).forEach(([k,v]) => {
      e.setAttribute(k, v);
    });

    return e;
  }

  function T(svg, x, y, txt, anchor="middle") {
    const t = E("text", {
      x,
      y,
      "text-anchor": anchor,
      class: "svgtext"
    });

    t.textContent = txt;
    svg.appendChild(t);
  }

  function P(points) {
    return points
      .map(([x,y], i) =>
        `${i ? "L" : "M"} ${x} ${y}`
      )
      .join(" ") + " Z";
  }

  function polygon(svg, points, cls="shape-fill") {
    svg.appendChild(
      E("path", {
        d: P(points),
        class: cls
      })
    );
  }

  function pair(a,b,mw,mh) {
    const k = Math.min(
      mw / Math.max(a,1),
      mh / Math.max(b,1)
    );

    return [a*k,b*k];
  }

  function draw() {
    const svg = $("#canvas");

    svg.innerHTML = "";

    shapes[state.shape].draw(
      svg,
      state.values
    );
  }

  function drawRectangle(s,v) {
    const [w,h] = pair(v.l,v.b,340,215);

    const x = (600-w)/2;
    const y = (440-h)/2;

    s.appendChild(
      E("rect",{
        x,
        y,
        width:w,
        height:h,
        rx:6,
        class:"shape-fill"
      })
    );

    T(
      s,
      300,
      y+h+34,
      `l = ${f(v.l)} ${state.unit}`
    );

    T(
      s,
      x-12,
      y+h/2,
      `b = ${f(v.b)} ${state.unit}`,
      "end"
    );
  }

  function drawTriangle(s,v) {
    const [w,h] = pair(v.b,v.h,350,225);

    const x = (600-w)/2;
    const y = 340-h;
    const ax = x+w*.55;

    s.appendChild(
      E("path",{
        d:`M ${x} 340 L ${x+w} 340 L ${ax} ${y} Z`,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("line",{
        x1:ax,
        y1:y,
        x2:ax,
        y2:340,
        class:"guide"
      })
    );

    T(
      s,
      300,
      375,
      `b = ${f(v.b)} ${state.unit}`
    );

    T(
      s,
      ax+15,
      (y+340)/2,
      `h = ${f(v.h)} ${state.unit}`,
      "start"
    );
  }

  function drawCircle(s,v) {
    const r = Math.min(
      130,
      Math.max(65,v.r*13)
    );

    const cx = 300;
    const cy = 220;

    s.appendChild(
      E("circle",{
        cx,
        cy,
        r,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("line",{
        x1:cx,
        y1:cy,
        x2:cx+r,
        y2:cy,
        class:"guide"
      })
    );

    T(
      s,
      cx+r/2,
      cy-15,
      `r = ${f(v.r)} ${state.unit}`
    );
  }

  function drawCuboid(s,v) {
    const [w,h] = pair(
      v.l,
      v.h,
      220,
      150
    );

    const d = Math.min(
      85,
      Math.max(38,v.b*5.5)
    );

    const dx = d;
    const dy = d*0.55;

    const x = (600-(w+dx))/2;
    const y = 170;

    const A = [x,y];
    const B = [x+w,y];
    const C = [x+w,y+h];
    const D = [x,y+h];

    const A2 = [x+dx,y-dy];
    const B2 = [x+w+dx,y-dy];
    const C2 = [x+w+dx,y+h-dy];
    const D2 = [x+dx,y+h-dy];

    polygon(
      s,
      [A2,B2,B,A],
      "shape-fill-2"
    );

    polygon(
      s,
      [B2,C2,C,B],
      "shape-fill"
    );

    polygon(
      s,
      [A,B,C,D],
      "shape-fill"
    );

    s.appendChild(
      E("line",{
        x1:A[0],
        y1:A[1],
        x2:A2[0],
        y2:A2[1],
        class:"guide"
      })
    );

    s.appendChild(
      E("line",{
        x1:D[0],
        y1:D[1],
        x2:D2[0],
        y2:D2[1],
        class:"guide"
      })
    );

    T(
      s,
      (D[0]+C[0])/2,
      C[1]+34,
      `l = ${f(v.l)} ${state.unit}`
    );

    T(
      s,
      A[0]-14,
      (A[1]+D[1])/2,
      `h = ${f(v.h)} ${state.unit}`,
      "end"
    );

    T(
      s,
      (A2[0]+B2[0])/2+14,
      (A2[1]+B2[1])/2-10,
      `b = ${f(v.b)} ${state.unit}`
    );
  }

  function drawCylinder(s,v) {
    const r = Math.min(
      95,
      Math.max(42,v.r*11)
    );

    const h = Math.min(
      190,
      Math.max(95,v.h*9)
    );

    const cx = 300;
    const top = 125;

    const ry = Math.max(
      15,
      r*0.26
    );

    s.appendChild(
      E("ellipse",{
        cx,
        cy:top,
        rx:r,
        ry,
        class:"shape-fill-2"
      })
    );

    s.appendChild(
      E("line",{
        x1:cx-r,
        y1:top,
        x2:cx-r,
        y2:top+h,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("line",{
        x1:cx+r,
        y1:top,
        x2:cx+r,
        y2:top+h,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("ellipse",{
        cx,
        cy:top+h,
        rx:r,
        ry,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("line",{
        x1:cx,
        y1:top,
        x2:cx+r,
        y2:top,
        class:"guide"
      })
    );

    T(
      s,
      cx+r/2,
      top-14,
      `r = ${f(v.r)} ${state.unit}`
    );

    T(
      s,
      cx+r+18,
      top+h/2,
      `h = ${f(v.h)} ${state.unit}`,
      "start"
    );
  }

  function drawCone(s,v) {
    const r = Math.min(
      100,
      Math.max(42,v.r*11)
    );

    const h = Math.min(
      220,
      Math.max(100,v.h*9)
    );

    const cx = 300;
    const by = 340;
    const ty = by-h;

    const ry = Math.max(
      15,
      r*0.24
    );

    s.appendChild(
      E("path",{
        d:`M ${cx} ${ty}
           L ${cx-r} ${by}
           A ${r} ${ry} 0 0 0 ${cx+r} ${by}
           Z`,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("ellipse",{
        cx,
        cy:by,
        rx:r,
        ry,
        class:"shape-fill-2"
      })
    );

    s.appendChild(
      E("line",{
        x1:cx,
        y1:ty,
        x2:cx,
        y2:by,
        class:"guide"
      })
    );

    T(
      s,
      cx+r/2,
      by-14,
      `r = ${f(v.r)} ${state.unit}`
    );

    T(
      s,
      cx+18,
      (ty+by)/2,
      `h = ${f(v.h)} ${state.unit}`,
      "start"
    );
  }

  function drawStadium(s,v) {
    const r = Math.min(
      85,
      Math.max(42,v.r*12)
    );

    const w = Math.min(
      270,
      Math.max(95,v.l*11)
    );

    const cx = 300;
    const cy = 220;
    const x = cx-w/2;

    s.appendChild(
      E("rect",{
        x,
        y:cy-r,
        width:w,
        height:2*r,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("path",{
        d:`M ${x} ${cy-r}
           A ${r} ${r} 0 0 0 ${x} ${cy+r}
           M ${x+w} ${cy-r}
           A ${r} ${r} 0 0 1 ${x+w} ${cy+r}`,
        class:"shape-fill"
      })
    );

    T(
      s,
      cx,
      cy+r+35,
      `l = ${f(v.l)} ${state.unit}`
    );
  }

  function drawHouse(s,v) {
    const [w,hr] = pair(
      v.w,
      v.hr,
      295,
      145
    );

    const ht = Math.min(
      140,
      Math.max(50,v.ht*11)
    );

    const x = (600-w)/2;
    const base = 345;

    s.appendChild(
      E("rect",{
        x,
        y:base-hr,
        width:w,
        height:hr,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("path",{
        d:`M ${x} ${base-hr}
           L ${x+w/2} ${base-hr-ht}
           L ${x+w} ${base-hr}
           Z`,
        class:"shape-fill-2"
      })
    );

    T(
      s,
      300,
      base+33,
      `w = ${f(v.w)} ${state.unit}`
    );
  }

  function drawCylinderCone(s,v) {
    const r = Math.min(
      92,
      Math.max(42,v.r*10)
    );

    const hc = Math.min(
      115,
      Math.max(60,v.hc*6.5)
    );

    const hn = Math.min(
      110,
      Math.max(55,v.hn*7.5)
    );

    const cx = 300;
    const join = 195;
    const top = join-hn;
    const bottom = join+hc;

    const ry = Math.max(
      14,
      r*0.22
    );

    s.appendChild(
      E("path",{
        d:`M ${cx} ${top}
           L ${cx-r} ${join}
           L ${cx+r} ${join}
           Z`,
        class:"shape-fill-2"
      })
    );

    s.appendChild(
      E("ellipse",{
        cx,
        cy:join,
        rx:r,
        ry,
        class:"shape-fill-2"
      })
    );

    s.appendChild(
      E("line",{
        x1:cx-r,
        y1:join,
        x2:cx-r,
        y2:bottom,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("line",{
        x1:cx+r,
        y1:join,
        x2:cx+r,
        y2:bottom,
        class:"shape-fill"
      })
    );

    s.appendChild(
      E("ellipse",{
        cx,
        cy:bottom,
        rx:r,
        ry,
        class:"shape-fill"
      })
    );

    T(
      s,
      cx+r+16,
      (join+bottom)/2,
      `h₁ = ${f(v.hc)} ${state.unit}`,
      "start"
    );

    T(
      s,
      cx+18,
      (top+join)/2,
      `h₂ = ${f(v.hn)} ${state.unit}`,
      "start"
    );
  }

  function drawPrismPyramid(s,v) {
    const a = Math.min(
      145,
      Math.max(72,v.a*9)
    );

    const hp = Math.min(
      120,
      Math.max(58,v.hp*6.5)
    );

    const hy = Math.min(
      100,
      Math.max(48,v.hy*7)
    );

    const dx = a*0.42;
    const dy = a*0.24;

    const cx = 300;
    const baseY = 360;

    const FTL = [cx-a/2,baseY-hp];
    const FTR = [cx+a/2,baseY-hp];
    const FBR = [cx+a/2,baseY];
    const FBL = [cx-a/2,baseY];

    const BTL = [FTL[0]+dx,FTL[1]-dy];
    const BTR = [FTR[0]+dx,FTR[1]-dy];
    const BBR = [FBR[0]+dx,FBR[1]-dy];
    const BBL = [FBL[0]+dx,FBL[1]-dy];

    polygon(
      s,
      [BTL,BTR,FTR,FTL],
      "shape-fill-2"
    );

    polygon(
      s,
      [FTR,BTR,BBR,FBR],
      "shape-fill"
    );

    polygon(
      s,
      [FTL,FTR,FBR,FBL],
      "shape-fill"
    );

    const apex = [
      (BTL[0]+BTR[0])/2,
      (BTL[1]+BTR[1])/2-hy
    ];

    polygon(
      s,
      [apex,BTR,FTR],
      "shape-fill-2"
    );

    polygon(
      s,
      [apex,FTR,FTL],
      "shape-fill-2"
    );

    polygon(
      s,
      [apex,FTL,BTL],
      "shape-fill-2"
    );

    T(
      s,
      (FBL[0]+FBR[0])/2,
      FBR[1]+32,
      `a = ${f(v.a)} ${state.unit}`
    );

    T(
      s,
      FTR[0]+24,
      (FTR[1]+FBR[1])/2,
      `h₁ = ${f(v.hp)} ${state.unit}`,
      "start"
    );

    T(
      s,
      apex[0]+18,
      (apex[1]+(BTL[1]+BTR[1])/2)/2,
      `h₂ = ${f(v.hy)} ${state.unit}`,
      "start"
    );
  }

  function drawCrystal(s,v) {
    const a = Math.min(
      130,
      Math.max(66,v.a*8.5)
    );

    const hp = Math.min(
      98,
      Math.max(46,v.hp*6)
    );

    const ht = Math.min(
      86,
      Math.max(40,v.ht*6)
    );

    const hb = Math.min(
      86,
      Math.max(40,v.hb*6)
    );

    const dx = a*0.38;
    const dy = a*0.22;

    const cx = 300;
    const baseY = 305;

    const FTL = [cx-a/2,baseY-hp];
    const FTR = [cx+a/2,baseY-hp];
    const FBR = [cx+a/2,baseY];
    const FBL = [cx-a/2,baseY];

    const BTL = [FTL[0]+dx,FTL[1]-dy];
    const BTR = [FTR[0]+dx,FTR[1]-dy];
    const BBR = [FBR[0]+dx,FBR[1]-dy];
    const BBL = [FBL[0]+dx,FBL[1]-dy];

    polygon(
      s,
      [BTL,BTR,FTR,FTL],
      "shape-fill-2"
    );

    polygon(
      s,
      [FTR,BTR,BBR,FBR],
      "shape-fill"
    );

    polygon(
      s,
      [FTL,FTR,FBR,FBL],
      "shape-fill"
    );

    const topApex = [
      (BTL[0]+BTR[0])/2,
      (BTL[1]+BTR[1])/2-ht
    ];

    const bottomApex = [
      (FBL[0]+FBR[0])/2+dx/2,
      (FBL[1]+FBR[1])/2+hb
    ];

    polygon(
      s,
      [topApex,BTR,FTR],
      "shape-fill-2"
    );

    polygon(
      s,
      [topApex,FTR,FTL],
      "shape-fill-2"
    );

    polygon(
      s,
      [topApex,FTL,BTL],
      "shape-fill-2"
    );

    polygon(
      s,
      [FBL,FBR,bottomApex],
      "shape-fill-2"
    );

    polygon(
      s,
      [FBR,BBR,bottomApex],
      "shape-fill-2"
    );

    polygon(
      s,
      [FBL,BBL,bottomApex],
      "shape-fill-2"
    );

    T(
      s,
      FTR[0]+24,
      (FTL[1]+FBL[1])/2,
      `h = ${f(v.hp)} ${state.unit}`,
      "start"
    );

    T(
      s,
      topApex[0]+18,
      (topApex[1]+FTL[1])/2,
      `p₁ = ${f(v.ht)} ${state.unit}`,
      "start"
    );

    T(
      s,
      bottomApex[0]+18,
      (bottomApex[1]+FBL[1])/2,
      `p₂ = ${f(v.hb)} ${state.unit}`,
      "start"
    );
  }

  function drawDoublePyramid(s,v) {
    const a = Math.min(
      160,
      Math.max(82,v.a*9)
    );

    const h1 = Math.min(
      120,
      Math.max(55,v.h1*6.5)
    );

    const h2 = Math.min(
      120,
      Math.max(55,v.h2*6.5)
    );

    const dx = a*0.45;
    const dy = a*0.26;

    const cx = 300;
    const cy = 220;

    const L = [cx-a/2,cy];
    const R = [cx+a/2,cy];
    const Tm = [cx+dx,cy-dy];
    const Bm = [cx-dx,cy+dy];

    const top = [cx,cy-h1];
    const bottom = [cx,cy+h2];

    polygon(
      s,
      [top,Tm,R],
      "shape-fill-2"
    );

    polygon(
      s,
      [top,R,Bm],
      "shape-fill"
    );

    polygon(
      s,
      [top,Bm,L],
      "shape-fill-2"
    );

    polygon(
      s,
      [top,L,Tm],
      "shape-fill"
    );

    polygon(
      s,
      [bottom,Tm,R],
      "shape-fill"
    );

    polygon(
      s,
      [bottom,R,Bm],
      "shape-fill-2"
    );

    polygon(
      s,
      [bottom,Bm,L],
      "shape-fill"
    );

    polygon(
      s,
      [bottom,L,Tm],
      "shape-fill-2"
    );

    s.appendChild(
      E("path",{
        d:P([L,Tm,R,Bm]),
        class:"guide"
      })
    );

    T(
      s,
      top[0]+16,
      (top[1]+cy)/2,
      `h₁ = ${f(v.h1)} ${state.unit}`,
      "start"
    );

    T(
      s,
      bottom[0]+16,
      (bottom[1]+cy)/2,
      `h₂ = ${f(v.h2)} ${state.unit}`,
      "start"
    );

    T(
      s,
      cx,
      cy+20,
      `a = ${f(v.a)} ${state.unit}`
    );
  }

  function randomize() {
    shapes[state.shape].fields.forEach(
      ([k,n,s,min,max]) => {
        const steps = Math.round(
          (max-min)/.5
        );

        state.values[k] =
          min +
          Math.floor(
            Math.random()*(steps+1)
          )*.5;
      }
    );

    renderControls();
    update();
    closeChallenge();
  }

  function openChallenge() {
    const rs =
      shapes[state.shape].results(
        state.values
      );

    const t =
      rs[
        Math.floor(
          Math.random()*rs.length
        )
      ];

    state.challenge = t;

    $("#challengeBox")
      .classList
      .add("open");

    $("#challengeQ").textContent =
      `Calculate the ${t.name.toLowerCase()}. Round to 2 decimal places if needed.`;

    $("#challengeAnswer").value = "";
    $("#challengeFeedback").textContent = "";
  }

  function closeChallenge() {
    state.challenge = null;

    $("#challengeBox")
      .classList
      .remove("open");
  }

  function checkChallenge() {
    if (!state.challenge) return;

    const x =
      Number(
        $("#challengeAnswer").value
      );

    const a =
      state.challenge.value;

    if (!Number.isFinite(x)) {
      $("#challengeFeedback").textContent =
        "Enter a number first.";

      return;
    }

    const ok =
      Math.abs(x-a) <=
      Math.max(
        .02,
        Math.abs(a)*.002
      );

    $("#challengeFeedback").textContent =
      ok
        ? "✅ Correct!"
        : `Try again. Hint: ${state.challenge.formula}`;

    $("#challengeFeedback").style.color =
      ok
        ? "var(--series-3)"
        : "var(--series-4)";
  }

  $("#tab2d").addEventListener(
    "click",
    () => selectShape(firstOf("2d"))
  );

  $("#tab3d").addEventListener(
    "click",
    () => selectShape(firstOf("3d"))
  );

  $("#tabCombined").addEventListener(
    "click",
    () => selectShape(firstOf("combined"))
  );

  $("#unit").addEventListener(
    "change",
    e => {
      state.unit = e.target.value;

      renderControls();
      update();
    }
  );

  $("#piMode").addEventListener(
    "change",
    e => {
      state.piMode = e.target.value;
      update();
    }
  );

  $("#randomBtn").addEventListener(
    "click",
    randomize
  );

  $("#challengeBtn").addEventListener(
    "click",
    openChallenge
  );

  $("#closeChallenge").addEventListener(
    "click",
    closeChallenge
  );

  $("#checkChallenge").addEventListener(
    "click",
    checkChallenge
  );

  $("#challengeAnswer").addEventListener(
    "keydown",
    e => {
      if (e.key === "Enter") {
        checkChallenge();
      }
    }
  );

  $("#showWorking").addEventListener(
    "change",
    renderResults
  );

  defaults();
  tabs();
  renderShapes();
  renderControls();
  update();
})();
