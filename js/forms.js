/* ════════════════════════════════════════════════════════════
   js/forms.js — 各 formKind 對應的表單元件、預設資料、PDF builder
   ════════════════════════════════════════════════════════════ */

const PROGRESS = ["放樣作業","預埋作業","電氣箱設備作業","佈線作業","燈具設備安裝","TR盤體作業","DMX設備安裝及測試","系統設備安裝及測試","調光/驗收","雜項工程"];
const STAFF    = ["翁明騰","蔡璧澤","曾玉麟","黃國隆","郭毓斌"];
const EXEC     = ["預埋作業","運送作業(線路/箱體/材料)","佈線作業(連通線/入箱線/訊號線)","尺寸丈量及標註","放樣作業","盤體作業(接線/整理)","打除作業","管路及接線盒清潔、移位","燈具安裝及測試","系統設備安裝及測試","調光","圖說標註","現場缺失"];
const EXEC_CUSTOM = "自行填入(手動輸入)";
const HOURS = Array.from({length:24},(_,i)=>String(i).padStart(2,"0"));
const MINS  = ["00","15","30","45"];
const SIG_COLS = ["填報人員","專案審核","主管審核"];
const DESIGN_MEETING_PROGRESS = ["概念發展","設計圖面繪製","施工圖面及規範作業","工程執行"];

function getCalculatedHoursText(startH, startM, endH, endM) {
  if (!startH || !startM || !endH || !endM) return "—";
  let start = parseInt(startH, 10) * 60 + parseInt(startM, 10);
  let end   = parseInt(endH, 10)   * 60 + parseInt(endM, 10);
  if (end < start) end += 24 * 60;
  let totalMinutes = end - start;
  const restStart = 12 * 60, restEnd = 13 * 60;
  let overlap = 0;
  let o1s = Math.max(start, restStart), o1e = Math.min(end, restEnd);
  if (o1s < o1e) overlap += (o1e - o1s);
  let o2s = Math.max(start, restStart + 1440), o2e = Math.min(end, restEnd + 1440);
  if (o2s < o2e) overlap += (o2e - o2s);
  let actualMinutes = Math.max(0, totalMinutes - overlap);
  const hrs = Math.floor(actualMinutes / 60), mins = actualMinutes % 60;
  return mins > 0 ? `${hrs} 小時 ${mins} 分` : `${hrs} 小時`;
}

function scoreOf(value) { const m = /\((\d+)\)/.exec(value || ""); return m ? parseInt(m[1], 10) : 0; }
function sumScore(arr) { return (arr || []).reduce((s, r) => s + scoreOf(r && r.value), 0); }
function gradeLabel(score, ranges) { for (const r of ranges) if (score >= r.min && score <= r.max) return r.grade; return "—"; }
const OPTICAL_RANGES = [{ min:26, max:30, grade:"A合格" }, { min:20, max:25, grade:"B尚可" }, { min:10, max:19, grade:"C不合格" }];
const QUALITY_RANGES = [{ min:33, max:36, grade:"A合格" }, { min:24, max:32, grade:"B尚可" }, { min:12, max:23, grade:"C不合格" }];

/* ═══ 工程部三個既有表單（原樣沿用） ═══ */
function SurveyForm({ data, setData, caseData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const projectNames = [...caseData.案件列表.map(c => c.案件名稱), ...CUSTOM_TRIGGER_PROJECTS, "自行填入(手動輸入)"];
  const isCustomTrigger = data.project === "自行填入(手動輸入)" || CUSTOM_TRIGGER_PROJECTS.includes(data.project);
  const findCase = projectName => caseData.案件列表.find(c => c.案件名稱 === projectName);
  const getLocationNames = projectName => {
    if (CUSTOM_TRIGGER_PROJECTS.includes(projectName) || projectName === "自行填入(手動輸入)") return [];
    const c = findCase(projectName);
    return c ? c.樓層區域清單.map(l => l.樓層區域名稱) : [];
  };
  const getEquipmentTypes = (projectName, locationName) => {
    if (CUSTOM_TRIGGER_PROJECTS.includes(projectName) || projectName === "自行填入(手動輸入)") return [];
    const c = findCase(projectName);
    const loc = c && c.樓層區域清單.find(l => l.樓層區域名稱 === locationName);
    return loc ? loc.設備類型清單 : [];
  };
  const calculateDuration = () => getCalculatedHoursText(data.timeStartH, data.timeStartM, data.timeEndH, data.timeEndM);
  const updateItem = (index, k, v) => { const ni = [...data.items]; ni[index] = { ...ni[index], [k]: v }; set("items", ni); };
  const updateItemPhoto = (itemIdx, photoIdx, base64Str) => {
    const ni = [...data.items]; const np = [...ni[itemIdx].photos]; np[photoIdx] = base64Str; ni[itemIdx].photos = np; set("items", ni);
  };
  const addItem = () => set("items", [...data.items, { photos: [null, null], location: "", lightModel: "", execType: "", customExec: "" }]);
  const removeItem = (index) => { if (data.items.length <= 1) return; set("items", data.items.filter((_, i) => i !== index)); };

  return e(F, null,
    e(Sel, { label: "工程案名", value: data.project, onChange: v => {
      const isTrigger = v === "自行填入(手動輸入)" || CUSTOM_TRIGGER_PROJECTS.includes(v);
      setData(p => ({ ...p, project: v, customProject: v === "自行填入(手動輸入)" ? "" : undefined,
        contact: isTrigger ? "" : (findCase(v) || {}).現場聯絡人 || "", items: [{ photos: [null, null], location: "", lightModel: "", execType: "", customExec: "" }] }));
    }, options: projectNames }),
    data.project === "自行填入(手動輸入)" && e(Txt, { label: "請輸入自訂工程案名", value: data.customProject || "", onChange: v => set("customProject", v), placeholder: "請輸入實際的工程案件名稱" }),
    isCustomTrigger
      ? e(Txt, { label: "現場聯絡人 (手動輸入)", value: data.contact, onChange: v => set("contact", v), placeholder: "請輸入聯絡人姓名" })
      : e("div", { style: { marginBottom: 15, padding: "11px 13px", background: "#F3F4F6", borderRadius: 9, border: "1.5px solid #E5E7EB" } },
          e("span", { style: { ...S.label, display: "inline" } }, "現場聯絡人 "),
          e("span", { style: { fontSize: 16, fontWeight: 700, color: "#1F2937" } }, data.contact || "—")
        ),
    e(Sel, { label: "作業階段", value: data.progress, onChange: v => set("progress", v), options: PROGRESS }),
    e(Sel, { label: "施工人員", value: data.staff,    onChange: v => set("staff", v),    options: STAFF }),
    e("div", { style: { marginBottom: 15 } },
      e("div", { style: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" } },
        e("div", { style: { flex: "2 1 220px" } },
          e("label", { style: S.label }, "施工時間"),
          e("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
            e("select", { value: data.timeStartH, onChange: ev => set("timeStartH", ev.target.value), style: { flex: 1, padding: "10px 4px", fontSize: 13, borderRadius: 8, border: "1.5px solid #D1D5DB", textAlign: "center" } }, e("option", { value: "" }, "時"), HOURS.map(v => e("option", { key: v, value: v }, v))),
            e("select", { value: data.timeStartM, onChange: ev => set("timeStartM", ev.target.value), style: { flex: 1, padding: "10px 4px", fontSize: 13, borderRadius: 8, border: "1.5px solid #D1D5DB", textAlign: "center" } }, e("option", { value: "" }, "分"), MINS.map(v => e("option", { key: v, value: v }, v))),
            e("span", { style: { color: "#9CA3AF", padding: "0 2px" } }, "—"),
            e("select", { value: data.timeEndH, onChange: ev => set("timeEndH", ev.target.value), style: { flex: 1, padding: "10px 4px", fontSize: 13, borderRadius: 8, border: "1.5px solid #D1D5DB", textAlign: "center" } }, e("option", { value: "" }, "時"), HOURS.map(v => e("option", { key: v, value: v }, v))),
            e("select", { value: data.timeEndM, onChange: ev => set("timeEndM", ev.target.value), style: { flex: 1, padding: "10px 4px", fontSize: 13, borderRadius: 8, border: "1.5px solid #D1D5DB", textAlign: "center" } }, e("option", { value: "" }, "分"), MINS.map(v => e("option", { key: v, value: v }, v)))
          )
        ),
        e("div", { style: { flex: "1 1 120px", padding: "11px 8px", background: "#FFF7ED", borderRadius: 8, border: "1.5px solid #FED7AA", textAlign: "center" } },
          e("div", { style: { fontSize: 10, color: "#C2410C", fontWeight: 700, marginBottom: 2 } }, "自動計算總工時"),
          e("div", { style: { fontSize: 13, fontWeight: 700, color: "#9A3412" } }, calculateDuration())
        )
      )
    ),
    e(Txt, { label: "摘要", value: data.summary, onChange: v => set("summary", v), placeholder: "請輸入此回報檔案的摘要說明...", multi: true }),
    e("div", { style: { margin: "20px 0 10px 0", borderBottom: "2px dashed #E5E7EB" } }),
    data.items.map((item, idx) => e("div", { key: idx, style: { background: "#F9FAFB", border: "1px solid #E5E7EB", padding: 14, borderRadius: 12, marginBottom: 16, position: "relative" } },
      e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
        e("span", { style: { fontSize: 13, fontWeight: 800, color: "#F97316" } }, `📍 記錄群組 #${idx + 1}`),
        data.items.length > 1 && e("button", { onClick: () => removeItem(idx), style: { background: "none", border: "none", color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "🛑 刪除此組")
      ),
      e("div", { style: { display: "flex", gap: 12, marginBottom: 15, flexWrap: "wrap" } },
        e(PhotoUpload, { label: "現場照片 1", src: item.photos[0], onImageChange: str => updateItemPhoto(idx, 0, str) }),
        e(PhotoUpload, { label: "現場照片 2 (選填)", src: item.photos[1], onImageChange: str => updateItemPhoto(idx, 1, str) })
      ),
      isCustomTrigger
        ? e(Txt, { label: "施工位置 (手動輸入)", value: item.location, onChange: v => updateItem(idx, "location", v), placeholder: "例如：3F 辦公室" })
        : e(Sel, { label: "施工位置", value: item.location, onChange: v => { const ni = [...data.items]; ni[idx].location = v; ni[idx].lightModel = ""; set("items", ni); }, options: data.project ? getLocationNames(data.project) : [], placeholder: data.project ? "請選擇位置" : "請先選擇工程案名" }),
      isCustomTrigger
        ? e(Txt, { label: "燈具型號 (手動輸入)", value: item.lightModel, onChange: v => updateItem(idx, "lightModel", v), placeholder: "例如：LED-T5-01" })
        : e(Sel, { label: "燈具型號", value: item.lightModel, onChange: v => updateItem(idx, "lightModel", v), options: (data.project && item.location) ? getEquipmentTypes(data.project, item.location) : [], placeholder: item.location ? "請選擇燈具" : "請先選擇施工位置" }),
      e(Sel, { label: "執行內容", value: item.execType, onChange: v => { const ni = [...data.items]; ni[idx].execType = v; if (v !== EXEC_CUSTOM) ni[idx].customExec = ""; set("items", ni); }, options: [...EXEC, EXEC_CUSTOM] }),
      item.execType === EXEC_CUSTOM && e(Txt, { label: "執行內容 (手動輸入)", value: item.customExec || "", onChange: v => updateItem(idx, "customExec", v), placeholder: "請輸入實際的執行內容" })
    )),
    e("button", { onClick: addItem, style: { width: "100%", padding: "10px", fontSize: 14, fontWeight: 700, borderRadius: 9, border: "1.5px dashed #F97316", background: "#FFF7ED", color: "#F97316", cursor: "pointer", marginTop: 5 } }, "＋ 新增一組施工位置與照片")
  );
}

function MeetingForm({ data, setData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  return e(F, null,
    e(Sel, { label: "會議類型", value: data.meetingType, onChange: v => set("meetingType", v), options: ["圖面盤整溝通","現場機電執行前討論","執行問題討論","需求整合會議","審查會議"] }),
    e(Txt, { label: "會議主題", value: data.topic, onChange: v => set("topic", v), placeholder: "輸入會議主題" }),
    e(Txt, { label: "與會人員", value: data.attendees, onChange: v => set("attendees", v), placeholder: "輸入與會人員（以逗號分隔）" }),
    e(Txt, { label: "決議追蹤事項", value: data.resolution, onChange: v => set("resolution", v), placeholder: "記錄決議事項與追蹤項目...", multi: true }),
    e(Photo, { label: "會議現場照片", photo: data.photo, onCapture: v => set("photo", v) })
  );
}

function DesignMeetingForm({ data, setData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const timeSelStyle = { flex: 1, padding: "10px 4px", fontSize: 13, borderRadius: 8, border: "1.5px solid #D1D5DB", textAlign: "center" };
  return e(F, null,
    e("div", { style: { marginBottom: 15 } },
      e("label", { style: S.label }, "會議時間"),
      e("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } },
        e("input", { value: data.meetingDate, onChange: ev => set("meetingDate", ev.target.value), placeholder: "會議日期 YYYY/MM/DD", style: { flex: "1 1 140px", padding: "11px 13px", fontSize: 15, borderRadius: 9, border: "1.5px solid #D1D5DB", background: "#fff", fontFamily: "inherit" } }),
        e("div", { style: { display: "flex", gap: 4, alignItems: "center", flex: "2 1 240px" } },
          e("select", { value: data.meetingStartH, onChange: ev => set("meetingStartH", ev.target.value), style: timeSelStyle }, e("option", { value: "" }, "時"), HOURS.map(v => e("option", { key: v, value: v }, v))),
          e("select", { value: data.meetingStartM, onChange: ev => set("meetingStartM", ev.target.value), style: timeSelStyle }, e("option", { value: "" }, "分"), MINS.map(v => e("option", { key: v, value: v }, v))),
          e("span", { style: { color: "#9CA3AF", padding: "0 2px" } }, "—"),
          e("select", { value: data.meetingEndH, onChange: ev => set("meetingEndH", ev.target.value), style: timeSelStyle }, e("option", { value: "" }, "時"), HOURS.map(v => e("option", { key: v, value: v }, v))),
          e("select", { value: data.meetingEndM, onChange: ev => set("meetingEndM", ev.target.value), style: timeSelStyle }, e("option", { value: "" }, "分"), MINS.map(v => e("option", { key: v, value: v }, v)))
        )
      )
    ),
    e(Txt, { label: "會議地點", value: data.location, onChange: v => set("location", v), placeholder: "輸入會議地點" }),
    e(Txt, { label: "與會人員", value: data.attendees, onChange: v => set("attendees", v), placeholder: "輸入與會人員（以逗號分隔）" }),
    e(Txt, { label: "記錄人員", value: data.recorder, onChange: v => set("recorder", v), placeholder: "輸入記錄人員姓名" }),
    e(Txt, { label: "項目名稱", value: data.projectName, onChange: v => set("projectName", v), placeholder: "輸入項目/案件名稱" }),
    e(Sel, { label: "項目進程", value: data.progress, onChange: v => set("progress", v), options: DESIGN_MEETING_PROGRESS }),
    e(Txt, { label: "會議主旨", value: data.topic, onChange: v => set("topic", v), placeholder: "輸入會議主旨" }),
    e(Txt, { label: "會議內容", value: data.content, onChange: v => set("content", v), placeholder: "記錄會議討論內容...", multi: true }),
    e(Txt, { label: "會議後執行內容", value: data.postActions, onChange: v => set("postActions", v), placeholder: "記錄會議後續執行事項...", multi: true }),
    e("div", { style: { marginTop: 10, padding: "11px 13px", background: "#FDF2F8", border: "1.5px solid #FBCFE8", borderRadius: 9, fontSize: 12, color: "#9D174D", lineHeight: 1.7 } }, "＊簽核區將於下載的 PDF 中提供整頁簽署框，供對外確認與意見回覆使用。")
  );
}

function InstallForm({ data, setData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  return e(F, null,
    e(Sel, { label: "施工區域", value: data.zone, onChange: v => set("zone", v), options: ["A區","B區","C區"] }),
    e(Txt, { label: "材料批號/品名", value: data.material, onChange: v => set("material", v), placeholder: "輸入材料批號或品名" }),
    e(Txt, { label: "自主檢查人員", value: data.inspector, onChange: v => set("inspector", v), placeholder: "輸入檢查人員姓名" }),
    e("div", { style: { marginBottom: 15 } },
      e("div", { style: { display: "flex", gap: 10 } },
        ["合格","不合格"].map(opt => e("button", { key: opt, onClick: () => set("checkResult", opt),
          style: { flex: 1, padding: "12px 8px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700,
            border: `2px solid ${data.checkResult === opt ? (opt === "合格" ? "#059669" : "#DC2626") : "#E5E7EB"}`,
            background: data.checkResult === opt ? (opt === "合格" ? "#ECFDF5" : "#FEF2F2") : "#fff",
            color: data.checkResult === opt ? (opt === "合格" ? "#065F46" : "#991B1B") : "#374151" }
        }, opt === "合格" ? "✓ 合格" : "✗ 不合格"))
      )
    ),
    e(Txt, { label: "備註說明", value: data.note, onChange: v => set("note", v), placeholder: "補充說明事項...", multi: true }),
    e(Photo, { label: "安裝完工照片", photo: data.photo, onCapture: v => set("photo", v) })
  );
}

function GenericForm({ config, data, setData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const renderField = (f) => f.type === "select"
    ? e(Sel, { key: f.key, label: f.label, value: data[f.key] || "", onChange: v => set(f.key, v), options: f.options || [] })
    : e(Txt, { key: f.key, label: f.label, value: data[f.key] || "", onChange: v => set(f.key, v), placeholder: f.placeholder || "", multi: f.multi });
  return e(F, null,
    (config.fields || []).map(renderField),
    config.items && e(ItemsTable, { label: config.items.label || "項目明細", columns: config.items.columns, rows: data.items || [], onChange: v => set("items", v), aggregate: config.items.aggregate }),
    (config.fieldsAfter || []).map(renderField),
    e(Txt, { label: config.notesLabel || "備註", value: data.note || "", onChange: v => set("note", v), multi: true, placeholder: "補充說明事項..." }),
    config.hasPhoto && e(Photo, { label: config.photoLabel || "相關照片", photo: data.photo, onCapture: v => set("photo", v) })
  );
}

const SELF_CHECK_ITEMS = [
  "訂製品審查確認發包圖說（經各部門主官管及工程專案核定圖說）",
  "結構技師審查核可訂製品圖說（牽涉設備結構安全需具有結構技師審查認證）",
  "工程專案會同勘驗通知（涉結構施作及安裝流程項目，需事先提出會同勘驗）",
  "攜帶訂製品相關附件材質（例：玻璃、雪花石）樣品（依規範內容攜帶）",
  "攜帶訂製品相關表面處理材質（例：烤漆、電鍍）色卡（依規範內容攜帶）",
  "攜帶訂製品安裝照明光源樣品（依規範內容攜帶）",
  "攜帶固定於訂製品之附加燈具設備樣品（依規範內容攜帶）",
  "攜帶固定於訂製品之附加配件樣品（依規範內容攜帶）",
  { text: "攜帶尺寸量測設備（例：捲尺、游標卡尺）＊必要攜帶之查核量測設備＊", opts: ["確認","未確認"] },
  "攜帶照明量測設備（例：照度、輝度、色度）（依勘驗計畫攜帶設備）",
  "工廠確認勘驗進度內容完整度是否符合計畫表（勘驗計畫需提供附件佐證）"
];
const EVAL_ITEMS = [
  "訂製品尺寸是否符合發包圖說?（需進行量測拍攝紀錄）",
  "訂製品本體結構是否符合發包圖說?（需進行拍攝記錄）",
  "訂製品其附件材質（例：玻璃、雪花石）是否有會同組裝勘驗?（需進行拍攝記錄）",
  "訂製品其附件材質是否符合發包圖說?（如上題未提供跳過）",
  "訂製品其附件材質與本體安裝尺寸是否吻合?（如上題未提供跳過）",
  "訂製品本體固定結構是否符合發包圖說?（需進行拍攝記錄）",
  "訂製品材質是否符合發包圖說?（需進行拍攝記錄）",
  "訂製品焊接結構是否符合（安全、美觀）標準?（需進行拍攝記錄）",
  "訂製品表面處理材質（例：烤漆、電鍍）是否符合發包圖說?（需進行拍攝記錄）",
  "訂製品表面處理材質細緻度是否符合標準?（如上題不合格跳過）",
  "訂製品表面處理材質顏色是否符合標準?（如上題不合格跳過）",
  "訂製品與光源固定結構是否符合發包圖說?（需與光源樣品試安裝進行拍攝記錄）",
  "訂製品與附加燈具設備固定結構是否符合發包圖說?（需與附加燈具設備樣品試安裝進行拍攝記錄）"
];
const OPTICAL_ITEMS = [
  "照明設備色溫是否準確?（CIE、BIN比較分析）","照明配光是否符合規劃使用?（IES與照明設備實際測試比對）",
  "照明照度均勻性是否符合規劃使用?（照明設備實際測試比對）","照明防眩是否符合規劃使用?（照明設備實際測試比對）",
  "照明設備色溫一致性是否良好?（不同W數及角度規格，經封裝後，光源色溫是否能保持一致）","照明設備CRI是否符合規劃使用?（依光譜儀檢測評分）",
  "照明設備控制方式是否符合規劃使用?（照明設備實際操作評分）","照明設備藍光危害檢測是否符合標準?（依光譜儀檢測評分）",
  "照明設備是否有頻閃問題?（依光譜儀檢測評分）","照明設備效率是否符合使用需求?（超頻使用或效能過低評估）"
];
const QUALITY_ITEMS = [
  "照明設備尺寸是否符合規劃使用?","照明設備固定方式是否符合規劃使用?","照明設備固定方式是否符合調光使用?",
  "照明設備結構是否符合調光使用?","照明設備透鏡安裝品質?","照明設備結構材質品質?","照明設備光源散熱結構品質?",
  "照明設備出線方式品質?","照明設備接線配件品質?","照明設備防眩配件是否符合規劃應用?","照明設備防眩配件效果?","照明設備防眩配件品質?"
];

function CustomInspectForm({ data, setData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const updateCheck = (field) => (idx, key, val) => { const arr = [...data[field]]; arr[idx] = { ...arr[idx], [key]: val }; set(field, arr); };
  const updateSitePhoto = (idx, key, val) => { const arr = [...data.sitePhotos]; arr[idx] = { ...arr[idx], [key]: val }; set("sitePhotos", arr); };
  return e(F, null,
    e(SectionTitle, null, "專案訂製品檢測紀錄"),
    e(Txt, { label: "案名", value: data.caseName, onChange: v => set("caseName", v), placeholder: "請輸入案名" }),
    e(Txt, { label: "燈具符號", value: data.lightSymbol, onChange: v => set("lightSymbol", v) }),
    e(Txt, { label: "燈具類型", value: data.lightType, onChange: v => set("lightType", v) }),
    e(Txt, { label: "安裝位置", value: data.location, onChange: v => set("location", v) }),
    e(Txt, { label: "測試目的", value: data.testPurpose, onChange: v => set("testPurpose", v), multi: true }),
    e(SectionTitle, null, "檢測人員清單"),
    e(Txt, { label: "廠驗日期", value: data.inspectDate, onChange: v => set("inspectDate", v), placeholder: "YYYY/MM/DD" }),
    e(Txt, { label: "廠驗廠商", value: data.inspectVendor, onChange: v => set("inspectVendor", v) }),
    e(Txt, { label: "廠驗人員", value: data.inspectors, onChange: v => set("inspectors", v) }),
    e(Txt, { label: "專案設計師", value: data.designer, onChange: v => set("designer", v) }),
    e(Txt, { label: "工程人員", value: data.engineer, onChange: v => set("engineer", v) }),
    e(Txt, { label: "業主人員", value: data.owner, onChange: v => set("owner", v) }),
    e(Txt, { label: "廠商人員", value: data.vendorStaff, onChange: v => set("vendorStaff", v) }),
    e(SectionTitle, null, "勘驗紀錄照片"),
    e("div", { style: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 } },
      data.sitePhotos.map((p, idx) => e("div", { key: idx, style: { width: "46%" } },
        e(PhotoUpload, { label: `勘驗照片 ${idx + 1}`, src: p.photo, onImageChange: v => updateSitePhoto(idx, "photo", v) }),
        e("input", { value: p.position, onChange: ev => updateSitePhoto(idx, "position", ev.target.value), placeholder: "拍攝位置說明", style: { ...S.input, marginTop: 6, fontSize: 12, padding: "7px 9px" } })
      ))
    ),
    e(SectionTitle, null, "訂製品廠驗自主檢查表（業前準備核可後執行，規範無相關內容請選擇無需求）"),
    e(RatingChecklist, { items: SELF_CHECK_ITEMS, defaultOptions: ["確認","未確認","無需求"], data: data.selfCheck, onChange: updateCheck("selfCheck") }),
    e(SectionTitle, null, "訂製品廠驗評估表（依規範內容填寫，規範無相關內容請選擇未提供）"),
    e(RatingChecklist, { items: EVAL_ITEMS, defaultOptions: ["合格","不合格","未提供"], data: data.evalCheck, onChange: updateCheck("evalCheck") }),
    e(Txt, { label: "審查意見", value: data.reviewComment, onChange: v => set("reviewComment", v), multi: true, placeholder: "填寫審查意見..." }),
    e("div", { style: { marginTop: 10, padding: "11px 13px", background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 9, fontSize: 12, color: "#1E40AF", lineHeight: 1.7 } }, "＊「行前計畫確認簽核」與「審查意見簽核」將於下載的 PDF 中提供實體簽名欄位，供董事長、行政部主管、設計部主管、工程部主管、設計部專案、工程部專案現場簽署。")
  );
}

function LightInspectForm({ data, setData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const updateCheck = (field) => (idx, key, val) => { const arr = [...data[field]]; arr[idx] = { ...arr[idx], [key]: val }; set(field, arr); };
  const updateArrPhoto = (field) => (idx, val) => { const arr = [...data[field]]; arr[idx] = val; set(field, arr); };
  const updateBodyPhoto = (key, val) => set("bodyPhotos", { ...data.bodyPhotos, [key]: val });
  const s1 = sumScore(data.opticalCheck), s2 = sumScore(data.qualityCheck);
  return e(F, null,
    e(SectionTitle, null, "專案設備測試使用紀錄"),
    e(Txt, { label: "案名", value: data.caseName, onChange: v => set("caseName", v) }),
    e(Txt, { label: "燈具符號", value: data.lightSymbol, onChange: v => set("lightSymbol", v) }),
    e(Txt, { label: "安裝位置", value: data.location, onChange: v => set("location", v) }),
    e(Txt, { label: "測試目的", value: data.testPurpose, onChange: v => set("testPurpose", v), multi: true }),
    e(Txt, { label: "測試日期", value: data.testDate, onChange: v => set("testDate", v), placeholder: "YYYY/MM/DD" }),
    e(Txt, { label: "測試人員", value: data.tester, onChange: v => set("tester", v) }),
    e(Txt, { label: "記錄人員", value: data.recorder, onChange: v => set("recorder", v) }),
    e(Txt, { label: "參與人員", value: data.participants, onChange: v => set("participants", v), multi: true }),
    e(SectionTitle, null, "照明設備規格"),
    e(Txt, { label: "廠牌", value: data.brand, onChange: v => set("brand", v) }),
    e(Txt, { label: "燈具型號", value: data.modelNo, onChange: v => set("modelNo", v) }),
    e(Txt, { label: "型錄位置", value: data.catalogLoc, onChange: v => set("catalogLoc", v) }),
    e(Txt, { label: "燈具形式", value: data.lightForm, onChange: v => set("lightForm", v) }),
    e(Txt, { label: "光源形式", value: data.sourceForm, onChange: v => set("sourceForm", v) }),
    e(Txt, { label: "光源批號", value: data.sourceBatch, onChange: v => set("sourceBatch", v) }),
    e(Txt, { label: "燈具材質", value: data.lightMaterial, onChange: v => set("lightMaterial", v) }),
    e(Txt, { label: "W數", value: data.wattage, onChange: v => set("wattage", v), placeholder: "單位：W" }),
    e(Txt, { label: "光通量", value: data.luminousFlux, onChange: v => set("luminousFlux", v), placeholder: "單位：Lm" }),
    e(Txt, { label: "中心光強度", value: data.centerIntensity, onChange: v => set("centerIntensity", v), placeholder: "單位：Cd" }),
    e(Txt, { label: "開孔尺寸", value: data.apertureSize, onChange: v => set("apertureSize", v), placeholder: "單位：mm" }),
    e(Txt, { label: "色溫度", value: data.colorTemp, onChange: v => set("colorTemp", v), placeholder: "單位：K" }),
    e(Txt, { label: "演色性 CRI ≧", value: data.cri, onChange: v => set("cri", v) }),
    e(Txt, { label: "CRI ≧ R9", value: data.cri_r9, onChange: v => set("cri_r9", v) }),
    e(Txt, { label: "防護等級 IP", value: data.protectionLevel, onChange: v => set("protectionLevel", v) }),
    e(Txt, { label: "控制方式", value: data.controlMethod, onChange: v => set("controlMethod", v), placeholder: "例如：I/O、0-10V、DALI" }),
    e(Txt, { label: "輸入電壓", value: data.inputVoltage, onChange: v => set("inputVoltage", v) }),
    e(Txt, { label: "IES 資訊/連結", value: data.iesInfo, onChange: v => set("iesInfo", v), multi: true }),
    e(SectionTitle, null, "測試照片"),
    e("div", { style: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" } }, data.testPhotos.map((p, idx) => e(PhotoUpload, { key: idx, label: `測試照片 ${idx + 1}`, src: p, onImageChange: v => updateArrPhoto("testPhotos")(idx, v) }))),
    e(SectionTitle, null, "燈具光學品質評估表"),
    e(RatingChecklist, { items: OPTICAL_ITEMS, defaultOptions: ["高品質(3)","可接受(2)","差(1)"], data: data.opticalCheck, onChange: updateCheck("opticalCheck") }),
    e("div", { style: { marginBottom: 16, padding: "10px 13px", background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 9, fontSize: 13, color: "#9A3412", fontWeight: 700 } }, `目前評分：${s1} ／ 30　等級：${gradeLabel(s1, OPTICAL_RANGES)}（A合格26~30、B尚可20~24、C不合格10~19）`),
    e(Txt, { label: "審查意見", value: data.reviewComment1, onChange: v => set("reviewComment1", v), multi: true }),
    e(SectionTitle, null, "光譜儀檢測紀錄照片"),
    e("div", { style: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 } }, data.spectroPhotos.map((p, idx) => e(PhotoUpload, { key: idx, label: `檢測照片 ${idx + 1}`, src: p, onImageChange: v => updateArrPhoto("spectroPhotos")(idx, v) }))),
    e(SectionTitle, null, "原廠型錄尺寸圖"),
    e(PhotoUpload, { label: "型錄尺寸圖", src: data.catalogDrawing, onImageChange: v => set("catalogDrawing", v) }),
    e(SectionTitle, null, "燈具品質評估表（需依實際樣品進行評估）"),
    e(RatingChecklist, { items: QUALITY_ITEMS, defaultOptions: ["高品質(3)","可接受(2)","差(1)"], data: data.qualityCheck, onChange: updateCheck("qualityCheck") }),
    e("div", { style: { marginBottom: 16, padding: "10px 13px", background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 9, fontSize: 13, color: "#9A3412", fontWeight: 700 } }, `目前評分：${s2} ／ 36　等級：${gradeLabel(s2, QUALITY_RANGES)}（A合格33~36、B尚可24~32、C不合格12~23）`),
    e(Txt, { label: "審查意見", value: data.reviewComment2, onChange: v => set("reviewComment2", v), multi: true }),
    e(SectionTitle, null, "燈具實體照片"),
    e("div", { style: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 } },
      [["top","俯視圖"],["side","側視圖"],["bottom","下視圖"],["wireOutlet","燈體出線位置"],["base","固定腳座"],["adjustJoint","燈具調整關節處"],["powerConnector","電源接線頭"]].map(([key, label]) => e(PhotoUpload, { key, label, src: data.bodyPhotos[key], onImageChange: v => updateBodyPhoto(key, v) }))
    ),
    e(SectionTitle, null, "燈具配件照片"),
    e("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } }, data.accessoryPhotos.map((p, idx) => e(PhotoUpload, { key: idx, label: `配件照片 ${idx + 1}`, src: p, onImageChange: v => updateArrPhoto("accessoryPhotos")(idx, v) })))
  );
}

/* ═══ 派工原型沿用：動態欄位 schema 表單（T01/T02） ═══ */
function DynamicSchemaForm({ config, data, setData, tenantStaff }) {
  const schema = config.schema;
  const set = (id, v) => setData(p => ({ ...p, [id]: typeof v === "function" ? v(p[id]) : v }));
  return e(F, null,
    (schema.fields || []).map(f => f.type === "group"
      ? e(SchemaGroup, { key: f.id, f, schema, rows: data[f.id] || [{}], onChange: v => set(f.id, v) })
      : e(SchemaField, { key: f.id, f, schema, val: data[f.id], onChange: set })
    )
  );
}

/* ═══ 新增：TBM 工安簽到 ═══ */
const TBM_PPE = ["安全帽","安全帶","氣體偵測器","反光背心","防護手套"];

function TbmForm({ data, setData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const togglePpe = (item) => set("ppe", (data.ppe || []).includes(item) ? data.ppe.filter(x => x !== item) : [...(data.ppe || []), item]);
  return e(F, null,
    e(Txt, { label: "填報人員", value: data.reporter, onChange: v => set("reporter", v), placeholder: "填寫本次簽到人員姓名" }),
    e(Txt, { label: "案名/施工地點", value: data.projectName, onChange: v => set("projectName", v) }),
    e(GPSField, { label: "GPS 簽到定位", value: data.gps, onCapture: v => set("gps", v) }),
    e(Photo, { label: "現場照片", photo: data.sitePhoto, onCapture: v => set("sitePhoto", v) }),
    e(SectionTitle, null, "防護具 Check"),
    e("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 15 } },
      TBM_PPE.map(item => e("button", { key: item, type: "button", onClick: () => togglePpe(item), style: pillStyle((data.ppe || []).includes(item)) }, item))
    ),
    e(Txt, { label: "現場危險告知內容", value: data.hazardNote, onChange: v => set("hazardNote", v), multi: true, placeholder: "本日作業危險告知事項..." }),
    e(SignaturePad, { label: "危險告知簽名確認", value: data.signature, onCapture: v => set("signature", v) })
  );
}

/* ═══ 新增：品管壓測表 ═══ */
function PressureTestForm({ data, setData }) {
  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const updateNdt = (idx, key, val) => { const arr = [...(data.ndt || [])]; arr[idx] = { ...arr[idx], [key]: val }; set("ndt", arr); };
  const addNdt = () => set("ndt", [...(data.ndt || []), { weldNo: "", welder: "", method: "RT", result: "" }]);
  const removeNdt = (idx) => set("ndt", (data.ndt || []).filter((_, i) => i !== idx));
  return e(F, null,
    e(Txt, { label: "案名", value: data.projectName, onChange: v => set("projectName", v) }),
    e(Txt, { label: "試壓區段編號", value: data.section, onChange: v => set("section", v) }),
    e(Sel, { label: "試驗介質", value: data.medium, onChange: v => set("medium", v), options: ["空氣","氮氣","水"] }),
    e(Txt, { label: "測試壓力（kg/cm²）", value: data.testPressure, onChange: v => set("testPressure", v) }),
    e("div", { style: { display: "flex", gap: 12 } },
      e("div", { style: { flex: 1 } }, e(Txt, { label: "持壓開始時間", value: data.holdStart, onChange: v => set("holdStart", v), placeholder: "YYYY/MM/DD HH:mm" })),
      e("div", { style: { flex: 1 } }, e(Txt, { label: "持壓結束時間", value: data.holdEnd, onChange: v => set("holdEnd", v), placeholder: "YYYY/MM/DD HH:mm" }))
    ),
    e("div", { style: { display: "flex", gap: 12, marginBottom: 15, flexWrap: "wrap" } },
      e(PhotoUpload, { label: "壓測錶（試壓前）", src: data.gaugeBefore, onImageChange: v => set("gaugeBefore", v) }),
      e(PhotoUpload, { label: "壓測錶（試壓後）", src: data.gaugeAfter, onImageChange: v => set("gaugeAfter", v) })
    ),
    e(SectionTitle, null, "NDT 銲接檢測（RT/UT）"),
    (data.ndt || []).map((row, idx) => e("div", { key: idx, style: { background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10 } },
      e("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } },
        e("span", { style: { fontSize: 12, fontWeight: 700, color: "#6B7280" } }, `銲頭 #${idx + 1}`),
        e("button", { type: "button", onClick: () => removeNdt(idx), style: { background: "none", border: "none", color: "#EF4444", fontSize: 11, cursor: "pointer" } }, "🛑 刪除")
      ),
      e("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } },
        e(Txt, { label: "銲頭編號", value: row.weldNo, onChange: v => updateNdt(idx, "weldNo", v) }),
        e(Txt, { label: "銲工姓名/證號", value: row.welder, onChange: v => updateNdt(idx, "welder", v) }),
        e(Sel, { label: "檢測方式", value: row.method, onChange: v => updateNdt(idx, "method", v), options: ["RT","UT"] }),
        e(Sel, { label: "結果", value: row.result, onChange: v => updateNdt(idx, "result", v), options: ["合格","不合格"] })
      )
    )),
    e("button", { type: "button", onClick: addNdt, style: { width: "100%", padding: "9px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "1.5px dashed #9CA3AF", background: "#F9FAFB", color: "#6B7280", cursor: "pointer", marginBottom: 15 } }, "＋ 新增銲頭檢測紀錄"),
    e(SectionTitle, null, "合格判定"),
    e(JudgeChips, { value: data.finalResult, onChange: v => set("finalResult", v) }),
    e("div", { style: { marginTop: 15 } }, e(SignaturePad, { label: "檢測人員簽核", value: data.signature, onCapture: v => set("signature", v) }))
  );
}

/* ═══ 預設資料工廠 ═══ */
function customInspectDefault() {
  return { caseName:"", lightSymbol:"", lightType:"", location:"", testPurpose:"", inspectDate:"", inspectVendor:"", inspectors:"", designer:"", engineer:"", owner:"", vendorStaff:"",
    sitePhotos: Array.from({ length: 6 }, () => ({ photo: null, position: "" })), selfCheck: SELF_CHECK_ITEMS.map(() => ({ value:"", note:"" })), evalCheck: EVAL_ITEMS.map(() => ({ value:"", note:"" })), reviewComment: "" };
}
function lightInspectDefault() {
  return { caseName:"", lightSymbol:"", location:"", testPurpose:"", testDate:"", tester:"", recorder:"", participants:"",
    brand:"", modelNo:"", catalogLoc:"", lightForm:"", sourceForm:"LED", sourceBatch:"", lightMaterial:"", wattage:"", luminousFlux:"", centerIntensity:"", apertureSize:"",
    colorTemp:"", cri:"", cri_r9:"", protectionLevel:"", controlMethod:"", inputVoltage:"", iesInfo:"", testPhotos:[null,null],
    opticalCheck: OPTICAL_ITEMS.map(() => ({ value:"", note:"" })), reviewComment1:"", spectroPhotos:[null,null,null,null], catalogDrawing:null,
    qualityCheck: QUALITY_ITEMS.map(() => ({ value:"", note:"" })), reviewComment2:"",
    bodyPhotos:{ top:null, side:null, bottom:null, wireOutlet:null, base:null, adjustJoint:null, powerConnector:null }, accessoryPhotos:[null,null,null] };
}
function defaultGenericData(config) {
  const d = {};
  (config.fields || []).forEach(f => d[f.key] = "");
  (config.fieldsAfter || []).forEach(f => d[f.key] = "");
  if (config.items) d.items = [Object.fromEntries(config.items.columns.map(c => [c.key, ""]))];
  d.note = "";
  if (config.hasPhoto) d.photo = null;
  return d;
}
function dynamicSchemaDefault(config, tenantStaff) {
  const d = {};
  (config.schema.fields || []).forEach(f => { d[f.id] = f.type === "group" ? [{}] : f.type === "multi" ? [] : ""; });
  d.__staff = (tenantStaff || [])[0] || "";
  return d;
}
function tbmDefault() { return { reporter:"", projectName:"", gps:null, sitePhoto:null, ppe:[], hazardNote:"", signature:null }; }
function pressureTestDefault() { return { projectName:"", section:"", medium:"空氣", testPressure:"", holdStart:"", holdEnd:"", gaugeBefore:null, gaugeAfter:null, ndt:[{ weldNo:"", welder:"", method:"RT", result:"" }], finalResult:"", signature:null }; }

function defaultDataFor(card, tenant) {
  if (!card) return {};
  switch (card.formKind) {
    case "survey": return { project:"", contact:"", progress:"", staff:"", timeStartH:"", timeStartM:"", timeEndH:"", timeEndM:"", summary:"", items:[{ photos:[null,null], location:"", lightModel:"", execType:"", customExec:"" }] };
    case "meeting": return { meetingType:"", topic:"", attendees:"", resolution:"", photo:null };
    case "design_meeting": return { meetingDate:"", meetingStartH:"", meetingStartM:"", meetingEndH:"", meetingEndM:"", location:"", attendees:"", recorder:"", projectName:"", progress:"", topic:"", content:"", postActions:"" };
    case "install": return { zone:"", material:"", inspector:"", checkResult:"", note:"", photo:null };
    case "customInspect": return customInspectDefault();
    case "lightInspect": return lightInspectDefault();
    case "generic": return defaultGenericData(card.config || {});
    case "dynamicSchema": return dynamicSchemaDefault(card.config, tenant && tenant.staff);
    case "tbm": return tbmDefault();
    case "pressureTest": return pressureTestDefault();
    default: return {};
  }
}

function renderFormBody(card, data, setData, caseData, tenant) {
  switch (card.formKind) {
    case "survey": return e(SurveyForm, { data, setData, caseData });
    case "meeting": return e(MeetingForm, { data, setData });
    case "design_meeting": return e(DesignMeetingForm, { data, setData });
    case "install": return e(InstallForm, { data, setData });
    case "customInspect": return e(CustomInspectForm, { data, setData });
    case "lightInspect": return e(LightInspectForm, { data, setData });
    case "generic": return e(GenericForm, { config: card.config, data, setData });
    case "dynamicSchema": return e(DynamicSchemaForm, { config: card.config, data, setData, tenantStaff: tenant && tenant.staff });
    case "tbm": return e(TbmForm, { data, setData });
    case "pressureTest": return e(PressureTestForm, { data, setData });
    default: return null;
  }
}

/* ═══ 表單填寫摘要（office 看板 / PDF 預覽通用） ═══ */
function getSummaryRows(card, d) {
  const filled = arr => (arr || []).filter(x => x && x.value).length;
  switch (card.formKind) {
    case "survey": return [
      ["工程案名", d.customProject || d.project || "—"], ["現場聯絡人", d.contact || "—"], ["作業階段", d.progress || "—"], ["施工人員", d.staff || "—"],
      ["施工時間", d.timeStartH ? `${d.timeStartH}:${d.timeStartM || "00"} ～ ${d.timeEndH || "__"}:${d.timeEndM || "00"}` : "—"],
      ["工作摘要", d.summary || "—"], ["記錄組數", `已建立 ${d.items ? d.items.length : 0} 組施工位置與照片`]
    ];
    case "meeting": return [["會議類型", d.meetingType || "—"], ["會議主題", d.topic || "—"], ["與會人員", d.attendees || "—"], ["決議追蹤", d.resolution || "—"]];
    case "design_meeting": return [
      ["會議時間", `${d.meetingDate || "—"}${(d.meetingStartH || d.meetingEndH) ? `　${d.meetingStartH || "--"}:${d.meetingStartM || "00"} ～ ${d.meetingEndH || "--"}:${d.meetingEndM || "00"}` : ""}`],
      ["會議地點", d.location || "—"], ["與會人員", d.attendees || "—"], ["記錄人員", d.recorder || "—"], ["項目名稱", d.projectName || "—"], ["項目進程", d.progress || "—"], ["會議主旨", d.topic || "—"], ["會議內容", d.content || "—"], ["會議後執行內容", d.postActions || "—"]
    ];
    case "install": return [["施工區域", d.zone || "—"], ["材料批號", d.material || "—"], ["檢查人員", d.inspector || "—"], ["檢查結果", d.checkResult || "—"], ["備註", d.note || "—"]];
    case "customInspect": return [
      ["案名", d.caseName || "—"], ["燈具符號", d.lightSymbol || "—"], ["安裝位置", d.location || "—"], ["測試目的", d.testPurpose || "—"],
      ["自主檢查表", `已填寫 ${filled(d.selfCheck)} / ${SELF_CHECK_ITEMS.length} 項`], ["廠驗評估表", `已填寫 ${filled(d.evalCheck)} / ${EVAL_ITEMS.length} 項`]
    ];
    case "lightInspect": {
      const s1 = sumScore(d.opticalCheck), s2 = sumScore(d.qualityCheck);
      return [
        ["案名", d.caseName || "—"], ["廠牌", d.brand || "—"], ["燈具型號", d.modelNo || "—"], ["W數", d.wattage || "—"],
        ["光學品質評估", `已填寫 ${filled(d.opticalCheck)}/${OPTICAL_ITEMS.length} 項，評分 ${s1}／30，等級 ${gradeLabel(s1, OPTICAL_RANGES)}`],
        ["燈具品質評估", `已填寫 ${filled(d.qualityCheck)}/${QUALITY_ITEMS.length} 項，評分 ${s2}／36，等級 ${gradeLabel(s2, QUALITY_RANGES)}`]
      ];
    }
    case "generic": {
      const cfg = card.config;
      const rows = (cfg.fields || []).map(f => [f.label, d[f.key] || "—"]);
      if (cfg.items) {
        rows.push([cfg.items.label || "項目筆數", `共 ${(d.items || []).length} 筆`]);
        if (cfg.items.aggregate) {
          const nums = (d.items || []).map(r => parseFloat(r[cfg.items.aggregate.key])).filter(n => !isNaN(n));
          const agg = cfg.items.aggregate.type === "sum" ? nums.reduce((a, b) => a + b, 0) : (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
          rows.push([cfg.items.aggregate.label, agg.toFixed(1)]);
        }
      }
      rows.push([cfg.notesLabel || "備註", d.note || "—"]);
      return rows;
    }
    case "dynamicSchema": {
      const fields = (card.config.schema.fields || []).filter(f => f.type !== "group");
      const rows = fields.map(f => [f.label, Array.isArray(d[f.id]) ? (d[f.id].join("、") || "—") : (d[f.id] || "—")]);
      const groupField = (card.config.schema.fields || []).find(f => f.type === "group");
      if (groupField) rows.push([groupField.label, `共 ${(d[groupField.id] || []).length} 筆`]);
      return rows;
    }
    case "tbm": return [["填報人員", d.reporter || "—"], ["案名/地點", d.projectName || "—"], ["GPS", d.gps && d.gps.lat != null ? `${d.gps.lat.toFixed(5)}, ${d.gps.lng.toFixed(5)}` : (d.gps && d.gps.error) || "—"], ["防護具", (d.ppe || []).join("、") || "—"], ["危險告知", d.hazardNote || "—"]];
    case "pressureTest": return [["案名", d.projectName || "—"], ["試壓區段", d.section || "—"], ["測試壓力", d.testPressure ? `${d.testPressure} kg/cm²` : "—"], ["NDT筆數", `共 ${(d.ndt || []).length} 筆`], ["合格判定", d.finalResult || "—"]];
    default: return [];
  }
}

/* ═══ 通用：從任意表單資料中萃取照片 dataURL（供 AI 判讀共用） ═══ */
function extractPhotos(data, limit) {
  const out = [];
  const walk = (v) => {
    if (out.length >= (limit || 2)) return;
    if (typeof v === "string") { if (v.startsWith("data:image")) out.push(v); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === "object") { Object.values(v).forEach(walk); }
  };
  walk(data);
  return out.slice(0, limit || 2);
}

/* ═══ 通用：判斷此筆紀錄是否應觸發「異常」LINE 通知 ═══ */
function isRecordFlagged(card, data) {
  if (card.formKind === "dynamicSchema") return (data.items || []).some(it => it.judge === "不符合");
  if (card.formKind === "install") return data.checkResult === "不合格";
  if (card.formKind === "pressureTest") return data.finalResult === "不合格" || (data.ndt || []).some(r => r.result === "不合格");
  if (card.formKind === "generic" && "checkResult" in (data || {})) return data.checkResult === "不合格";
  return false;
}

/* ─── PDF A4 Template ─── */
const PAGE_W = 794, PAGE_H = 1123, SIDE_PAD = 40, TITLE_ROW_H = 32, CONT_PAD = TITLE_ROW_H * 2, PHOTO_CELL_H = 400;

function pdfPageShell(inner, first, last) {
  const pad = first ? 36 : CONT_PAD;
  return `<div class="pdf-page" style="width:${PAGE_W}px;height:${PAGE_H}px;box-sizing:border-box;background:#fff;position:relative;overflow:hidden;padding:${pad}px ${SIDE_PAD}px;font-family:Arial,'Microsoft JhengHei','PingFang TC',sans-serif;font-size:12px;line-height:1.5;color:#1F2937;${last ? "" : "page-break-after:always;"}">${inner}</div>`;
}

function buildHeaderHTML(card, tenant) {
  const dept = (tenant.departments || []).find(x => x.id === card.dept);
  const DATE_STR = new Date().toLocaleDateString("zh-TW", { year:"numeric", month:"2-digit", day:"2-digit" });
  return `
    <div style="text-align:center;padding-bottom:10px;border-bottom:3px solid #1F2937;margin-bottom:8px">
      <div style="font-size:9px;color:#F97316;font-weight:700;letter-spacing:3px;margin-bottom:4px">${tenant.name.toUpperCase()} ｜ ${dept ? dept.label : ""}</div>
      <div style="font-size:22px;font-weight:800;color:#1F2937;letter-spacing:3px">${tenant.name} — ${card.label}</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#6B7280;padding:5px 0 14px;border-bottom:1px solid #9CA3AF;margin-bottom:18px">
      <span>填報日期：${DATE_STR}</span><span>系統版本：v2.0</span>
    </div>`;
}

const secBar = t => `<div style="font-weight:700;font-size:12px;background:#F3F4F6;padding:7px 10px;border:1px solid #CBD5E0;border-bottom:none;letter-spacing:1px">■ ${t}</div>`;

function buildSigHTML(cols, sigImages) {
  const list = (cols && cols.length) ? cols : SIG_COLS;
  return `
    <div style="font-weight:700;font-size:12px;background:#F3F4F6;padding:7px 10px;border:1px solid #CBD5E0;border-bottom:none;letter-spacing:1px;margin-top:14px">■ 人員簽名確認</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>${list.map(c => `<th style="border:1px solid #CBD5E0;padding:8px;background:#1F2937;color:#fff;font-size:11px;font-weight:700;text-align:center">${c}</th>`).join("")}</tr></thead>
      <tbody><tr>${list.map((c, i) => {
        const img = sigImages && sigImages[i];
        return `<td style="border:1px solid #CBD5E0;height:65px;padding:6px 10px;vertical-align:bottom;font-size:10px;color:#9CA3AF;text-align:center">${img ? `<img src="${img}" style="max-height:50px;max-width:100%;object-fit:contain">` : "簽名：___________ 日期：___________"}</td>`;
      }).join("")}</tr></tbody>
    </table>`;
}

function buildFootHTML() {
  return `<div style="position:absolute;left:${SIDE_PAD}px;right:${SIDE_PAD}px;bottom:18px;text-align:center;font-size:10px;color:#9CA3AF;padding-top:12px;border-top:1px solid #E5E7EB">本表單由系統自動產生 &nbsp;·&nbsp; 填報時間：${new Date().toLocaleString("zh-TW")} &nbsp;·&nbsp; 僅供內部使用，請妥善保管</div>`;
}

function checklistTableHTML(items, data) {
  const tdQ = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:top;width:55%"`;
  const tdR = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle;text-align:center;width:15%"`;
  const tdN = `style="font-size:11px;color:#374151;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:top"`;
  const rows = items.map((item, idx) => {
    const rowData = (data && data[idx]) || { value:"", note:"" };
    const text = typeof item === "string" ? item : item.text;
    return `<tr><td ${tdQ}>${idx + 1}. ${text}</td><td ${tdR}>${rowData.value || "—"}</td><td ${tdN}>${rowData.note || ""}</td></tr>`;
  }).join("");
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><thead><tr><th style="border:1px solid #CBD5E0;padding:8px;background:#1F2937;color:#fff;font-size:11px">檢查項目</th><th style="border:1px solid #CBD5E0;padding:8px;background:#1F2937;color:#fff;font-size:11px">結果</th><th style="border:1px solid #CBD5E0;padding:8px;background:#1F2937;color:#fff;font-size:11px">備註</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function photoGridHTML(slots) {
  let rows = "";
  for (let i = 0; i < slots.length; i += 4) {
    const chunk = slots.slice(i, i + 4).map(s => `<td style="border:1px solid #CBD5E0;padding:8px;width:25%;height:140px;text-align:center;vertical-align:middle">${s.src ? `<img src="${s.src}" crossorigin="anonymous" style="max-width:100%;max-height:120px;object-fit:contain">` : ""}<div style="font-size:10px;color:#6B7280;margin-top:4px">${s.label || ""}</div></td>`).join("");
    rows += `<tr>${chunk}</tr>`;
  }
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><tbody>${rows}</tbody></table>`;
}

function fieldsTableHTML(fields, d) {
  const tdL = `style="font-weight:700;background:#F8F9FA;font-size:11px;color:#374151;width:110px;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const tdV = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  let rowsHtml = "";
  for (let i = 0; i < fields.length; i += 2) {
    const f1 = fields[i], f2 = fields[i + 1];
    rowsHtml += `<tr><td ${tdL}>${f1.label}</td><td ${tdV}${f2 ? "" : ' colspan="3"'}>${(d[f1.key] || "—")}</td>${f2 ? `<td ${tdL}>${f2.label}</td><td ${tdV}>${d[f2.key] || "—"}</td>` : ""}</tr>`;
  }
  return `<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><tbody>${rowsHtml}</tbody></table>`;
}

function itemsTableHTML(itemsConfig, rows) {
  if (!itemsConfig) return "";
  const cols = itemsConfig.columns;
  const head = cols.map(c => `<th style="border:1px solid #CBD5E0;padding:6px;background:#1F2937;color:#fff;font-size:10px">${c.label}</th>`).join("");
  const body = (rows || []).map(r => `<tr>${cols.map(c => `<td style="border:1px solid #CBD5E0;padding:6px;font-size:11px;text-align:center">${r[c.key] || "—"}</td>`).join("")}</tr>`).join("");
  let aggHtml = "";
  if (itemsConfig.aggregate) {
    const nums = (rows || []).map(r => parseFloat(r[itemsConfig.aggregate.key])).filter(n => !isNaN(n));
    const val = itemsConfig.aggregate.type === "sum" ? nums.reduce((a, b) => a + b, 0) : (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
    aggHtml = `<div style="text-align:right;font-size:12px;font-weight:700;color:#9A3412;background:#FFF7ED;border:1px solid #FED7AA;padding:8px 10px;margin-top:-1px">${itemsConfig.aggregate.label}：${val.toFixed(1)}</div>`;
  }
  return `<div style="font-weight:700;font-size:12px;background:#F3F4F6;padding:7px 10px;border:1px solid #CBD5E0;border-bottom:none;letter-spacing:1px;margin-top:6px">■ ${itemsConfig.label || "項目明細"}</div><table style="width:100%;border-collapse:collapse;margin-bottom:2px"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${aggHtml}`;
}

function buildSurveyPDF(card, d, tenant) {
  const tdL  = `style="font-weight:700;background:#F8F9FA;font-size:11px;color:#374151;width:80px;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle;white-space:nowrap"`;
  const tdV  = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const tdSum = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle;white-space:pre-wrap;height:106px"`;
  const durationStr = getCalculatedHoursText(d.timeStartH, d.timeStartM, d.timeEndH, d.timeEndM);
  const timeStr = d.timeStartH ? `${d.timeStartH}:${d.timeStartM || "00"} ～ ${d.timeEndH || "__"}:${d.timeEndM || "00"} (總工時：${durationStr})` : "—";
  const infoHTML = secBar("工程回報資訊") + `<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><tbody>
      <tr><td ${tdL}>工程案名</td><td ${tdV}>${d.customProject || d.project || "—"}</td><td ${tdL}>現場聯絡人</td><td ${tdV}>${d.contact || "—"}</td></tr>
      <tr><td ${tdL}>作業階段</td><td ${tdV}>${d.progress || "—"}</td><td ${tdL}>施工人員</td><td ${tdV}>${d.staff || "—"}</td></tr>
      <tr><td ${tdL}>施工時間</td><td ${tdV} colspan="3">${timeStr}</td></tr>
      <tr><td ${tdL}>工作摘要</td><td ${tdSum} colspan="3">${d.summary || "—"}</td></tr>
    </tbody></table>`;
  const groupTableHTML = (item, gapTop) => {
    const execStr = item.execType === EXEC_CUSTOM ? (item.customExec || "—") : (item.execType || "—");
    const img = src => src ? `<img src="${src}" style="max-width:100%;max-height:${PHOTO_CELL_H - 14}px;object-fit:contain;display:inline-block;vertical-align:middle">` : "";
    return `<table style="width:100%;border-collapse:collapse;table-layout:fixed;${gapTop ? `margin-top:${gapTop}px;` : ""}">
      <colgroup><col style="width:80px"><col><col style="width:80px"><col></colgroup>
      <tbody>
        <tr><td ${tdL}>施工位置</td><td ${tdV}>${item.location || "—"}</td><td ${tdL}>燈具型號</td><td ${tdV}>${item.lightModel || "—"}</td></tr>
        <tr><td ${tdL}>施工內容</td><td ${tdV} colspan="3">${execStr}</td></tr>
        <tr><td colspan="2" style="border:1px solid #CBD5E0;padding:6px;height:${PHOTO_CELL_H}px;vertical-align:middle;text-align:center">${img(item.photos[0])}</td><td colspan="2" style="border:1px solid #CBD5E0;padding:6px;height:${PHOTO_CELL_H}px;vertical-align:middle;text-align:center">${img(item.photos[1])}</td></tr>
      </tbody></table>`;
  };
  const groups = d.items || [];
  const pagesArr = [];
  let sigPlaced = false;
  const headerHTML = buildHeaderHTML(card, tenant);
  let p1 = headerHTML + infoHTML + secBar("施工與拍照記錄") + groupTableHTML(groups[0], 0);
  if (groups.length === 1) { p1 += buildSigHTML(); sigPlaced = true; }
  pagesArr.push({ html: p1, first: true });
  const rest = groups.slice(1);
  for (let i = 0; i < rest.length; i += 2) {
    const chunk = rest.slice(i, i + 2);
    let html = chunk.map((it, j) => groupTableHTML(it, j === 0 ? 0 : 8)).join("");
    const isLastChunk = i + 2 >= rest.length;
    if (isLastChunk && chunk.length === 1) { html += buildSigHTML(); sigPlaced = true; }
    pagesArr.push({ html, first: false });
  }
  if (!sigPlaced) pagesArr.push({ html: buildSigHTML(), first: false });
  return `<div>` + pagesArr.map((p, i) => pdfPageShell(p.html + (i === pagesArr.length - 1 ? buildFootHTML() : ""), p.first, i === pagesArr.length - 1)).join("") + `</div>`;
}

function buildSimplePDF(card, d, tenant) {
  const tdL  = `style="font-weight:700;background:#F8F9FA;font-size:11px;color:#374151;width:80px;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle;white-space:nowrap"`;
  const tdV  = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const tdP  = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle;white-space:pre-wrap"`;
  let mainInfoRows = "";
  if (card.formKind === "meeting") {
    mainInfoRows = `<tr><td ${tdL}>會議類型</td><td ${tdV} colspan="3">${d.meetingType || "—"}</td></tr>
      <tr><td ${tdL}>會議主題</td><td ${tdV} colspan="3">${d.topic || "—"}</td></tr>
      <tr><td ${tdL}>與會人員</td><td ${tdV} colspan="3">${d.attendees || "—"}</td></tr>
      <tr><td ${tdL}>決議追蹤</td><td ${tdP} colspan="3">${d.resolution || "—"}</td></tr>`;
  } else {
    const badge = d.checkResult === "合格" ? `<span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:#D1FAE5;color:#065F46">✓ 合格</span>`
      : d.checkResult === "不合格" ? `<span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;background:#FEE2E2;color:#991B1B">✗ 不合格</span>` : "—";
    mainInfoRows = `<tr><td ${tdL}>施工區域</td><td ${tdV}>${d.zone || "—"}</td><td ${tdL}>材料批號</td><td ${tdV}>${d.material || "—"}</td></tr>
      <tr><td ${tdL}>檢查人員</td><td ${tdV}>${d.inspector || "—"}</td><td ${tdL}>檢查結果</td><td ${tdV}>${badge}</td></tr>
      <tr><td ${tdL}>備註說明</td><td ${tdP} colspan="3">${d.note || "—"}</td></tr>`;
  }
  const pPrint = d.photo ? `<img src="${d.photo}" crossorigin="anonymous" style="max-width:100%;max-height:130px;object-fit:contain;display:inline-block;vertical-align:middle">` : "";
  const photoSection = `${secBar("現場照片記錄")}<table style="width:100%;border-collapse:collapse;margin-bottom:18px"><tbody><tr><td style="border:1px solid #CBD5E0;padding:10px;width:50%;height:155px;vertical-align:middle;text-align:center">${pPrint}</td><td style="border:1px solid #CBD5E0;padding:10px;width:50%;height:155px;text-align:center;vertical-align:middle"></td></tr></tbody></table>`;
  const inner = buildHeaderHTML(card, tenant) + secBar(`${card.label}資訊`) + `<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><tbody>${mainInfoRows}</tbody></table>` + photoSection + buildSigHTML() + buildFootHTML();
  return `<div>` + pdfPageShell(inner, true, true) + `</div>`;
}

function buildCustomInspectPDF(card, d, tenant) {
  const tdL = `style="font-weight:700;background:#F8F9FA;font-size:11px;color:#374151;width:100px;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const tdV = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const infoHTML = secBar("專案訂製品檢測紀錄") + `<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tbody>
      <tr><td ${tdL}>案名</td><td ${tdV}>${d.caseName || "—"}</td><td ${tdL}>燈具符號</td><td ${tdV}>${d.lightSymbol || "—"}</td></tr>
      <tr><td ${tdL}>燈具類型</td><td ${tdV}>${d.lightType || "—"}</td><td ${tdL}>安裝位置</td><td ${tdV}>${d.location || "—"}</td></tr>
      <tr><td ${tdL}>測試目的</td><td ${tdV} colspan="3">${d.testPurpose || "—"}</td></tr></tbody></table>`;
  const inspectorsHTML = secBar("檢測人員清單") + `<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tbody>
      <tr><td ${tdL}>廠驗日期</td><td ${tdV}>${d.inspectDate || "—"}</td><td ${tdL}>廠驗廠商</td><td ${tdV}>${d.inspectVendor || "—"}</td></tr>
      <tr><td ${tdL}>廠驗人員</td><td ${tdV}>${d.inspectors || "—"}</td><td ${tdL}>專案設計師</td><td ${tdV}>${d.designer || "—"}</td></tr>
      <tr><td ${tdL}>工程人員</td><td ${tdV}>${d.engineer || "—"}</td><td ${tdL}>業主人員</td><td ${tdV}>${d.owner || "—"}</td></tr>
      <tr><td ${tdL}>廠商人員</td><td ${tdV} colspan="3">${d.vendorStaff || "—"}</td></tr></tbody></table>`;
  const photoSlots = (d.sitePhotos || []).map((p, idx) => ({ src: p.photo, label: p.position || `勘驗照片 ${idx + 1}` }));
  const photoHTML = secBar("勘驗紀錄照片") + photoGridHTML(photoSlots);
  const page1 = buildHeaderHTML(card, tenant) + infoHTML + inspectorsHTML + photoHTML + secBar("訂製品廠驗自主檢查表") + checklistTableHTML(SELF_CHECK_ITEMS, d.selfCheck);
  const preSignCols = ["董事長","行政部主管","設計部主管","工程部主管","設計部專案","工程部專案"];
  const page2 = secBar("行前計畫確認簽核") + buildSigHTML(preSignCols) + secBar("訂製品廠驗評估表") + checklistTableHTML(EVAL_ITEMS, d.evalCheck)
    + secBar("審查意見") + `<div style="border:1px solid #CBD5E0;padding:10px;min-height:60px;font-size:12px;white-space:pre-wrap;margin-bottom:14px">${d.reviewComment || "—"}</div>`
    + buildSigHTML(preSignCols) + buildFootHTML();
  return `<div>` + pdfPageShell(page1, true, false) + pdfPageShell(page2, false, true) + `</div>`;
}

function buildLightInspectPDF(card, d, tenant) {
  const tdL = `style="font-weight:700;background:#F8F9FA;font-size:11px;color:#374151;width:100px;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const tdV = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const basicHTML = secBar("專案設備測試使用紀錄") + `<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tbody>
      <tr><td ${tdL}>案名</td><td ${tdV}>${d.caseName || "—"}</td><td ${tdL}>燈具符號</td><td ${tdV}>${d.lightSymbol || "—"}</td></tr>
      <tr><td ${tdL}>安裝位置</td><td ${tdV}>${d.location || "—"}</td><td ${tdL}>測試日期</td><td ${tdV}>${d.testDate || "—"}</td></tr>
      <tr><td ${tdL}>測試人員</td><td ${tdV}>${d.tester || "—"}</td><td ${tdL}>記錄人員</td><td ${tdV}>${d.recorder || "—"}</td></tr>
      <tr><td ${tdL}>測試目的</td><td ${tdV} colspan="3">${d.testPurpose || "—"}</td></tr>
      <tr><td ${tdL}>參與人員</td><td ${tdV} colspan="3">${d.participants || "—"}</td></tr></tbody></table>`;
  const specHTML = secBar("照明設備規格") + `<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tbody>
      <tr><td ${tdL}>廠牌</td><td ${tdV}>${d.brand || "—"}</td><td ${tdL}>燈具型號</td><td ${tdV}>${d.modelNo || "—"}</td></tr>
      <tr><td ${tdL}>型錄位置</td><td ${tdV}>${d.catalogLoc || "—"}</td><td ${tdL}>燈具形式</td><td ${tdV}>${d.lightForm || "—"}</td></tr>
      <tr><td ${tdL}>光源形式</td><td ${tdV}>${d.sourceForm || "—"}</td><td ${tdL}>光源批號</td><td ${tdV}>${d.sourceBatch || "—"}</td></tr>
      <tr><td ${tdL}>燈具材質</td><td ${tdV}>${d.lightMaterial || "—"}</td><td ${tdL}>W數</td><td ${tdV}>${d.wattage || "—"}</td></tr>
      <tr><td ${tdL}>光通量</td><td ${tdV}>${d.luminousFlux || "—"}</td><td ${tdL}>中心光強度</td><td ${tdV}>${d.centerIntensity || "—"}</td></tr>
      <tr><td ${tdL}>開孔尺寸</td><td ${tdV}>${d.apertureSize || "—"}</td><td ${tdL}>色溫度</td><td ${tdV}>${d.colorTemp || "—"}</td></tr>
      <tr><td ${tdL}>演色性 CRI≧</td><td ${tdV}>${d.cri || "—"}</td><td ${tdL}>CRI≧R9</td><td ${tdV}>${d.cri_r9 || "—"}</td></tr>
      <tr><td ${tdL}>防護等級 IP</td><td ${tdV}>${d.protectionLevel || "—"}</td><td ${tdL}>控制方式</td><td ${tdV}>${d.controlMethod || "—"}</td></tr>
      <tr><td ${tdL}>輸入電壓</td><td ${tdV} colspan="3">${d.inputVoltage || "—"}</td></tr>
      <tr><td ${tdL}>IES資訊</td><td ${tdV} colspan="3">${d.iesInfo || "—"}</td></tr></tbody></table>`;
  const s1 = sumScore(d.opticalCheck);
  const page1 = buildHeaderHTML(card, tenant) + basicHTML + specHTML
    + secBar("測試照片") + photoGridHTML((d.testPhotos || []).map((p, i) => ({ src: p, label: `測試照片 ${i + 1}` })))
    + secBar("燈具光學品質評估表") + checklistTableHTML(OPTICAL_ITEMS, d.opticalCheck)
    + `<div style="text-align:right;font-size:12px;font-weight:700;color:#9A3412;background:#FFF7ED;border:1px solid #FED7AA;padding:8px 10px;margin-bottom:14px">評分：${s1}／30　審查結果：${gradeLabel(s1, OPTICAL_RANGES)}</div>`
    + secBar("審查意見") + `<div style="border:1px solid #CBD5E0;padding:10px;min-height:50px;font-size:12px;white-space:pre-wrap">${d.reviewComment1 || "—"}</div>`;
  const s2 = sumScore(d.qualityCheck);
  const page2 = secBar("光譜儀檢測紀錄照片") + photoGridHTML((d.spectroPhotos || []).map((p, i) => ({ src: p, label: `檢測照片 ${i + 1}` })))
    + secBar("原廠型錄尺寸圖") + photoGridHTML([{ src: d.catalogDrawing, label:"型錄尺寸圖" }])
    + secBar("燈具品質評估表") + checklistTableHTML(QUALITY_ITEMS, d.qualityCheck)
    + `<div style="text-align:right;font-size:12px;font-weight:700;color:#9A3412;background:#FFF7ED;border:1px solid #FED7AA;padding:8px 10px;margin-bottom:14px">評分：${s2}／36　審查結果：${gradeLabel(s2, QUALITY_RANGES)}</div>`
    + secBar("審查意見") + `<div style="border:1px solid #CBD5E0;padding:10px;min-height:50px;font-size:12px;white-space:pre-wrap">${d.reviewComment2 || "—"}</div>`;
  const bodyLabels = [["top","俯視圖"],["side","側視圖"],["bottom","下視圖"],["wireOutlet","燈體出線位置"],["base","固定腳座"],["adjustJoint","燈具調整關節處"],["powerConnector","電源接線頭"]];
  const page3 = secBar("燈具實體照片") + photoGridHTML(bodyLabels.map(([key, label]) => ({ src: (d.bodyPhotos || {})[key], label })))
    + secBar("燈具配件照片") + photoGridHTML((d.accessoryPhotos || []).map((p, i) => ({ src: p, label: `配件照片 ${i + 1}` })))
    + buildSigHTML() + buildFootHTML();
  return `<div>` + pdfPageShell(page1, true, false) + pdfPageShell(page2, false, false) + pdfPageShell(page3, false, true) + `</div>`;
}

function buildGenericPDF(card, d, tenant) {
  const cfg = card.config;
  const notesHTML = secBar(cfg.notesLabel || "備註") + `<div style="border:1px solid #CBD5E0;padding:10px;min-height:50px;font-size:12px;white-space:pre-wrap;margin-bottom:14px">${d.note || "—"}</div>`;
  let photoHTML = "";
  if (cfg.hasPhoto) {
    const pPrint = d.photo ? `<img src="${d.photo}" crossorigin="anonymous" style="max-width:100%;max-height:130px;object-fit:contain;display:inline-block;vertical-align:middle">` : "";
    photoHTML = secBar(cfg.photoLabel || "相關照片") + `<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><tbody><tr><td style="border:1px solid #CBD5E0;padding:10px;width:50%;height:155px;vertical-align:middle;text-align:center">${pPrint}</td><td style="border:1px solid #CBD5E0;padding:10px;width:50%;height:155px"></td></tr></tbody></table>`;
  }
  let fieldsAfterHTML = (cfg.fieldsAfter && cfg.fieldsAfter.length) ? fieldsTableHTML(cfg.fieldsAfter, d) : "";
  const inner = buildHeaderHTML(card, tenant) + secBar(`${card.label}資訊`) + fieldsTableHTML(cfg.fields || [], d) + itemsTableHTML(cfg.items, d.items) + fieldsAfterHTML + notesHTML + photoHTML + buildSigHTML(cfg.sigCols) + buildFootHTML();
  return `<div>` + pdfPageShell(inner, true, true) + `</div>`;
}

function buildDesignMeetingHeaderHTML(card) {
  return `<div style="text-align:left;padding-bottom:14px;border-bottom:3px solid #1F2937;margin-bottom:18px">
      <div style="font-size:22px;font-weight:800;color:#1F2937;letter-spacing:3px">${card.label}</div>
      <div style="font-size:9px;color:#F97316;font-weight:700;letter-spacing:3px;margin-top:6px">Meeting Minute</div></div>`;
}

function buildDesignMeetingPDF(card, d) {
  const tdL = `style="font-weight:700;background:#F8F9FA;font-size:11px;color:#374151;width:90px;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle;white-space:nowrap"`;
  const tdV = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const boxStyle = "border:1px solid #CBD5E0;padding:10px;min-height:90px;font-size:12px;white-space:pre-wrap;margin-bottom:14px";
  const timeRange = (d.meetingStartH || d.meetingEndH) ? `${d.meetingStartH || "--"}:${d.meetingStartM || "00"} ～ ${d.meetingEndH || "--"}:${d.meetingEndM || "00"}` : "";
  const dateTimeStr = [d.meetingDate || "—", timeRange].filter(Boolean).join("　");
  const infoHTML = `<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><tbody>
      <tr><td ${tdL}>會議時間</td><td ${tdV}>${dateTimeStr}</td><td ${tdL}>會議地點</td><td ${tdV}>${d.location || "—"}</td></tr>
      <tr><td ${tdL}>與會人員</td><td ${tdV}>${d.attendees || "—"}</td><td ${tdL}>記錄人員</td><td ${tdV}>${d.recorder || "—"}</td></tr>
      <tr><td ${tdL}>項目名稱</td><td ${tdV}>${d.projectName || "—"}</td><td ${tdL}>項目進程</td><td ${tdV}>${d.progress || "—"}</td></tr>
      <tr><td ${tdL}>會議主旨</td><td ${tdV} colspan="3">${d.topic || "—"}</td></tr></tbody></table>`;
  const contentHTML = secBar("會議內容") + `<div style="${boxStyle}">${d.content || "—"}</div>`;
  const postActionHTML = secBar("會議後執行內容") + `<div style="${boxStyle}">${d.postActions || "—"}</div>`;
  const sigLabelHTML = `<div style="font-weight:400;font-size:12px;background:#F3F4F6;padding:7px 10px;border:1px solid #CBD5E0;border-bottom:none;letter-spacing:1px;margin-top:14px">請於此頁簽署並惠于意見回覆，以利後續工作進行，謝謝。</div>`;
  const sigHTML = sigLabelHTML + `<div style="border:1px solid #CBD5E0;min-height:240px;margin-bottom:14px"></div>`;
  const inner = buildDesignMeetingHeaderHTML(card) + infoHTML + contentHTML + postActionHTML + sigHTML;
  return `<div>` + pdfPageShell(inner, true, true) + `</div>`;
}

/* ═══ 新增：TBM PDF ═══ */
function buildTbmPDF(card, d, tenant) {
  const tdL = `style="font-weight:700;background:#F8F9FA;font-size:11px;color:#374151;width:90px;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const tdV = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const gpsStr = d.gps && d.gps.lat != null ? `${d.gps.lat.toFixed(6)}, ${d.gps.lng.toFixed(6)}（${d.gps.time}）` : (d.gps && d.gps.error) || "—";
  const infoHTML = secBar("TBM 工安簽到資訊") + `<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tbody>
      <tr><td ${tdL}>填報人員</td><td ${tdV}>${d.reporter || "—"}</td><td ${tdL}>案名/地點</td><td ${tdV}>${d.projectName || "—"}</td></tr>
      <tr><td ${tdL}>GPS 定位</td><td ${tdV} colspan="3">${gpsStr}</td></tr>
      <tr><td ${tdL}>防護具</td><td ${tdV} colspan="3">${(d.ppe || []).join("、") || "—"}</td></tr></tbody></table>`;
  const hazardHTML = secBar("現場危險告知內容") + `<div style="border:1px solid #CBD5E0;padding:10px;min-height:70px;font-size:12px;white-space:pre-wrap;margin-bottom:14px">${d.hazardNote || "—"}</div>`;
  const photoHTML = secBar("現場照片") + photoGridHTML([{ src: d.sitePhoto, label:"現場照片" }]);
  const sigHTML = secBar("危險告知簽名確認") + `<div style="border:1px solid #CBD5E0;padding:12px;min-height:90px;text-align:center">${d.signature ? `<img src="${d.signature}" style="max-height:80px">` : "（未簽名）"}</div>`;
  const inner = buildHeaderHTML(card, tenant) + infoHTML + hazardHTML + photoHTML + sigHTML + buildFootHTML();
  return `<div>` + pdfPageShell(inner, true, true) + `</div>`;
}

/* ═══ 新增：品管壓測 PDF ═══ */
function buildPressureTestPDF(card, d, tenant) {
  const tdL = `style="font-weight:700;background:#F8F9FA;font-size:11px;color:#374151;width:100px;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const tdV = `style="font-size:12px;color:#1F2937;padding:8px 9px;border:1px solid #CBD5E0;vertical-align:middle"`;
  const infoHTML = secBar("耐壓/氣密試驗資訊") + `<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tbody>
      <tr><td ${tdL}>案名</td><td ${tdV}>${d.projectName || "—"}</td><td ${tdL}>試壓區段編號</td><td ${tdV}>${d.section || "—"}</td></tr>
      <tr><td ${tdL}>試驗介質</td><td ${tdV}>${d.medium || "—"}</td><td ${tdL}>測試壓力</td><td ${tdV}>${d.testPressure ? d.testPressure + " kg/cm²" : "—"}</td></tr>
      <tr><td ${tdL}>持壓開始</td><td ${tdV}>${d.holdStart || "—"}</td><td ${tdL}>持壓結束</td><td ${tdV}>${d.holdEnd || "—"}</td></tr></tbody></table>`;
  const gaugeHTML = secBar("壓測錶雙時點照片") + photoGridHTML([{ src: d.gaugeBefore, label:"試壓前" }, { src: d.gaugeAfter, label:"試壓後" }]);
  const ndtHead = `<th style="border:1px solid #CBD5E0;padding:6px;background:#1F2937;color:#fff;font-size:10px">銲頭編號</th><th style="border:1px solid #CBD5E0;padding:6px;background:#1F2937;color:#fff;font-size:10px">銲工</th><th style="border:1px solid #CBD5E0;padding:6px;background:#1F2937;color:#fff;font-size:10px">方式</th><th style="border:1px solid #CBD5E0;padding:6px;background:#1F2937;color:#fff;font-size:10px">結果</th>`;
  const ndtBody = (d.ndt || []).map(r => `<tr><td style="border:1px solid #CBD5E0;padding:6px;font-size:11px;text-align:center">${r.weldNo || "—"}</td><td style="border:1px solid #CBD5E0;padding:6px;font-size:11px;text-align:center">${r.welder || "—"}</td><td style="border:1px solid #CBD5E0;padding:6px;font-size:11px;text-align:center">${r.method || "—"}</td><td style="border:1px solid #CBD5E0;padding:6px;font-size:11px;text-align:center">${r.result || "—"}</td></tr>`).join("");
  const ndtHTML = secBar("NDT 銲接檢測（RT/UT）") + `<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><thead><tr>${ndtHead}</tr></thead><tbody>${ndtBody}</tbody></table>`;
  const resultHTML = secBar("合格判定") + `<div style="border:1px solid #CBD5E0;padding:10px;font-size:14px;font-weight:700;text-align:center;margin-bottom:14px;color:${d.finalResult === "合格" ? "#065F46" : d.finalResult === "不合格" ? "#991B1B" : "#374151"}">${d.finalResult || "—"}</div>`;
  const sigHTML = secBar("檢測人員簽核") + `<div style="border:1px solid #CBD5E0;padding:12px;min-height:90px;text-align:center">${d.signature ? `<img src="${d.signature}" style="max-height:80px">` : "（未簽名）"}</div>`;
  const inner = buildHeaderHTML(card, tenant) + infoHTML + gaugeHTML + ndtHTML + resultHTML + sigHTML + buildFootHTML();
  return `<div>` + pdfPageShell(inner, true, true) + `</div>`;
}

function buildPDFHTML(card, d, tenant) {
  if (card.formKind === "survey") return buildSurveyPDF(card, d, tenant);
  if (card.formKind === "meeting" || card.formKind === "install") return buildSimplePDF(card, d, tenant);
  if (card.formKind === "design_meeting") return buildDesignMeetingPDF(card, d);
  if (card.formKind === "customInspect") return buildCustomInspectPDF(card, d, tenant);
  if (card.formKind === "lightInspect") return buildLightInspectPDF(card, d, tenant);
  if (card.formKind === "generic") return buildGenericPDF(card, d, tenant);
  if (card.formKind === "tbm") return buildTbmPDF(card, d, tenant);
  if (card.formKind === "pressureTest") return buildPressureTestPDF(card, d, tenant);
  return `<div>${pdfPageShell("<div>無法產生此表單的 PDF</div>", true, true)}</div>`;
}
