/* ════════════════════════════════════════════════════════════
   js/widgets.js — 共用表單元件
   ════════════════════════════════════════════════════════════ */
const e = React.createElement;
const F = React.Fragment;
const { useState, useRef, useEffect } = React;

const uid = p => p + Math.random().toString(36).slice(2, 7);
const nowClock = () => new Date().toLocaleTimeString("zh-TW", { hour12: false });

const S = {
  label: { display:"block", fontSize:12, fontWeight:700, color:"#6B7280", marginBottom:5, textTransform:"uppercase", letterSpacing:0.5 },
  input: { width:"100%", padding:"11px 13px", fontSize:15, borderRadius:9, border:"1.5px solid #D1D5DB", background:"#fff", outline:"none", fontFamily:"inherit" },
  card:  { background:"#fff", borderRadius:14, padding:"20px 16px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", marginBottom:16 },
};

function Sel({ label, value, onChange, options, placeholder }) {
  return e("div", { style: { marginBottom: 15 } },
    e("label", { style: S.label }, label),
    e("div", { style: { position: "relative" } },
      e("select", {
        value: value,
        onChange: ev => onChange(ev.target.value),
        style: { ...S.input, paddingRight: 36, appearance: "none", WebkitAppearance: "none", cursor: "pointer", color: value ? "#1F2937" : "#9CA3AF" }
      },
        e("option", { value: "" }, placeholder || "請選擇..."),
        options.map(o => e("option", { key: o, value: o }, o))
      ),
      e("span", { style: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none", fontSize: 11 } }, "▼")
    )
  );
}

function Txt({ label, value, onChange, placeholder, multi }) {
  return e("div", { style: { marginBottom: 15 } },
    e("label", { style: S.label }, label),
    multi
      ? e("textarea", { value, onChange: ev => onChange(ev.target.value), placeholder: placeholder || "", rows: 3, style: { ...S.input, resize: "vertical", lineHeight: 1.7 } })
      : e("input", { value, onChange: ev => onChange(ev.target.value), placeholder: placeholder || "", style: S.input })
  );
}

function SectionTitle({ children }) {
  return e("div", { style: { fontWeight:800, fontSize:13, color:"#374151", background:"#F3F4F6", padding:"9px 12px", borderRadius:8, margin:"20px 0 12px", letterSpacing:0.5 } }, children);
}

function pillStyle(active, color) {
  const c = color || "#F97316";
  return {
    padding:"8px 12px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", minHeight:38,
    border:`1.5px solid ${active ? c : "#E5E7EB"}`,
    background: active ? `${c}1A` : "#fff",
    color: active ? c : "#374151"
  };
}

/* 拍照/上傳（單張） */
function PhotoUpload({ label, src, onImageChange }) {
  const fileInputRef = useRef(null);
  const handleFileChange = (ev) => {
    const file = ev.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onImageChange(reader.result);
      reader.readAsDataURL(file);
    }
  };
  return e("div", { style: { flex: 1, minWidth: "120px" } },
    e("span", { style: { ...S.label, fontSize: 11, textAlign: "center", marginBottom: 4 } }, label),
    e("input", { type: "file", accept: "image/*", capture: "environment", ref: fileInputRef, onChange: handleFileChange, style: { display: "none" } }),
    src
      ? e("div", { style: { position: "relative", borderRadius: 8, overflow: "hidden", border: "2px solid #6EE7B7" } },
          e("img", { src, style: { width: "100%", height: 100, objectFit: "cover", display: "block" } }),
          e("button", { onClick: ev => { ev.preventDefault(); onImageChange(null); }, style: { position: "absolute", top: 4, right: 4, background: "rgba(239,68,68,0.85)", border: "none", borderRadius: "50%", width: 24, height: 24, color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, "✕")
        )
      : e("button", { type: "button", onClick: () => fileInputRef.current.click(), style: { width: "100%", height: 100, border: "1.5px dashed #CBD5E0", borderRadius: 8, background: "#F9FAFB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" } },
          e("span", { style: { fontSize: 20 } }, "📷"),
          e("span", { style: { fontSize: 11, fontWeight: 600, color: "#9CA3AF" } }, "拍照 / 上傳")
        )
  );
}

function Photo({ label, photo, onCapture }) {
  return e(PhotoUpload, { label, src: photo, onImageChange: onCapture });
}

/* 動態項目明細表格 */
function ItemsTable({ label, columns, rows, onChange, aggregate }) {
  const addRow = () => onChange([...(rows || []), Object.fromEntries(columns.map(c => [c.key, ""]))]);
  const removeRow = (idx) => { if ((rows || []).length <= 1) return; onChange(rows.filter((_, i) => i !== idx)); };
  const updateCell = (idx, key, val) => { const nr = [...rows]; nr[idx] = { ...nr[idx], [key]: val }; onChange(nr); };
  let aggValue = null;
  if (aggregate) {
    const nums = (rows || []).map(r => parseFloat(r[aggregate.key])).filter(n => !isNaN(n));
    aggValue = aggregate.type === "sum" ? nums.reduce((a, b) => a + b, 0) : (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
  }
  return e("div", { style: { marginBottom: 16 } },
    e("div", { style: { ...S.label, marginBottom: 8 } }, label || "項目明細"),
    (rows || []).map((row, idx) => e("div", { key: idx, style: { background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10 } },
      e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
        e("span", { style: { fontSize: 12, fontWeight: 700, color: "#6B7280" } }, `項目 #${idx + 1}`),
        (rows.length > 1) && e("button", { type: "button", onClick: () => removeRow(idx), style: { background: "none", border: "none", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "🛑 刪除")
      ),
      e("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } },
        columns.map(c => e("div", { key: c.key },
          e("label", { style: { fontSize: 10, color: "#9CA3AF", fontWeight: 700 } }, c.label),
          e("input", { value: row[c.key] || "", onChange: ev => updateCell(idx, c.key, ev.target.value), style: { ...S.input, padding: "7px 9px", fontSize: 13, marginTop: 2 } })
        ))
      )
    )),
    e("button", { type: "button", onClick: addRow, style: { width: "100%", padding: "9px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "1.5px dashed #9CA3AF", background: "#F9FAFB", color: "#6B7280", cursor: "pointer" } }, "＋ 新增一筆項目"),
    aggregate && e("div", { style: { marginTop: 8, padding: "9px 12px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 13 } },
      e("span", { style: { color: "#C2410C", fontWeight: 700 } }, aggregate.label),
      e("span", { style: { color: "#9A3412", fontWeight: 800 } }, (aggValue || 0).toFixed(1))
    )
  );
}

/* 評核清單元件 */
function RatingChecklist({ items, defaultOptions, data, onChange }) {
  return e("div", null,
    items.map((item, idx) => {
      const text = typeof item === "string" ? item : item.text;
      const opts = (typeof item === "object" && item.opts) ? item.opts : defaultOptions;
      const rowData = (data && data[idx]) || { value: "", note: "" };
      return e("div", { key: idx, style: { marginBottom: 12, padding: "12px 13px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 } },
        e("div", { style: { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 9, lineHeight: 1.6 } }, `${idx + 1}. ${text}`),
        e("div", { style: { display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" } },
          opts.map(opt => e("button", { key: opt, type: "button", onClick: () => onChange(idx, "value", opt), style: pillStyle(rowData.value === opt) }, opt))
        ),
        e("input", { value: rowData.note, onChange: ev => onChange(idx, "note", ev.target.value), placeholder: "備註（選填）...", style: { ...S.input, fontSize: 13, padding: "8px 10px" } })
      );
    })
  );
}

/* 合格/待確認/不合格 三態按鈕 */
function JudgeChips({ value, onChange }) {
  const JUDGE = [["合格","#059669"],["待確認","#C9963F"],["不合格","#DC2626"]];
  return e("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
    JUDGE.map(([opt, c]) => e("button", { key: opt, type: "button", onClick: () => onChange(value === opt ? "" : opt), style: pillStyle(value === opt, c) }, opt))
  );
}

/* ─── 手寫簽名（新增） ─── */
function SignaturePad({ label, value, onCapture }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  const getCtx = () => canvasRef.current.getContext("2d");

  const pos = (ev) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = ev.touches ? ev.touches[0] : ev;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const start = (ev) => { ev.preventDefault(); drawing.current = true; last.current = pos(ev); };
  const move = (ev) => {
    if (!drawing.current) return;
    ev.preventDefault();
    const p = pos(ev);
    const ctx = getCtx();
    ctx.strokeStyle = "#1F2937"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onCapture(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvasRef.current;
    getCtx().clearRect(0, 0, c.width, c.height);
    onCapture(null);
  };

  useEffect(() => {
    if (value && canvasRef.current) {
      const img = new Image();
      img.onload = () => getCtx().drawImage(img, 0, 0);
      img.src = value;
    }
  }, []);

  return e("div", { style: { marginBottom: 15 } },
    e("label", { style: S.label }, label || "簽名"),
    e("canvas", {
      ref: canvasRef, width: 320, height: 140,
      style: { width: "100%", height: 140, background: "#F9FAFB", border: "1.5px solid #D1D5DB", borderRadius: 9, touchAction: "none", cursor: "crosshair" },
      onMouseDown: start, onMouseMove: move, onMouseUp: end, onMouseLeave: end,
      onTouchStart: start, onTouchMove: move, onTouchEnd: end
    }),
    e("button", { type: "button", onClick: clear, style: { marginTop: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, borderRadius: 7, border: "1.5px solid #E5E7EB", background: "#fff", color: "#6B7280", cursor: "pointer" } }, "清除簽名")
  );
}

/* ─── GPS 定位（新增） ─── */
function GPSField({ label, value, onCapture }) {
  const [state, setState] = useState("idle"); // idle | loading | error

  const locate = () => {
    if (!navigator.geolocation) { setState("error"); onCapture({ error: "此裝置/瀏覽器不支援定位" }); return; }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState("idle");
        onCapture({ lat: pos.coords.latitude, lng: pos.coords.longitude, time: new Date().toLocaleString("zh-TW", { hour12: false }) });
      },
      (err) => {
        setState("error");
        onCapture({ error: err.message || "定位失敗（可能未授權，或非 HTTPS/localhost 安全連線）" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return e("div", { style: { marginBottom: 15 } },
    e("label", { style: S.label }, label || "GPS 定位簽到"),
    e("button", { type: "button", onClick: locate, disabled: state === "loading",
      style: { width: "100%", padding: "11px", fontSize: 14, fontWeight: 700, borderRadius: 9, border: "1.5px dashed #F97316", background: "#FFF7ED", color: "#F97316", cursor: state === "loading" ? "not-allowed" : "pointer" }
    }, state === "loading" ? "📍 定位中…" : "📍 取得目前位置"),
    value && value.lat != null && e("div", { style: { marginTop: 8, padding: "10px 12px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, fontSize: 12.5, color: "#065F46", lineHeight: 1.7 } },
      `座標：${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}　時間：${value.time}`,
      e("br"),
      e("a", { href: `https://maps.google.com/?q=${value.lat},${value.lng}`, target: "_blank", rel: "noreferrer", style: { color: "#059669", fontWeight: 700 } }, "🧭 一鍵導航 →")
    ),
    value && value.error && e("div", { style: { marginTop: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#991B1B", lineHeight: 1.7 } },
      `⚠️ ${value.error}`
    )
  );
}

/* ─── 動態欄位 schema 渲染（沿用自派工原型，供 T01/T02 dynamicSchema 使用） ─── */
const SCHEMA_JUDGE = [["符合","j-ok","#059669"],["待確認","j-wait","#C9963F"],["不符合","j-bad","#DC2626"]];

function SchemaField({ f, schema, val, onChange }) {
  const set = v => onChange(f.id, v);
  const opts = f.from ? (schema[f.from] || []) : (f.options || []);
  if (f.type === "text" || f.type === "number")
    return e(Txt, { label: f.label + (f.required ? " ＊" : ""), value: val || "", onChange: set, placeholder: f.ph || "" });
  if (f.type === "textarea")
    return e(Txt, { label: f.label, value: val || "", onChange: set, placeholder: f.ph || "", multi: true });
  if (f.type === "select")
    return e(Sel, { label: f.label + (f.required ? " ＊" : ""), value: val || "", onChange: set, options: opts });
  if (f.type === "multi") {
    const a = val || [];
    return e("div", { style: { marginBottom: 15 } },
      e("label", { style: S.label }, f.label),
      e("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
        opts.map(o => e("button", { key: o, type: "button", onClick: () => set(a.includes(o) ? a.filter(x => x !== o) : [...a, o]), style: pillStyle(a.includes(o)) }, o))
      )
    );
  }
  if (f.type === "judge")
    return e("div", { style: { marginBottom: 15 } },
      e("label", { style: S.label }, f.label),
      e("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
        SCHEMA_JUDGE.map(([o, , c]) => e("button", { key: o, type: "button", onClick: () => set(val === o ? "" : o), style: pillStyle(val === o, c) }, o))
      )
    );
  if (f.type === "photo") return e(SchemaPhotoField, { f, val, set });
  return null;
}

function SchemaPhotoField({ f, val, set }) {
  const ref = useRef(null);
  const arr = val || [];
  const pick = (ev) => {
    Array.from(ev.target.files || []).forEach(file => {
      const r = new FileReader();
      r.onload = e2 => {
        const img = new Image();
        img.onload = () => {
          const max = 1024, sc = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          set(a => [...(a || []), c.toDataURL("image/jpeg", 0.72)]);
        };
        img.src = e2.target.result;
      };
      r.readAsDataURL(file);
    });
    ev.target.value = "";
  };
  return e("div", { style: { marginBottom: 15 } },
    e("label", { style: S.label }, f.label),
    e("input", { ref, type: "file", accept: "image/*", capture: "environment", multiple: true, style: { display: "none" }, onChange: pick }),
    e("button", { type: "button", onClick: () => ref.current.click(), style: { width: "100%", padding: "14px", border: "1.5px dashed #CBD5E0", borderRadius: 8, background: "#F9FAFB", color: "#9CA3AF", fontSize: 13, cursor: "pointer" } }, "＋ 拍照或選擇照片"),
    arr.length > 0 && e("div", { style: { display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 } },
      arr.map((src, i) => e("div", { key: i, style: { position: "relative", width: 74, height: 74, borderRadius: 6, overflow: "hidden", border: "1px solid #E5E7EB" } },
        e("img", { src, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }),
        e("button", { type: "button", onClick: () => set(a => a.filter((_, j) => j !== i)), style: { position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,.7)", color: "#fff", border: "none", borderRadius: "50%", width: 19, height: 19, fontSize: 11, cursor: "pointer" } }, "×")
      ))
    )
  );
}

function SchemaGroup({ f, schema, rows, onChange }) {
  const upd = (i, k, v) => onChange(rows.map((r, j) => j === i ? { ...r, [k]: typeof v === "function" ? v(r[k]) : v } : r));
  return e("div", { style: { marginBottom: 15 } },
    e("label", { style: S.label }, f.label),
    rows.map((row, i) => e("div", { key: i, style: { border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10, background: "#F9FAFB" } },
      e("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } },
        e("span", { style: { fontSize: 12, fontWeight: 700, color: "#F97316" } }, (f.itemName || "項目") + " " + (i + 1)),
        rows.length > 1 && e("button", { type: "button", onClick: () => onChange(rows.filter((_, j) => j !== i)), style: { background: "none", border: "none", color: "#EF4444", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "🛑 移除")
      ),
      (f.fields || []).map(sf => e(SchemaField, { key: sf.id, f: sf, schema, val: row[sf.id], onChange: (k, v) => upd(i, k, v) }))
    )),
    e("button", { type: "button", onClick: () => onChange([...rows, {}]), style: { width: "100%", padding: "9px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "1.5px dashed #9CA3AF", background: "#fff", color: "#6B7280", cursor: "pointer" } }, "＋ 新增" + (f.itemName || "項目"))
  );
}
