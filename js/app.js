/* ════════════════════════════════════════════════════════════
   js/app.js — Login / App(路由) / FieldRoleView / OfficeRoleView /
               Admin / DispatchCalendar / PDFPage，掛載 ReactDOM
   ════════════════════════════════════════════════════════════ */

const DATE_STR = new Date().toLocaleDateString("zh-TW", { year:"numeric", month:"2-digit", day:"2-digit" });
const DATE_FILE = (() => { const t = new Date(); return `${t.getFullYear()}${String(t.getMonth()+1).padStart(2,"0")}${String(t.getDate()).padStart(2,"0")}`; })();

const ROLE_LABEL = { admin:"系統管理者", office:"辦公室人員", field:"現場人員" };

/* ═══════════════════ AI 判讀（通用版，適用任何 formKind） ═══════════════════ */
async function analyzeRecord(card, data) {
  const pics = extractPhotos(data, 2);
  const ctx = getSummaryRows(card, data).map(([k, v]) => `${k}：${Array.isArray(v) ? v.join("、") : v}`).join("\n");
  const rule = (card.aiJudge && card.aiJudge.rule) || "你是現場品管助理。";

  const build = usePics => {
    const c = [];
    if (usePics) pics.forEach(p => {
      const m = /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/.exec(p);
      if (m) c.push({ type:"image", source:{ type:"base64", media_type:m[1], data:m[2] } });
    });
    c.push({ type:"text", text: rule + "\n\n填報內容：\n" + (ctx || "（無明細）") + "\n\n" +
      (usePics && pics.length ? "" : "（本次無照片，請僅依文字判斷並說明此限制。）\n") +
      "請用繁體中文回覆，分兩段，總長不超過 120 字：\n【判讀】描述觀察到的狀況。\n【建議】給出一項最優先的處理建議。\n不要條列符號，不要開場白。" });
    return c;
  };

  const call = async usePics => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, messages:[{ role:"user", content: build(usePics) }] })
    });
    const raw = await res.text();
    if (!res.ok) throw new Error("HTTP " + res.status + "｜" + raw.slice(0, 220));
    let d; try { d = JSON.parse(raw); } catch (err) { throw new Error("回應非 JSON｜" + raw.slice(0, 160)); }
    if (d.error) throw new Error((d.error.type || "error") + "｜" + (d.error.message || ""));
    if (!Array.isArray(d.content)) throw new Error("回應缺少 content｜" + raw.slice(0, 160));
    const t = d.content.filter(c => c.type === "text").map(c => c.text).join("\n").trim();
    if (!t) throw new Error("回應內容為空");
    return t;
  };

  if (pics.length) {
    try { return { text: await call(true), mode:"照片＋文字" }; }
    catch (err) { const t = await call(false); return { text:t, mode:"純文字（照片判讀失敗：" + err.message.slice(0, 60) + "）" }; }
  }
  return { text: await call(false), mode:"純文字（本次無照片）" };
}

/* ═══════════════════ PDF 下載頁（沿用原設計） ═══════════════════ */
function PDFPage({ card, data, tenant, onBack }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const fileName = `${card.label}_${DATE_FILE}.pdf`;
  const summaryRows = getSummaryRows(card, data);

  const handleDownload = async () => {
    setLoading(true); setDone(false);
    const pdfArea = document.getElementById("pdf-area");
    const prevScrollX = window.scrollX, prevScrollY = window.scrollY;
    try {
      pdfArea.innerHTML = buildPDFHTML(card, data, tenant);
      pdfArea.style.display = "block"; pdfArea.style.position = "absolute"; pdfArea.style.left = "0"; pdfArea.style.top = "0"; pdfArea.style.width = PAGE_W + "px";
      window.scrollTo(0, 0);
      const pdf = new window.jspdf.jsPDF({ unit:"px", format:[PAGE_W, PAGE_H], orientation:"portrait", hotfixes:["px_scaling"] });
      const pageEls = pdfArea.querySelectorAll(".pdf-page");
      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], { scale:3, useCORS:true, allowTaint:true, logging:false, backgroundColor:"#ffffff", width:PAGE_W, height:PAGE_H, windowWidth:PAGE_W, windowHeight:PAGE_H, scrollX:0, scrollY:0 });
        if (i > 0) pdf.addPage([PAGE_W, PAGE_H], "portrait");
        pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, PAGE_W, PAGE_H);
      }
      pdf.save(fileName);
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("PDF 產生失敗，請確認網路連線正常後重試。\n錯誤：" + err.message);
    } finally {
      pdfArea.style.display = "none";
      window.scrollTo(prevScrollX, prevScrollY);
      setLoading(false);
    }
  };

  return e("div", { style: { minHeight:"100vh", background:"#F1F5F9", paddingBottom:90 } },
    e("div", { style: { background:"#1F2937", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10, boxShadow:"0 2px 8px rgba(0,0,0,0.3)" } },
      e("button", { onClick: onBack, style: { background:"none", border:"none", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 } }, "← 返回表單"),
      e("span", { style: { color:"#F97316", fontWeight:700, fontSize:14 } }, "📄 預覽 & 下載")
    ),
    e("div", { style: { padding:"16px 14px" } },
      e("div", { style: { background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:13, color:"#92400E", lineHeight:1.7 } },
        e("strong", null, "✅ 表單已儲存"), "，請確認資料無誤後，可再點擊底部按鈕下載 PDF。", e("br"),
        e("span", { style: { fontSize:11, color:"#B45309" } }, `📁 檔案名稱：${fileName}`)
      ),
      e("div", { style: { background:"#fff", borderRadius:10, padding:"24px 18px", boxShadow:"0 4px 20px rgba(0,0,0,0.1)", fontFamily:"Arial,'Microsoft JhengHei',sans-serif", fontSize:12, lineHeight:1.5, overflow:"hidden" } },
        e("div", { style: { textAlign:"center", fontSize:16, fontWeight:800, color:"#1F2937", paddingBottom:8, borderBottom:"2.5px solid #1F2937", marginBottom:6, letterSpacing:2 } }, `${tenant.name} — ${card.label}`),
        e("div", { style: { display:"flex", justifyContent:"space-between", fontSize:10, color:"#6B7280", paddingBottom:10, borderBottom:"1px solid #9CA3AF", marginBottom:14 } }, e("span", null, `填報日期：${DATE_STR}`), e("span", null, "系統版本：v2.0")),
        e("table", { style: { width:"100%", borderCollapse:"collapse" } },
          e("tbody", null, summaryRows.map((row, i) => e("tr", { key:i },
            e("td", { style: { border:"1px solid #CBD5E0", padding:"7px 9px", fontWeight:700, background:"#F8F9FA", fontSize:11, color:"#374151", width:110, verticalAlign:"top" } }, row[0]),
            e("td", { style: { border:"1px solid #CBD5E0", padding:"7px 9px", fontSize:12, whiteSpace:"pre-wrap" } }, Array.isArray(row[1]) ? row[1].join("、") : row[1])
          )))
        )
      )
    ),
    e("div", { style: { position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"2px solid #E5E7EB", padding:"12px 16px", display:"flex", gap:10 } },
      e("button", { onClick: onBack, style: { flex:1, padding:"13px", fontSize:14, fontWeight:600, borderRadius:12, border:"2px solid #E5E7EB", background:"#F9FAFB", cursor:"pointer", color:"#374151" } }, "← 返回修改"),
      e("button", { onClick: handleDownload, disabled: loading,
        style: { flex:2, padding:"13px", fontSize:15, fontWeight:700, borderRadius:12, border:"none", background: done ? "#059669" : loading ? "#9CA3AF" : "#F97316", color:"#fff", cursor: loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow: loading || done ? "none" : "0 4px 12px rgba(249,115,22,.4)" }
      }, loading ? "⏳ 產生中..." : done ? "✓ 下載完成！" : "⬇️ 確認下載 PDF")
    )
  );
}

/* ═══════════════════ 派工行事曆 ═══════════════════ */
const WD = ["日","一","二","三","四","五","六"];
const pad2 = n => String(n).padStart(2, "0");
const toDateStr = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());

function DispatchCalendar({ tenant, jobs, onAdd }) {
  const [mo, setMo] = useState(0);
  const [f, setF] = useState({ staff: tenant.staff[0], site: "", date: toDateStr(new Date()), note: "" });
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + mo);
  const y = base.getFullYear(), m = base.getMonth();
  const first = new Date(y, m, 1), startWd = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = []; for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const todayStr = toDateStr(new Date());
  const sites = tenant.sites || [];
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const canAdd = f.staff && f.site && f.date;
  const ctrlStyle = { ...S.input, padding:"7px 9px", fontSize:13, height:35, lineHeight:"19px", boxSizing:"border-box" };
  return e("div", null,
    e("div", { style: { display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end", background:"#1F2937", border:"1px solid #374151", borderRadius:10, padding:14, marginBottom:16 } },
      e("div", { style: { minWidth:130 } }, e("label", { style: { ...S.label, color:"#9CA3AF" } }, "日期"), e("input", { type:"date", value:f.date, onChange:ev=>set("date", ev.target.value), style: ctrlStyle })),
      e("div", { style: { minWidth:130 } }, e("label", { style: { ...S.label, color:"#9CA3AF" } }, "派工人員"), e("select", { value:f.staff, onChange:ev=>set("staff", ev.target.value), style: ctrlStyle }, tenant.staff.map(s=>e("option",{key:s},s)))),
      e("div", { style: { flex:"1.6 1 160px", minWidth:160 } }, e("label", { style: { ...S.label, color:"#9CA3AF" } }, "案場／據點"),
        sites.length
          ? e("select", { value:f.site, onChange:ev=>set("site", ev.target.value), style: ctrlStyle }, e("option",{value:""},"請選擇…"), sites.map(s=>e("option",{key:s},s)))
          : e("input", { value:f.site, onChange:ev=>set("site", ev.target.value), placeholder:"輸入案場名稱", style: ctrlStyle })),
      e("div", { style: { flex:"1.6 1 160px", minWidth:160 } }, e("label", { style: { ...S.label, color:"#9CA3AF" } }, "備註（選填）"), e("input", { value:f.note, onChange:ev=>set("note", ev.target.value), placeholder:"如：帶捲尺與樣品", style: ctrlStyle })),
      e("button", { disabled: !canAdd, onClick: () => { onAdd({ ...f }); setF(p => ({ ...p, site:"", note:"" })); },
        style: { padding:"10px 18px", fontSize:12.5, fontWeight:800, borderRadius:8, border:"none", background: canAdd ? "#F97316" : "#6B7280", color:"#1A0E06", cursor: canAdd ? "pointer" : "not-allowed", whiteSpace:"nowrap" } }, "＋ 指派")
    ),
    e("div", { style: { display:"flex", alignItems:"center", gap:12, marginBottom:12 } },
      e("button", { onClick:()=>setMo(v=>v-1), style: { color:"#9CA3AF", border:"1px solid #374151", borderRadius:6, padding:"5px 11px", fontSize:13, background:"none", cursor:"pointer" } }, "‹"),
      e("span", { style: { fontSize:14, fontWeight:800, letterSpacing:1, color:"#F3F4F6" } }, `${y} 年 ${m+1} 月`),
      e("button", { onClick:()=>setMo(v=>v+1), style: { color:"#9CA3AF", border:"1px solid #374151", borderRadius:6, padding:"5px 11px", fontSize:13, background:"none", cursor:"pointer" } }, "›"),
      mo !== 0 && e("button", { onClick:()=>setMo(0), style: { color:"#9CA3AF", border:"1px solid #374151", borderRadius:6, padding:"5px 11px", fontSize:12, background:"none", cursor:"pointer" } }, "回今月")
    ),
    e("div", { style: { display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5 } },
      WD.map(w => e("div", { key:w, style: { textAlign:"center", fontSize:11, color:"#6B7280", padding:"4px 0 8px" } }, w)),
      cells.map((d, i) => {
        if (d === null) return e("div", { key:i, style: { minHeight:70, opacity:.35 } });
        const ds = y + "-" + pad2(m+1) + "-" + pad2(d);
        const list = jobs.filter(j => j.date === ds);
        return e("div", { key:i, style: { minHeight:80, background:"#1F2937", border: ds === todayStr ? "1px solid #F97316" : "1px solid #374151", borderRadius:7, padding:"6px 6px 7px" } },
          e("div", { style: { fontSize:11, color:"#6B7280", marginBottom:5 } }, d),
          list.map(j => e("div", { key:j.id, style: { fontSize:10.5, lineHeight:1.5, borderRadius:4, padding:"2.5px 6px", marginBottom:3, background: j.status==="done" ? "rgba(76,143,110,.18)" : "rgba(201,150,63,.18)", color: j.status==="done" ? "#8FD6AC" : "#DDB565", textDecoration: j.status==="done" ? "line-through" : "none" } }, `${j.staff}→${j.site}`))
        );
      })
    )
  );
}

/* ═══════════════════ Admin：部門與表單管理 ═══════════════════ */
function AdminSectionTitle({ children }) {
  return e("div", { style: { fontWeight:800, fontSize:13, color:"#F97316", background:"#1F2937", border:"1px solid #374151", borderLeft:"3px solid #F97316", padding:"9px 12px", borderRadius:8, margin:"20px 0 12px", letterSpacing:0.5 } }, children);
}

function Admin({ tenant, onUpdateTenant }) {
  const [newDeptLabel, setNewDeptLabel] = useState("");
  const [addCardDept, setAddCardDept] = useState("");
  const [newCardLabel, setNewCardLabel] = useState("");
  const [newStaffName, setNewStaffName] = useState("");

  const addStaff = () => {
    const name = newStaffName.trim();
    if (!name) return;
    if (tenant.staff.includes(name)) { alert("此人員已存在於名單中。"); return; }
    onUpdateTenant(t => ({ ...t, staff: [...t.staff, name] }));
    setNewStaffName("");
  };
  const removeStaff = (name) => {
    if (tenant.staff.length <= 1) { alert("至少需保留一名人員，無法刪除。"); return; }
    if (!confirm(`確定要移除人員「${name}」嗎？`)) return;
    onUpdateTenant(t => ({ ...t, staff: t.staff.filter(s => s !== name) }));
  };
  const addDept = () => {
    if (!newDeptLabel.trim()) return;
    const id = "dept_" + uid("");
    onUpdateTenant(t => ({ ...t, departments: [...t.departments, { id, label:newDeptLabel.trim(), icon:"🗂️", color:"#6366F1", bg:"#EEF2FF" }] }));
    setNewDeptLabel("");
  };
  const removeDept = (id) => {
    if (!confirm("刪除此部門將一併移除底下所有表單卡片，確定嗎？")) return;
    onUpdateTenant(t => ({ ...t, departments: t.departments.filter(d => d.id !== id), cards: t.cards.filter(c => c.dept !== id) }));
  };
  const addCard = () => {
    if (!addCardDept || !newCardLabel.trim()) return;
    const id = "card_" + uid("");
    onUpdateTenant(t => ({ ...t, cards: [...t.cards, { id, dept:addCardDept, label:newCardLabel.trim(), icon:"📄", color:"#0EA5E9", bg:"#F0F9FF", desc:"（管理者新增的通用表單）", formKind:"generic",
      config:{ fields:[{ key:"title", label:"項目名稱" },{ key:"docDate", label:"日期" },{ key:"handler", label:"經辦人員" }], notesLabel:"備註", hasPhoto:true } }] }));
    setNewCardLabel("");
  };
  const removeCard = (id) => onUpdateTenant(t => ({ ...t, cards: t.cards.filter(c => c.id !== id) }));

  return e("div", null,
    e("div", { style: { fontSize:12, color:"#9CA3AF", lineHeight:1.9, background:"#1F2937", border:"1px solid #374151", borderLeft:"3px solid #F97316", borderRadius:6, padding:"12px 15px", marginBottom:16 } },
      "這是「", tenant.name, "」的部門與表單設定。新增/刪除部門、或在部門下新增「通用表單」卡片——不需要寫程式。",
      e("br"), "進階表單類型（如 TBM 簽到、品管壓測、工程回報等）需要工程師建置，這裡只能新增通用表單並編輯基本欄位。"
    ),
    e(AdminSectionTitle, null, "現場人員清單"),
    tenant.staff.map(s => e("div", { key:s, style: { display:"flex", alignItems:"center", gap:10, background:"#1F2937", border:"1px solid #374151", borderRadius:8, padding:"9px 12px", marginBottom:7 } },
      e("span", { style: { fontSize:18 } }, "👤"), e("span", { style: { flex:1, color:"#F3F4F6", fontSize:13, fontWeight:700 } }, s),
      e("button", { onClick:()=>removeStaff(s), style: { color:"#EF4444", background:"none", border:"none", fontSize:12, cursor:"pointer" } }, "刪除")
    )),
    e("div", { style: { display:"flex", gap:8, marginTop:8, marginBottom:20 } },
      e("input", { value:newStaffName, onChange:ev=>setNewStaffName(ev.target.value), placeholder:"新人員姓名", style: { ...S.input, padding:"8px 10px", fontSize:13, flex:1 } }),
      e("button", { onClick:addStaff, style: { padding:"8px 16px", fontSize:12.5, fontWeight:700, borderRadius:7, border:"1.5px dashed #F97316", background:"#3A2A18", color:"#F97316", cursor:"pointer", whiteSpace:"nowrap" } }, "＋ 新增人員")
    ),
    e(AdminSectionTitle, null, "部門清單"),
    tenant.departments.map(d => e("div", { key:d.id, style: { display:"flex", alignItems:"center", gap:10, background:"#1F2937", border:"1px solid #374151", borderRadius:8, padding:"9px 12px", marginBottom:7 } },
      e("span", { style: { fontSize:18 } }, d.icon), e("span", { style: { flex:1, color:"#F3F4F6", fontSize:13, fontWeight:700 } }, d.label),
      e("span", { style: { color:"#6B7280", fontSize:11 } }, `${tenant.cards.filter(c=>c.dept===d.id).length} 項表單`),
      e("button", { onClick:()=>removeDept(d.id), style: { color:"#EF4444", background:"none", border:"none", fontSize:12, cursor:"pointer" } }, "刪除")
    )),
    e("div", { style: { display:"flex", gap:8, marginTop:8, marginBottom:20 } },
      e("input", { value:newDeptLabel, onChange:ev=>setNewDeptLabel(ev.target.value), placeholder:"新部門名稱", style: { ...S.input, padding:"8px 10px", fontSize:13, flex:1 } }),
      e("button", { onClick:addDept, style: { padding:"8px 16px", fontSize:12.5, fontWeight:700, borderRadius:7, border:"1.5px dashed #F97316", background:"#3A2A18", color:"#F97316", cursor:"pointer", whiteSpace:"nowrap" } }, "＋ 新增部門")
    ),
    e(AdminSectionTitle, null, "新增通用表單卡片"),
    e("div", { style: { display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" } },
      e("select", { value:addCardDept, onChange:ev=>setAddCardDept(ev.target.value), style: { ...S.input, padding:"8px 10px", fontSize:13, flex:"1 1 140px" } }, e("option",{value:""},"選擇部門…"), tenant.departments.map(d=>e("option",{key:d.id,value:d.id},d.label))),
      e("input", { value:newCardLabel, onChange:ev=>setNewCardLabel(ev.target.value), placeholder:"表單名稱", style: { ...S.input, padding:"8px 10px", fontSize:13, flex:"1 1 160px" } }),
      e("button", { onClick:addCard, disabled: !addCardDept || !newCardLabel.trim(), style: { padding:"8px 16px", fontSize:12.5, fontWeight:700, borderRadius:7, border:"1.5px dashed #F97316", background:"#3A2A18", color:"#F97316", cursor:"pointer", whiteSpace:"nowrap" } }, "＋ 新增表單卡片")
    ),
    e(AdminSectionTitle, null, "所有表單卡片"),
    tenant.cards.map(c => e("div", { key:c.id, style: { display:"flex", alignItems:"center", gap:10, background:"#1F2937", border:"1px solid #374151", borderRadius:8, padding:"9px 12px", marginBottom:7 } },
      e("span", { style: { fontSize:16 } }, c.icon), e("span", { style: { flex:1, color:"#F3F4F6", fontSize:13 } }, `${c.label}　`, e("span",{style:{color:"#6B7280",fontSize:11}}, `(${(tenant.departments.find(d=>d.id===c.dept)||{}).label || "?"} · ${c.formKind})`)),
      c.formKind === "generic" && e("button", { onClick:()=>removeCard(c.id), style: { color:"#EF4444", background:"none", border:"none", fontSize:12, cursor:"pointer" } }, "刪除")
    ))
  );
}

/* ═══════════════════ 現場人員：填表 / 我的派工 / 我的紀錄 ═══════════════════ */
function FieldRoleView({ tenant, records, dispatches, notes, onSubmitRecord, onCompleteDispatch }) {
  const [staffName, setStaffName] = useState(tenant.staff[0]);
  const [tab, setTab] = useState("form");
  const [page, setPage] = useState("dashboard"); // dashboard | deptForms | form | preview
  const [deptId, setDeptId] = useState(null);
  const [cardId, setCardId] = useState(null);
  const [formData, setFormData] = useState({});
  const [savedMsg, setSavedMsg] = useState(null);

  useEffect(() => { setStaffName(tenant.staff[0]); setPage("dashboard"); setFormData({}); }, [tenant.id]);

  const card = tenant.cards.find(c => c.id === cardId);
  const dept = tenant.departments.find(d => d.id === deptId);
  const getData = (id) => { const c = tenant.cards.find(x => x.id === id); const d = formData[id] || defaultDataFor(c, tenant); return c && c.formKind === "dynamicSchema" && !d.__staff ? { ...d, __staff: staffName } : d; };
  const setData = (id, updater) => setFormData(prev => {
    const c = tenant.cards.find(x => x.id === id);
    const cur = prev[id] || defaultDataFor(c, tenant);
    const next = typeof updater === "function" ? updater(cur) : updater;
    return { ...prev, [id]: next };
  });

  const myDispatches = dispatches.filter(d => d.staff === staffName);
  const myRecords = records.filter(r => r.staffName === staffName);
  const todo = myDispatches.filter(d => d.status !== "done").length;

  const saveRecord = (d) => {
    onSubmitRecord({ card, data: d, staffName });
  };

  const goBack = () => { setPage(page === "form" || page === "preview" ? "deptForms" : "dashboard"); };

  let body;
  if (page === "preview" && card) {
    body = e(PDFPage, { card, data: getData(cardId), tenant, onBack: () => setPage("form") });
  } else if (page === "form" && card && card.formKind === "survey" && !tenant.caseData) {
    body = e("div", { style: { padding:40, textAlign:"center", color:"#6B7280" } }, "案件資料載入中或缺少 caseData…");
  } else if (page === "form" && card) {
    const missRequired = card.formKind === "dynamicSchema" ? (card.config.schema.fields || []).filter(f => f.required && !getData(cardId)[f.id]).map(f => f.label) : [];
    body = e("div", { style: { minHeight:"70vh", background:"#F1F5F9", paddingBottom:90 } },
      e("div", { style: { background:"#1F2937", padding:"14px 18px", display:"flex", alignItems:"center", gap:14 } },
        e("button", { onClick:()=>setPage("deptForms"), style: { background:"none", border:"none", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" } }, "← 返回"),
        e("div", { style: { width:34, height:34, borderRadius:9, background:card.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 } }, card.icon),
        e("span", { style: { color:"#fff", fontWeight:700, fontSize:16 } }, card.label)
      ),
      e("div", { style: { padding:"16px 14px" } },
        e("div", { style: S.card },
          card.formKind === "dynamicSchema" && e(Sel, { label:"填報人員", value:staffName, onChange:setStaffName, options:tenant.staff }),
          renderFormBody(card, getData(cardId), upd => setData(cardId, upd), tenant.caseData, tenant),
          savedMsg && e("div", { style: { marginTop:14, padding:"11px 13px", background:"#ECFDF5", border:"1.5px solid #A7F3D0", borderRadius:9, fontSize:13, color:"#065F46" } }, "✓ 已送出　", savedMsg)
        )
      ),
      e("div", { style: { position:"fixed", bottom:0, left:0, right:0, background:"#fff", borderTop:"2px solid #E5E7EB", padding:"12px 16px" } },
        card.noPdf
          ? e("button", { disabled: missRequired.length > 0, onClick: () => {
              saveRecord(getData(cardId));
              setSavedMsg(nowClock());
              setFormData(prev => ({ ...prev, [cardId]: defaultDataFor(card, tenant) }));
              window.scrollTo({ top:0, behavior:"smooth" });
            }, style: { width:"100%", padding:"15px", fontSize:16, fontWeight:700, borderRadius:12, border:"none", background: missRequired.length ? "#9CA3AF" : "linear-gradient(135deg,#F97316 0%,#EA580C 100%)", color:"#fff", cursor: missRequired.length ? "not-allowed" : "pointer" } }, missRequired.length ? "尚缺：" + missRequired.join("、") : "送　出")
          : e("button", { onClick: () => { saveRecord(getData(cardId)); setPage("preview"); }, style: { width:"100%", padding:"15px", fontSize:16, fontWeight:700, borderRadius:12, border:"none", background:"linear-gradient(135deg,#F97316 0%,#EA580C 100%)", color:"#fff", cursor:"pointer" } }, "📄 儲存並產生 PDF")
      )
    );
  } else if (page === "deptForms" && dept) {
    const deptCards = tenant.cards.filter(c => c.dept === dept.id);
    body = e("div", { style: { minHeight:"70vh", background:"#111827" } },
      e("div", { style: { background:"#1F2937", padding:"20px 18px", display:"flex", alignItems:"center", gap:14 } },
        e("button", { onClick:()=>setPage("dashboard"), style: { background:"none", border:"none", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" } }, "← 返回"),
        e("div", { style: { width:38, height:38, borderRadius:10, background:dept.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 } }, dept.icon),
        e("div", null, e("div", { style: { color:"#fff", fontWeight:800, fontSize:17 } }, dept.label), e("div", { style: { color:"#9CA3AF", fontSize:11 } }, `共 ${deptCards.length} 項表單`))
      ),
      e("div", { style: { padding:"20px 14px", display:"flex", flexDirection:"column", gap:12 } },
        deptCards.map(c => e("button", { key:c.id, onClick:()=>{ setCardId(c.id); setPage("form"); setSavedMsg(null); },
          style: { background:"#1F2937", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:14, padding:18, cursor:"pointer", display:"flex", alignItems:"center", gap:14, width:"100%", textAlign:"left" } },
          e("div", { style: { width:52, height:52, borderRadius:12, background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 } }, c.icon),
          e("div", { style: { flex:1 } }, e("div", { style: { color:"#F9FAFB", fontSize:17, fontWeight:700, marginBottom:3 } }, c.label), e("div", { style: { color:"#9CA3AF", fontSize:12, lineHeight:1.4 } }, c.desc)),
          e("span", { style: { color:c.color, fontSize:22 } }, "›")
        ))
      )
    );
  } else {
    body = e("div", { style: { minHeight:"70vh", background:"#111827" } },
      e("div", { style: { padding:"20px 14px" } },
        e("div", { style: { color:"#F3F4F6", fontSize:14, fontWeight:700, marginBottom:12 } }, "🏢 選擇部門"),
        e("div", { style: { display:"flex", flexDirection:"column", gap:12 } },
          tenant.departments.map(d => {
            const count = tenant.cards.filter(c => c.dept === d.id).length;
            return e("button", { key:d.id, onClick:()=>{ setDeptId(d.id); setPage("deptForms"); },
              style: { background:"#1F2937", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:14, padding:18, cursor:"pointer", display:"flex", alignItems:"center", gap:14, width:"100%", textAlign:"left" } },
              e("div", { style: { width:56, height:56, borderRadius:14, background:d.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 } }, d.icon),
              e("div", { style: { flex:1 } }, e("div", { style: { color:"#F9FAFB", fontSize:16, fontWeight:800, marginBottom:3 } }, d.label), e("div", { style: { color:"#9CA3AF", fontSize:12 } }, `${count} 項表單`)),
              e("span", { style: { color:d.color, fontSize:22 } }, "›")
            );
          })
        )
      )
    );
  }

  return e("div", null,
    e("div", { style: { display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#0B1220" } },
      e("span", { style: { color:"#9CA3AF", fontSize:12 } }, "填報人員"),
      e("select", { value:staffName, onChange:ev=>setStaffName(ev.target.value), style: { background:"#1F2937", color:"#F3F4F6", border:"1px solid #374151", borderRadius:6, padding:"6px 10px", fontSize:13 } }, tenant.staff.map(s=>e("option",{key:s},s)))
    ),
    e("div", { style: { display:"flex", gap:6, padding:"0 14px", marginTop:10, marginBottom:4, borderBottom:"1px solid #1F2937" } },
      [["form","填寫表單"],["jobs",`我的派工${todo?`（${todo}）`:""}`],["mine",`我的紀錄${myRecords.length?`（${myRecords.length}）`:""}`]].map(([k,l]) =>
        e("button", { key:k, onClick:()=>{ setTab(k); if (k==="form") setPage("dashboard"); }, style: { padding:"8px 15px", fontSize:12.5, fontWeight:600, color: tab===k ? "#F97316" : "#9CA3AF", borderBottom: tab===k ? "2px solid #F97316" : "2px solid transparent", background:"none", border:"none", cursor:"pointer" } }, l)
      )
    ),
    tab === "form" && body,
    tab === "jobs" && e("div", { style: { padding:"16px 14px" } },
      myDispatches.length === 0
        ? e("div", { style: { border:"1px dashed #374151", borderRadius:10, padding:"44px 20px", textAlign:"center", color:"#6B7280", fontSize:13, lineHeight:2 } }, e("div", null, "目前沒有指派"), e("div", { style: { fontSize:12 } }, "辦公室人員在「派工行事曆」指派工作後，會出現在這裡"))
        : [...myDispatches].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0).map(d => e("div", { key:d.id, style: { display:"flex", alignItems:"center", gap:10, background:"#1F2937", border:"1px solid #374151", borderRadius:8, padding:"10px 13px", marginBottom:8, opacity: d.status==="done"?.55:1 } },
          e("span", { style: { fontSize:11, color:"#6B7280", fontFamily:"monospace", minWidth:74 } }, d.date),
          e("div", { style: { flex:1 } }, e("div", { style: { color:"#F3F4F6", fontSize:13 } }, d.site), d.note && e("div", { style: { color:"#9CA3AF", fontSize:11.5, marginTop:2 } }, d.note)),
          d.status === "done" ? e("span", { style: { fontSize:10.5, fontWeight:700, padding:"2px 9px", borderRadius:10, background:"rgba(76,143,110,.2)", color:"#7FC49E" } }, "已完成")
            : e("button", { onClick:()=>onCompleteDispatch(d.id), style: { fontSize:11.5, color:"#F97316", border:"1px solid #F97316", borderRadius:5, padding:"4px 10px", background:"none", cursor:"pointer" } }, "回報完成")
        ))
    ),
    tab === "mine" && e("div", { style: { padding:"16px 14px" } },
      myRecords.length === 0
        ? e("div", { style: { border:"1px dashed #374151", borderRadius:10, padding:"44px 20px", textAlign:"center", color:"#6B7280", fontSize:13, lineHeight:2 } }, e("div", null, "尚無紀錄"), e("div", { style: { fontSize:12 } }, "送出後會出現在這裡，方便之後回查自己填過什麼"))
        : myRecords.map(r => { const c = tenant.cards.find(x=>x.id===r.cardId); return e("div", { key:r.id, style: { background:"#1F2937", border:"1px solid #374151", borderRadius:10, padding:"14px 16px", marginBottom:10 } },
            e("div", { style: { display:"flex", justifyContent:"space-between", marginBottom:9 } }, e("span", { style: { fontSize:14.5, fontWeight:700, color:"#F3F4F6" } }, (c||{}).label || "（表單）"), e("span", { style: { fontSize:11, color:"#6B7280" } }, r.time)),
            e("dl", { style: { display:"grid", gridTemplateColumns:"auto 1fr", gap:"4px 14px", fontSize:12.5 } },
              c && getSummaryRows(c, r.data).slice(0,4).map(([k,v],j)=>e(F,{key:j},e("dt",{style:{color:"#6B7280"}},k),e("dd",{style:{color:"#D1D5DB"}},Array.isArray(v)?v.join("、"):v)))
            )
          ); })
    )
  );
}

/* ═══════════════════ 辦公室/管理者：即時看板 ═══════════════════ */
function OfficeRoleView({ tenant, role, records, dispatches, notes, onAddDispatch, onAiResult, onUpdateTenant }) {
  const [tab, setTab] = useState("board");
  const [aiState, setAiState] = useState({}); // recordId -> "load" | undefined

  const run = async (rec) => {
    setAiState(s => ({ ...s, [rec.id]: "load" }));
    const card = tenant.cards.find(c => c.id === rec.cardId);
    try { const out = await analyzeRecord(card, rec.data); onAiResult(rec.id, { ai: out.text, aiMode: out.mode, aiErr: null }); }
    catch (err) { onAiResult(rec.id, { aiErr: err.message }); }
    finally { setAiState(s => ({ ...s, [rec.id]: undefined })); }
  };

  return e("div", { style: { display:"flex", gap:18, alignItems:"flex-start", flexWrap:"wrap", padding:"14px" } },
    e("div", { style: { flex:"1 1 480px", minWidth:0 } },
      e("div", { style: { display:"flex", gap:6, marginBottom:14, borderBottom:"1px solid #1F2937" } },
        [["board","即時看板"],["cal","派工行事曆"]].concat(role==="admin"?[["admin","部門與表單管理"]]:[]).map(([k,l]) =>
          e("button", { key:k, onClick:()=>setTab(k), style: { padding:"8px 15px", fontSize:12.5, fontWeight:600, color: tab===k?"#F97316":"#9CA3AF", borderBottom: tab===k?"2px solid #F97316":"2px solid transparent", background:"none", border:"none", cursor:"pointer" } }, l)
        )
      ),
      tab === "cal" && e(DispatchCalendar, { tenant, jobs:dispatches, onAdd:onAddDispatch }),
      tab === "admin" && e(Admin, { tenant, onUpdateTenant }),
      tab === "board" && e(F, null,
        e("div", { style: { display:"flex", gap:10, alignItems:"center", marginBottom:12, flexWrap:"wrap" } },
          e("span", { style: { display:"inline-flex", alignItems:"center", gap:6, fontSize:11.5, color:"#4C8F6E" } }, "● LIVE 即時連動"),
          e("span", { style: { fontSize:11.5, color:"#9CA3AF" } }, `${tenant.name} · 共 ${records.length} 筆`)
        ),
        records.length === 0
          ? e("div", { style: { border:"1px dashed #374151", borderRadius:10, padding:"44px 20px", textAlign:"center", color:"#6B7280", fontSize:13, lineHeight:2 } }, e("div", null, "尚無回報"), e("div", { style: { fontSize:12 } }, "切換為現場人員身分填一張表送出，這裡會即時浮現"))
          : records.map((r, i) => {
              const card = tenant.cards.find(c => c.id === r.cardId);
              if (!card) return null;
              const pics = extractPhotos(r.data, 6);
              const flagged = isRecordFlagged(card, r.data);
              return e("div", { key:r.id, style: { background:"#1F2937", border:"1px solid #374151", borderRadius:10, padding:"14px 16px", marginBottom:10 } },
                e("div", { style: { display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:10, marginBottom:9, flexWrap:"wrap" } },
                  e("span", { style: { fontSize:14.5, fontWeight:700, color:"#F3F4F6" } }, card.label),
                  e("span", { style: { fontSize:11, color:"#6B7280" } }, `${r.time} · ${r.staffName}`)
                ),
                e("div", { style: { marginBottom:8 } }, flagged
                  ? e("span", { style: { fontSize:10.5, fontWeight:700, padding:"2px 9px", borderRadius:10, background:"rgba(196,82,59,.22)", color:"#E58873" } }, "含異常/不合格項")
                  : e("span", { style: { fontSize:10.5, fontWeight:700, padding:"2px 9px", borderRadius:10, background:"rgba(76,143,110,.2)", color:"#7FC49E" } }, "正常")
                ),
                e("dl", { style: { display:"grid", gridTemplateColumns:"auto 1fr", gap:"4px 14px", fontSize:12.5, marginBottom: pics.length?10:0 } },
                  getSummaryRows(card, r.data).map(([k,v],j)=>e(F,{key:j},e("dt",{style:{color:"#6B7280"}},k),e("dd",{style:{color:"#D1D5DB",whiteSpace:"pre-wrap"}},Array.isArray(v)?v.join("、"):v)))
                ),
                pics.length > 0 && e("div", { style: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 } }, pics.map((p,j)=>e("img",{key:j,src:p,style:{width:70,height:70,objectFit:"cover",borderRadius:5,border:"1px solid #374151"}}))),
                card.aiJudge && e("div", { style: { marginTop:11, borderTop:"1px solid #374151", paddingTop:11 } },
                  e("div", { style: { display:"flex", alignItems:"center", gap:8, fontSize:11, color:"#C9963F", letterSpacing:2, fontWeight:700, marginBottom:7 } },
                    "AI 判讀", r.aiMode && e("span", { style: { color:"#6B7280", fontWeight:400, letterSpacing:0 } }, `（${r.aiMode}）`),
                    aiState[r.id] !== "load" && e("button", { onClick:()=>run(r), style: { marginLeft:"auto", fontSize:11.5, color:"#9CA3AF", border:"1px solid #374151", borderRadius:5, padding:"4px 10px", background:"none", cursor:"pointer" } }, r.ai || r.aiErr ? "重新判讀" : "執行判讀")
                  ),
                  aiState[r.id] === "load" && e("div", { style: { fontSize:12, color:"#6B7280" } }, "分析中…"),
                  r.ai && e("div", { style: { fontSize:12.5, color:"#CFD9D3", lineHeight:1.75, whiteSpace:"pre-wrap" } }, r.ai),
                  r.aiErr && e("div", { style: { color:"#E58873", fontSize:11.5, marginTop:8, lineHeight:1.7, background:"rgba(196,82,59,.09)", border:"1px solid rgba(196,82,59,.3)", borderRadius:5, padding:"8px 10px", wordBreak:"break-all" } }, "判讀失敗：", r.aiErr),
                  !aiState[r.id] && !r.ai && !r.aiErr && e("div", { style: { fontSize:12, color:"#6B7280" } }, "尚未判讀")
                )
              );
            })
      )
    ),
    tab === "board" && e("div", { style: { width:310, flex:"none" } },
      e("div", { style: { background:"#1B2C22", border:"1px solid #2E4A38", borderRadius:10, overflow:"hidden", position:"sticky", top:16 } },
        e("div", { style: { background:"#06C755", color:"#062F16", fontSize:12, fontWeight:800, padding:"8px 13px", letterSpacing:1, display:"flex", alignItems:"center", gap:7 } }, "● LINE 通知（模擬）"),
        e("div", { style: { padding:12, maxHeight:"64vh", overflowY:"auto", background:"#12211A" } },
          notes.length === 0
            ? e("div", { style: { color:"#4E6B5A", fontSize:12, textAlign:"center", padding:"30px 10px", lineHeight:1.9 } }, "尚無通知", e("br"), "當現場填報出現異常/不合格判定時，此處會即時推播")
            : notes.map(n => e("div", { key:n.id, style: { background:"#fff", color:"#1a1a1a", borderRadius:"4px 12px 12px 12px", padding:"10px 12px", fontSize:12.5, lineHeight:1.7, marginBottom:9 } },
                e("div", { style: { fontWeight:800, color:"#B03A28", marginBottom:4, fontSize:12 } }, "⚠ 現場異常通報"),
                e("div", null, n.body),
                e("div", { style: { fontSize:10, color:"#8a8a8a", marginTop:6 } }, n.time)
              ))
        )
      )
    )
  );
}

/* ═══════════════════ 登入 ═══════════════════ */
function Login({ onGo }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const tryLogin = () => {
    for (const t of TENANTS) {
      const acc = t.accounts.find(a => a.code === code && a.password === password);
      if (acc) { onGo(t.id, acc.role); return; }
    }
    setErr("編號或密碼錯誤，請確認後再試一次。");
  };

  return e("div", { style: { maxWidth:640, margin:"6vh auto", padding:"0 20px" } },
    e("h1", { style: { fontSize:22, fontWeight:800, letterSpacing:1, marginBottom:6, color:"#F3F4F6" } }, "現場作業數位平台"),
    e("p", { style: { fontSize:12.5, color:"#9CA3AF", lineHeight:1.9, marginBottom:20 } }, "輸入公司編號與密碼登入。帳號已內含身分別（現場／辦公室／管理），登入後自動進入對應畫面。這是示範用途的前端明碼比對，非正式後端身分驗證。"),
    err && e("div", { style: { background:"rgba(196,82,59,.12)", border:"1px solid rgba(196,82,59,.4)", color:"#E58873", borderRadius:8, padding:"10px 13px", fontSize:12.5, marginBottom:14 } }, err),
    e("div", { style: { marginBottom:14 } }, e("label", { style: S.label }, "公司編號"), e("input", { value:code, onChange:ev=>setCode(ev.target.value), style: S.input, placeholder:"例如：T04-F" })),
    e("div", { style: { marginBottom:14 } }, e("label", { style: S.label }, "密碼"), e("input", { type:"password", value:password, onChange:ev=>setPassword(ev.target.value), style: S.input })),
    e("button", { onClick:tryLogin, disabled: !code || !password, style: { width:"100%", padding:"13px", fontSize:15, fontWeight:800, borderRadius:10, border:"none", background: (!code||!password) ? "#6B7280" : "#F97316", color:"#1A0E06", cursor: (!code||!password) ? "not-allowed" : "pointer", marginBottom:24 } }, "進　入"),
    e("div", { style: { fontSize:11, color:"#F97316", letterSpacing:2, fontWeight:700, marginBottom:10 } }, "示範帳號快速登入"),
    e("div", { style: { display:"flex", flexDirection:"column", gap:8 } },
      TENANTS.map(t => e("div", { key:t.id, style: { background:"#1F2937", border:"1px solid #374151", borderRadius:8, padding:"10px 13px" } },
        e("div", { style: { fontSize:13, fontWeight:700, color:"#F3F4F6", marginBottom:7 } }, `${t.name}（${t.industry}）`),
        e("div", { style: { display:"flex", gap:7, flexWrap:"wrap" } },
          t.accounts.map(a => e("button", { key:a.code, onClick:()=>{ setCode(a.code); setPassword(a.password); setErr(""); },
            style: { padding:"6px 12px", borderRadius:16, border:"1px solid #374151", background:"#111827", color:"#9CA3AF", fontSize:12, cursor:"pointer" } }, ROLE_LABEL[a.role]))
        )
      ))
    )
  );
}

/* ═══════════════════ App 根元件 ═══════════════════ */
function App() {
  const [ready, setReady] = useState(false);
  const [sess, setSess] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [records, setRecords] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [notesByTenant, setNotesByTenant] = useState({});

  useEffect(() => {
    (async () => {
      const [session, schemas, recs, disps] = await Promise.all([
        DB.get("session", "current"), DB.getAll("schemas"), DB.getAll("records"), DB.getAll("dispatches")
      ]);
      const ov = {}; schemas.forEach(s => { ov[s.id] = { departments: s.departments, cards: s.cards, staff: s.staff }; });
      setOverrides(ov);
      setRecords(recs.sort((a, b) => b.ts - a.ts));
      setDispatches(disps);
      if (session) setSess({ tenantId: session.tenantId, role: session.role });
      setReady(true);
    })();
  }, []);

  if (!ready) return e("div", { style: { minHeight:"100vh", background:"#0F1512" } });

  const getTenant = (tenantId) => {
    const base = TENANTS.find(t => t.id === tenantId);
    const ov = overrides[tenantId];
    return ov ? { ...base, departments: ov.departments, cards: ov.cards, staff: ov.staff || base.staff } : base;
  };

  const login = (tenantId, role) => {
    setSess({ tenantId, role });
    DB.put("session", { id:"current", tenantId, role });
  };
  const logout = () => { setSess(null); DB.delete("session", "current"); };

  const onUpdateTenant = (tenantId, updater) => {
    const cur = getTenant(tenantId);
    const next = updater(cur);
    const rec = { id: tenantId, departments: next.departments, cards: next.cards, staff: next.staff };
    setOverrides(o => ({ ...o, [tenantId]: { departments: rec.departments, cards: rec.cards, staff: rec.staff } }));
    DB.put("schemas", rec);
  };

  const onSubmitRecord = (tenantId, { card, data, staffName }) => {
    const rec = { id: uid("R"), tenantId, cardId: card.id, formKind: card.formKind, staffName, data, time: nowClock(), ts: Date.now(), ai:null, aiMode:null, aiErr:null };
    setRecords(rs => [rec, ...rs]);
    DB.put("records", rec);
    if (isRecordFlagged(card, data)) {
      const body = getSummaryRows(card, data).slice(0, 3).map(([k, v]) => `${k}：${Array.isArray(v) ? v.join("、") : v}`).join("\n") + `\n填報：${staffName}`;
      const note = { id: uid("N"), time: new Date().toLocaleString("zh-TW", { hour12:false }), body: `${card.label}\n${body}` };
      setNotesByTenant(n => ({ ...n, [tenantId]: [note, ...(n[tenantId] || [])] }));
    }
  };

  const onAiResult = (recordId, patch) => {
    setRecords(rs => rs.map(r => r.id === recordId ? { ...r, ...patch } : r));
    DB.get("records", recordId).then(r => r && DB.put("records", { ...r, ...patch }));
  };

  const addDispatch = (tenantId, d) => {
    const rec = { ...d, id: uid("D"), tenantId, status:"assigned", createdAt: nowClock() };
    setDispatches(ds => [...ds, rec]);
    DB.put("dispatches", rec);
  };
  const completeDispatch = (id) => {
    setDispatches(ds => ds.map(d => d.id === id ? { ...d, status:"done", completedAt: nowClock() } : d));
    DB.get("dispatches", id).then(d => d && DB.put("dispatches", { ...d, status:"done", completedAt: nowClock() }));
  };

  if (!sess) return e(Login, { onGo: login });

  const tenant = getTenant(sess.tenantId);
  const tenantRecords = records.filter(r => r.tenantId === tenant.id);
  const tenantDispatches = dispatches.filter(d => d.tenantId === tenant.id);
  const tenantNotes = notesByTenant[tenant.id] || [];

  return e("div", { style: { minHeight:"100vh" } },
    e("div", { style: { display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderBottom:"1px solid #1F2937", flexWrap:"wrap" } },
      e("span", { style: { fontSize:16, fontWeight:800, letterSpacing:1, color:"#F3F4F6" } }, "現場作業數位平台"),
      e("div", { style: { marginLeft:"auto", display:"flex", alignItems:"center", gap:10, fontSize:12, color:"#9CA3AF" } },
        e("span", null, tenant.name),
        e("span", { style: { background:"#1F2937", border:"1px solid #374151", borderRadius:14, padding:"4px 12px", fontSize:11.5, fontWeight:700, color:"#F97316" } }, ROLE_LABEL[sess.role]),
        e("button", { onClick:logout, style: { fontSize:11.5, color:"#9CA3AF", border:"1px solid #374151", borderRadius:5, padding:"4px 10px", background:"none", cursor:"pointer" } }, "切換身分")
      )
    ),
    sess.role === "field" && e(FieldRoleView, { tenant, records:tenantRecords, dispatches:tenantDispatches, notes:tenantNotes,
      onSubmitRecord: (payload) => onSubmitRecord(tenant.id, payload), onCompleteDispatch: completeDispatch }),
    (sess.role === "office" || sess.role === "admin") && e(OfficeRoleView, { tenant, role:sess.role, records:tenantRecords, dispatches:tenantDispatches, notes:tenantNotes,
      onAddDispatch: (d) => addDispatch(tenant.id, d), onAiResult, onUpdateTenant: (updater) => onUpdateTenant(tenant.id, updater) })
  );
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(err => console.error("Service Worker 註冊失敗:", err));
  });
}

try {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(e(App));
} catch (err) {
  console.error("React掛載失敗:", err);
  document.getElementById("root").innerHTML = "<div style='color:white;padding:20px;'>應用程式初始化失敗，請檢查網路 CDN 連線。</div>";
}
