import{r as a,j as s}from"./vendor-BGigMeYS.js";import{_ as g,D as w,j as v,B as E,k as j,l as h,b as x,q as y}from"./index-dePlLqhx.js";import{a as k}from"./format-KlNBcQkc.js";function M({title:e,titleId:t,...o},n){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},o),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"}))}const $=a.forwardRef(M);function D({title:e,titleId:t,...o},n){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},o),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"}))}const L=a.forwardRef(D);function R({title:e,titleId:t,...o},n){return a.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:n,"aria-labelledby":t},o),e?a.createElement("title",{id:t},e):null,a.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"}))}const T=a.forwardRef(R),f=(e,t)=>t.format?t.format(e[t.key],e):e[t.key]??"",_=(e,t,o)=>{const n=e.map(r=>Object.fromEntries(t.map(c=>[c.label,f(r,c)]))),i=t.map(r=>r.label);return g(async()=>{const{writeExcelFile:r}=await import("./excel-export-1Ec38t20.js");return{writeExcelFile:r}},[]).then(({writeExcelFile:r})=>r(n,i,o))},d=e=>String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),A=(e,t,o,n)=>{const i=window.open("","_blank");if(!i)return!1;const r=t.map(l=>`<th>${d(l.label)}</th>`).join(""),c=e.map(l=>`<tr>${t.map(m=>`<td>${d(f(l,m))}</td>`).join("")}</tr>`).join("");return i.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${d(o)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 32px;
    color: #111827;
    background: #fff;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 13px;
  }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .meta { margin: 0 0 4px; color: #6b7280; font-size: 12px; }
  table { width: 100%; margin-top: 16px; border-collapse: collapse; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  th {
    border-bottom: 2px solid #111827;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #374151;
  }
  tbody tr:nth-child(even) { background: #f9fafb; }
  @media print { body { margin: 0; } }
  @page { margin: 20mm 14mm; }
</style>
</head>
<body>
<h1>${d(o)}</h1>
<p class="meta">Generated ${d(k(new Date().toISOString()))} · ${e.length} row${e.length===1?"":"s"}</p>
${n?`<p class="meta">${d(n)}</p>`:""}
<table>
<thead><tr>${r}</tr></thead>
<tbody>${c}</tbody>
</table>
<script>window.addEventListener("load", () => window.print());<\/script>
</body>
</html>`),i.document.close(),i.focus(),!0},B=({rows:e,columns:t,fileName:o,title:n,filterSummary:i,page:r,className:c})=>{const[l,m]=a.useState(!1),p=e.length===0,u=r?`${o}-page${r}`:o,b=r?`${n} (page ${r})`:n;return s.jsx("span",{title:p?"No rows to export":void 0,className:y("inline-flex",c),children:s.jsxs(w,{children:[s.jsx(v,{asChild:!0,children:s.jsxs(E,{variant:"outline",disabled:p||l,children:[s.jsx($,{className:"mr-2 h-4 w-4"}),l?"Exporting…":"Export"]})}),s.jsxs(j,{align:"end",children:[s.jsxs(h,{onSelect:()=>{m(!0),_(e,t,u).catch(()=>x.error("Excel export failed. Please try again.")).finally(()=>m(!1))},children:[s.jsx(T,{})," Excel (.xlsx)"]}),s.jsxs(h,{onSelect:()=>{A(e,t,b,i)||x.error("Pop-up blocked — allow pop-ups to export PDF.")},children:[s.jsx(L,{})," PDF"]})]})]})})};export{B as E,$ as F};
