/* ════════════════════════════════════════════════════════════
   js/data.js — 租戶資料模型（TENANTS）
   每個租戶自帶 accounts / staff / departments / cards / sites，
   彼此獨立，不寫死在共用常數裡，方便日後增減產業別。
   ════════════════════════════════════════════════════════════ */

/* ─── 巴洛克建設 / 光宇燈具 沿用的「動態欄位 schema」表單資料
       （原 prototype-v1-rev2_2.html 的 INIT_SCHEMAS，行為不變） ─── */
const T01_SCHEMA = {
  title: "工地巡檢紀錄",
  sites: ["巴洛克-衛武營", "巴洛克-龍中134", "巴洛克-青海370"],
  aiRule: "你是營建現場品管助理。請依照片判斷：燈具安裝位置是否對齊、型號外觀是否與標示相符、施工工法是否有明顯瑕疵。",
  fields: [
    { id: "site", type: "select", label: "案場", required: true, from: "sites" },
    { id: "floor", type: "select", label: "樓層／區段", options: ["B2", "B1", "1F", "2F", "3F", "公設大廳", "中庭景觀"] },
    { id: "stage", type: "select", label: "施工階段", options: ["放樣作業", "預埋作業", "佈線作業", "燈具安裝", "調光測試", "驗收"] },
    { id: "items", type: "group", label: "查驗項目", itemName: "查驗點", fields: [
      { id: "loc", type: "text", label: "查驗位置", ph: "如：3F 走廊東側" },
      { id: "model", type: "text", label: "型號", ph: "如：RG-2814-30W" },
      { id: "judge", type: "judge", label: "狀態判定" },
      { id: "photos", type: "photo", label: "現場照片" },
      { id: "desc", type: "textarea", label: "說明" }
    ]},
    { id: "summary", type: "textarea", label: "總摘要" }
  ]
};

const T02_SCHEMA = {
  title: "出貨檢驗單",
  sites: ["高雄倉", "台南倉", "台中轉運站"],
  aiRule: "你是出貨品管助理。請依照片判斷：外箱是否破損、標籤型號與數量是否清晰可辨、包裝是否足以保護商品。",
  fields: [
    { id: "site", type: "select", label: "出貨倉別", required: true, from: "sites" },
    { id: "order", type: "text", label: "訂單編號", required: true, ph: "如：SO-2608-0142" },
    { id: "buyer", type: "text", label: "收貨客戶" },
    { id: "items", type: "group", label: "檢驗品項", itemName: "品項", fields: [
      { id: "model", type: "text", label: "型號" },
      { id: "qty", type: "number", label: "數量" },
      { id: "judge", type: "judge", label: "檢驗結果" },
      { id: "photos", type: "photo", label: "包裝／標籤照片" },
      { id: "desc", type: "textarea", label: "異常說明" }
    ]},
    { id: "summary", type: "textarea", label: "備註" }
  ]
};

/* ─── T03 日光照明顧問：吃下原 index.html 完整 4 部門 / 20+ 卡片內容 ─── */
const T03_DEPARTMENTS = [
  { id: "design",      label: "設計部", icon: "🎨", color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "engineering", label: "工程部", icon: "🔧", color: "#F97316", bg: "#FFF7ED" },
  { id: "admin",       label: "行政部", icon: "📁", color: "#0EA5E9", bg: "#F0F9FF" },
  { id: "finance",     label: "財務部", icon: "💰", color: "#059669", bg: "#ECFDF5" },
];

/* 原 data-sample.json 內容直接內嵌（移除對外部檔案的 fetch 依賴，
   每個租戶自帶資料，不共用全域來源） */
const T03_CASE_DATA = {
  "案件列表": [
    {
      "案件名稱": "衛武營(室內)",
      "現場聯絡人": "楊欣怡小姐",
      "樓層區域清單": [
        { "樓層區域名稱": "大廳1", "設備類型清單": ["IA1", "IL1", "IL2", "IL3", "IL4", "IRC2", "IRC4-1", "IRC4-2", "IRC5"] },
        { "樓層區域名稱": "大廳2", "設備類型清單": ["IRC2", "IRC5", "IRC6", "IRC7", "IL7"] },
        { "樓層區域名稱": "大廳3", "設備類型清單": ["IRC1", "IRC2", "IRC5", "IRC6", "IML2", "IML3", "IMRC2", "IL1", "IL2", "IA2"] },
        { "樓層區域名稱": "D棟廊道", "設備類型清單": ["IL1", "IL2", "IA2", "IRC1", "IRC2", "IRC8"] },
        { "樓層區域名稱": "AB棟廊道", "設備類型清單": ["IL1", "IML2", "IML3", "IMRC1", "IMRC2", "IRC1", "IRC2", "IRC11", "IRC12"] },
        { "樓層區域名稱": "公廁前廳", "設備類型清單": ["IRC13", "IRC14"] },
        { "樓層區域名稱": "A棟梯廳", "設備類型清單": ["IRC9", "IRC10", "IRC13", "IL1"] },
        { "樓層區域名稱": "B棟梯廳", "設備類型清單": ["IRC9", "IRC10", "IRC13", "IL1"] },
        { "樓層區域名稱": "D棟梯廳", "設備類型清單": ["IRC2", "IRC8", "IRC9", "IRC10", "IL1"] },
        { "樓層區域名稱": "健身房", "設備類型清單": ["IGL1", "IGL2-1", "IGL2-2", "IGL3", "IGL4", "IGL5", "IGL6", "IGL7", "IGL8", "IGRC4", "IGRC5", "IGRC6", "IGRC7", "IRC1", "IRC2", "IRC3", "IRC11", "IGS1-1", "IGS1-2", "IIGA2"] },
        { "樓層區域名稱": "美式運動吧", "設備類型清單": ["IRL1", "IRL2", "IRL3", "IRRC1", "IRRC2", "IRRC3", "IRRC4", "IRRC5", "IRRC6", "IRA1"] },
        { "樓層區域名稱": "KTV", "設備類型清單": ["IKRC1", "IKRC2", "IKL1", "IKL2", "IKL3", "IKA1"] },
        { "樓層區域名稱": "媽媽教室", "設備類型清單": ["ISRC2", "ISRC3", "ISRC4", "ISRC5", "ISRC6", "ISA1", "ISA1"] },
        { "樓層區域名稱": "廁所", "設備類型清單": [] }
      ]
    },
    {
      "案件名稱": "平實23(外觀)",
      "現場聯絡人": "陳柏伶主任",
      "樓層區域清單": [
        { "樓層區域名稱": "A棟基座", "設備類型清單": ["ORG1", "ORG2", "ORC1", "ORC2-1", "ORC2-2", "OA1", "OS1-1", "OS1-2", "OS1-3", "OS1-4", "OS1-5", "OS1-6", "OS2"] },
        { "樓層區域名稱": "B棟基座", "設備類型清單": ["ORG1", "ORG2", "ORC1", "ORC2-1", "ORC2-2", "OA1", "OS1-1", "OS1-2", "OS1-3", "OS1-4", "OS1-5", "OS1-6", "OS2"] },
        { "樓層區域名稱": "A棟標準層3-6F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "A棟標準層7-8F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "A棟標準層9-11F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "A棟標準層12-13F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "A棟標準層14-15F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "B棟標準層3-6F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "B棟標準層7-8F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "B棟標準層9-11F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "B棟標準層12-13F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "B棟標準層14-15F", "設備類型清單": ["OS2", "OS5", "OS6", "OS3-1", "OS3-2", "OA1", "LL2"] },
        { "樓層區域名稱": "A棟頂冠層", "設備類型清單": ["OS4-1", "OS4-2", "OS4-3", "OL1"] },
        { "樓層區域名稱": "B棟頂冠層", "設備類型清單": ["OS4-1", "OS4-2", "OS4-3", "OL1"] }
      ]
    }
  ]
};

const CUSTOM_TRIGGER_PROJECTS = [
  "聯上-五福", "聯上-左西", "聯上-明仁", "聯上-停35", "聯上-博孝", "聯上-橋北",
  "慶旺-新旺", "三地平實23", "元帥府", "巴洛克-衛武營", "巴洛克-龍中134", "巴洛克-龍中191",
  "巴洛克-青海370", "清景麟-平實22", "華友聯-援中", "華友聯-果貿三", "華友聯-大山486",
  "鈦宇-仁春", "福裕-武東案", "都市-澄德65"
];

const T03_SITES = [...T03_CASE_DATA.案件列表.map(c => c.案件名稱), ...CUSTOM_TRIGGER_PROJECTS];

/* 表單卡片清單（原 index.html 的 CARDS，formKind 意義不變） */
const T03_CARDS = [
  { id:"survey",  dept:"engineering", label:"工程回報", icon:"🔧", color:"#F97316", bg:"#FFF7ED", desc:"施工拍照、施工進度紀錄", formKind:"survey" },
  { id:"meeting", dept:"engineering", label:"工地會議", icon:"👥", color:"#2563EB", bg:"#EFF6FF", desc:"會議紀錄、決議追蹤、出席人員記錄", formKind:"site_meeting" },
  { id:"install", dept:"engineering", label:"現場會勘", icon:"🔍", color:"#059669", bg:"#ECFDF5", desc:"工地進度回報、自主檢查、問題與風險預測", formKind:"install" },

  { id:"design_quote", dept:"design", label:"設計費報價表", icon:"🧾", color:"#8B5CF6", bg:"#F5F3FF", desc:"設計費用項目、金額試算與報價", formKind:"generic",
    config:{
      fields:[
        { key:"projectName", label:"案名" },
        { key:"quoteDate",   label:"報價日期", placeholder:"YYYY/MM/DD" },
        { key:"quoter",      label:"報價人員" },
        { key:"paymentTerms",label:"付款條件", placeholder:"例如：訂金30%、完工70%" }
      ],
      items:{
        label:"報價項目",
        columns:[{ key:"name", label:"項目" },{ key:"spec", label:"規格說明" },{ key:"qty", label:"數量" },{ key:"unit", label:"單位" },{ key:"price", label:"單價" },{ key:"amount", label:"小計" }],
        aggregate:{ key:"amount", type:"sum", label:"報價總金額" }
      },
      notesLabel:"備註", hasPhoto:false, sigCols:["報價人員","設計部主管","業主確認"]
    }
  },
  { id:"design_meeting", dept:"design", label:"會議記錄", icon:"👥", color:"#EC4899", bg:"#FDF2F8", desc:"設計會議紀錄、決議追蹤", formKind:"design_meeting" },
  { id:"design_survey",  dept:"design", label:"現場會勘", icon:"🔍", color:"#F59E0B", bg:"#FFFBEB", desc:"現場勘查、自主檢查、問題紀錄", formKind:"install" },
  { id:"custom_inspect", dept:"design", label:"訂製品檢測表", icon:"📐", color:"#10B981", bg:"#ECFDF5", desc:"訂製品廠驗自主檢查與評估紀錄", formKind:"customInspect" },
  { id:"light_inspect",  dept:"design", label:"照明設備檢測紀錄表", icon:"💡", color:"#8B5CF6", bg:"#F5F3FF", desc:"燈具規格、光學品質與外觀評估紀錄", formKind:"lightInspect" },
  { id:"light_analysis", dept:"design", label:"照明分析", icon:"📊", color:"#EC4899", bg:"#FDF2F8", desc:"照度、眩光與色溫等分析紀錄", formKind:"generic",
    config:{
      fields:[
        { key:"projectName", label:"案名" },{ key:"analysisArea", label:"分析區域" },{ key:"analysisDate", label:"分析日期" },
        { key:"analyst", label:"分析人員" },{ key:"lightSourceType", label:"使用光源型式" },{ key:"colorTempReq", label:"色溫需求" }
      ],
      items:{ label:"測點紀錄", columns:[{ key:"point", label:"測點" },{ key:"lux", label:"照度(Lux)" },{ key:"glare", label:"眩光評估" },{ key:"note", label:"備註" }], aggregate:{ key:"lux", type:"avg", label:"平均照度(Lux)" } },
      fieldsAfter:[{ key:"conclusion", label:"分析結論", multi:true },{ key:"suggestion", label:"建議事項", multi:true }],
      notesLabel:"備註", hasPhoto:true, photoLabel:"現場照片"
    }
  },
  { id:"photometric", dept:"design", label:"測光表", icon:"🔦", color:"#F59E0B", bg:"#FFFBEB", desc:"現場測光數據紀錄與平均照度計算", formKind:"generic",
    config:{
      fields:[
        { key:"projectName", label:"案名" },{ key:"location", label:"量測位置" },{ key:"testDate", label:"量測日期" },
        { key:"tester", label:"量測人員" },{ key:"instrument", label:"量測儀器型號" }
      ],
      items:{ label:"測點紀錄", columns:[{ key:"point", label:"測點編號" },{ key:"lux", label:"照度值(Lux)" },{ key:"note", label:"備註" }], aggregate:{ key:"lux", type:"avg", label:"平均照度(Lux)" } },
      notesLabel:"備註", hasPhoto:true, photoLabel:"測光現場照片"
    }
  },
  { id:"maintenance_plan", dept:"design", label:"維護計畫表", icon:"🛠️", color:"#10B981", bg:"#ECFDF5", desc:"設備維護排程與執行狀態追蹤", formKind:"generic",
    config:{
      fields:[
        { key:"projectName", label:"案名" },{ key:"equipmentType", label:"設備類型" },
        { key:"planCycle", label:"計畫週期", type:"select", options:["每月","每季","每半年","每年"] }
      ],
      items:{ label:"維護項目", columns:[{ key:"item", label:"維護項目" },{ key:"frequency", label:"頻率" },{ key:"owner", label:"負責人" },{ key:"lastDate", label:"上次執行日期" },{ key:"nextDate", label:"下次預定日期" },{ key:"status", label:"狀態" }] },
      notesLabel:"備註", hasPhoto:false
    }
  },

  { id:"shipment", dept:"admin", label:"出貨單", icon:"🚚", color:"#0EA5E9", bg:"#F0F9FF", desc:"出貨品項、數量與簽收紀錄", formKind:"generic",
    config:{
      fields:[{ key:"shipDate", label:"出貨日期" },{ key:"client", label:"客戶/工地名稱" },{ key:"recipient", label:"收件人" },{ key:"address", label:"出貨地址", multi:true }],
      items:{ label:"出貨項目", columns:[{ key:"name", label:"品名" },{ key:"spec", label:"規格" },{ key:"qty", label:"數量" },{ key:"unit", label:"單位" },{ key:"note", label:"備註" }] },
      notesLabel:"備註", hasPhoto:true, photoLabel:"出貨照片", sigCols:["出貨人員","收件簽收","主管審核"]
    }
  },
  { id:"purchase_order", dept:"admin", label:"訂貨單", icon:"📦", color:"#6366F1", bg:"#EEF2FF", desc:"向廠商訂購品項與金額紀錄", formKind:"generic",
    config:{
      fields:[{ key:"orderDate", label:"訂購日期" },{ key:"vendor", label:"廠商名稱" },{ key:"contact", label:"聯絡人" },{ key:"expectedDate", label:"預交日期" }],
      items:{ label:"訂購項目", columns:[{ key:"name", label:"品名" },{ key:"spec", label:"規格" },{ key:"qty", label:"數量" },{ key:"price", label:"單價" },{ key:"amount", label:"小計" }], aggregate:{ key:"amount", type:"sum", label:"訂購總金額" } },
      notesLabel:"備註", hasPhoto:false, sigCols:["申請人員","主管審核","採購核准"]
    }
  },
  { id:"return_order", dept:"admin", label:"退貨單", icon:"↩️", color:"#14B8A6", bg:"#F0FDFA", desc:"退貨原因與處理方式紀錄", formKind:"generic",
    config:{
      fields:[{ key:"returnDate", label:"退貨日期" },{ key:"party", label:"客戶/廠商" },{ key:"reason", label:"退貨原因", multi:true },{ key:"handling", label:"處理方式", type:"select", options:["退款","換貨","折讓"] }],
      items:{ label:"退貨項目", columns:[{ key:"name", label:"品名" },{ key:"spec", label:"規格" },{ key:"qty", label:"數量" },{ key:"note", label:"原因/備註" }] },
      notesLabel:"備註", hasPhoto:true, photoLabel:"退貨照片"
    }
  },
  { id:"stock_detail", dept:"admin", label:"備貨明細表", icon:"📋", color:"#F97316", bg:"#FFF7ED", desc:"備貨品項、數量與庫存狀態", formKind:"generic",
    config:{
      fields:[{ key:"projectName", label:"案名" },{ key:"prepDate", label:"備貨日期" },{ key:"requestUnit", label:"需求單位" },{ key:"owner", label:"負責人員" }],
      items:{ label:"備貨項目", columns:[{ key:"name", label:"品名" },{ key:"spec", label:"規格" },{ key:"qty", label:"數量" },{ key:"stockStatus", label:"庫存狀態" },{ key:"note", label:"備註" }] },
      notesLabel:"備註", hasPhoto:false
    }
  },

  { id:"invoice_request", dept:"finance", label:"請款單", icon:"💵", color:"#059669", bg:"#ECFDF5", desc:"請款項目、金額與付款方式紀錄", formKind:"generic",
    config:{
      fields:[{ key:"requestDate", label:"請款日期" },{ key:"vendor", label:"廠商/客戶名稱" },{ key:"paymentMethod", label:"付款方式", type:"select", options:["匯款","支票","現金"] }],
      items:{ label:"請款項目", columns:[{ key:"item", label:"項目" },{ key:"desc", label:"說明" },{ key:"amount", label:"金額" }], aggregate:{ key:"amount", type:"sum", label:"合計金額" } },
      notesLabel:"備註", hasPhoto:false, sigCols:["申請人","部門主管","財務覆核","核准"]
    }
  },
  { id:"payroll", dept:"finance", label:"薪資表", icon:"🧾", color:"#0891B2", bg:"#ECFEFF", desc:"員工薪資項目與應付總額試算", formKind:"generic",
    config:{
      fields:[{ key:"employeeName", label:"員工姓名" },{ key:"department", label:"部門" },{ key:"month", label:"月份" },{ key:"baseSalary", label:"底薪" },{ key:"overtime", label:"加班費" },{ key:"bonus", label:"獎金" }],
      items:{ label:"扣款項目", columns:[{ key:"item", label:"扣款項目" },{ key:"amount", label:"金額" }], aggregate:{ key:"amount", type:"sum", label:"扣款總額" } },
      fieldsAfter:[{ key:"netPay", label:"應付總額（手動填寫）" }],
      notesLabel:"備註", hasPhoto:false, sigCols:["員工簽名","主管審核","財務審核"]
    }
  },
  { id:"payable_ledger", dept:"finance", label:"應付登記表", icon:"📕", color:"#7C3AED", bg:"#F5F3FF", desc:"廠商應付款項登記與追蹤", formKind:"generic",
    config:{
      fields:[{ key:"vendor", label:"廠商名稱" }],
      items:{ label:"應付明細", columns:[{ key:"docNo", label:"單據編號" },{ key:"date", label:"日期" },{ key:"summary", label:"摘要" },{ key:"amount", label:"金額" },{ key:"status", label:"付款狀態" }], aggregate:{ key:"amount", type:"sum", label:"應付總額" } },
      notesLabel:"備註", hasPhoto:false
    }
  },
  { id:"receivable_ledger", dept:"finance", label:"應收登記表", icon:"📗", color:"#DC2626", bg:"#FEF2F2", desc:"客戶應收款項登記與追蹤", formKind:"generic",
    config:{
      fields:[{ key:"client", label:"客戶名稱" }],
      items:{ label:"應收明細", columns:[{ key:"docNo", label:"單據編號" },{ key:"date", label:"日期" },{ key:"summary", label:"摘要" },{ key:"amount", label:"金額" },{ key:"status", label:"收款狀態" }], aggregate:{ key:"amount", type:"sum", label:"應收總額" } },
      notesLabel:"備註", hasPhoto:false
    }
  },
];
(function addPlaceholders() {
  const ADMIN_PLACEHOLDER_CODES = ["ADM-05","ADM-06","ADM-07","ADM-08"];
  const ADMIN_PLACEHOLDER_COLORS = ["#0EA5E9","#6366F1","#14B8A6","#F97316"];
  ADMIN_PLACEHOLDER_CODES.forEach((code, i) => {
    T03_CARDS.push({
      id: `admin_ph_${i + 1}`, dept:"admin", label:`行政表單（代號：${code}）`, icon:"📄",
      color: ADMIN_PLACEHOLDER_COLORS[i % ADMIN_PLACEHOLDER_COLORS.length], bg:"#F8FAFC",
      desc:"表單名稱與欄位尚待確認，暫作為預留項目", formKind:"generic",
      config:{ fields:[{ key:"title", label:"表單名稱（待補）" },{ key:"docDate", label:"日期" },{ key:"handler", label:"經辦人員" }], notesLabel:"備註", hasPhoto:false }
    });
  });
  const FINANCE_PLACEHOLDER_CODES = ["FIN-05","FIN-06","FIN-07","FIN-08","FIN-09","FIN-10"];
  const FINANCE_PLACEHOLDER_COLORS = ["#059669","#0891B2","#7C3AED","#DC2626","#0EA5E9","#6366F1"];
  FINANCE_PLACEHOLDER_CODES.forEach((code, i) => {
    T03_CARDS.push({
      id: `finance_ph_${i + 1}`, dept:"finance", label:`財務表單（代號：${code}）`, icon:"📄",
      color: FINANCE_PLACEHOLDER_COLORS[i % FINANCE_PLACEHOLDER_COLORS.length], bg:"#F8FAFC",
      desc:"表單名稱與欄位尚待確認，暫作為預留項目", formKind:"generic",
      config:{ fields:[{ key:"title", label:"表單名稱（待補）" },{ key:"docDate", label:"日期" },{ key:"handler", label:"經辦人員" }], notesLabel:"備註", hasPhoto:false }
    });
  });
})();

/* ─── T04 天然氣管路規劃公司（新增，示範產業） ─── */
const T04_DEPARTMENTS = [
  { id:"construction", label:"工務部", icon:"🛠️", color:"#F97316", bg:"#FFF7ED" },
  { id:"admin",         label:"行政部", icon:"📁", color:"#0EA5E9", bg:"#F0F9FF" },
  { id:"materials",     label:"資材部", icon:"📦", color:"#059669", bg:"#ECFDF5" },
];

const T04_CARDS = [
  { id:"pre_survey", dept:"construction", label:"前勘紀錄表", icon:"🔍", color:"#F97316", bg:"#FFF7ED", desc:"現場勘查、路徑與地下管線套圖確認", formKind:"generic",
    config:{
      fields:[
        { key:"projectName", label:"案名" },{ key:"surveyDate", label:"勘查日期", placeholder:"YYYY/MM/DD" },
        { key:"surveyor", label:"勘查工程師" },
        { key:"pressureLevel", label:"管線壓力等級", type:"select", options:["高壓","中壓","低壓"] },
        { key:"undergroundConflict", label:"既有地下管線套圖結果", multi:true }
      ],
      notesLabel:"備註", hasPhoto:true, photoLabel:"現場照片"
    }
  },
  { id:"tbm_checkin", dept:"construction", label:"TBM 工安簽到", icon:"🦺", color:"#DC2626", bg:"#FEF2F2", desc:"開工前工具箱會議、GPS定位、防護具checklist、危險告知簽名", formKind:"tbm" },
  { id:"daily_log", dept:"construction", label:"施工日報", icon:"📝", color:"#0EA5E9", bg:"#F0F9FF", desc:"開挖/鋪管/銲接進度回報，AI 協助判讀施工品質", formKind:"generic",
    aiJudge:{ rule:"你是天然氣管線施工品管助理。請依照片判斷：開挖斷面與回填是否符合規範、管線銲接工法是否有明顯瑕疵、警示帶鋪設是否確實。" },
    config:{
      fields:[
        { key:"projectName", label:"案名" },{ key:"logDate", label:"日期", placeholder:"YYYY/MM/DD" },{ key:"crew", label:"施工班組/人員" },
        { key:"excavationM", label:"開挖米數" },{ key:"pipeLaidM", label:"鋪管米數" },{ key:"weldCount", label:"銲接點數" },
        { key:"weldNo", label:"銲頭編號（本次）" }
      ],
      items:{ label:"回填紀錄", columns:[{ key:"section", label:"區段" },{ key:"layer", label:"分層回填" },{ key:"compaction", label:"壓實狀況" },{ key:"note", label:"備註" }] },
      notesLabel:"異常說明（如遇未知地下障礙物）", hasPhoto:true, photoLabel:"開挖/銲接/警示帶照片", sigCols:["施工人員","工地主任"]
    }
  },
  { id:"pressure_test", dept:"construction", label:"品管壓測表", icon:"📊", color:"#7C3AED", bg:"#F5F3FF", desc:"耐壓/氣密試驗、NDT銲接檢測、合格判定與簽名", formKind:"pressureTest" },
  { id:"commissioning", dept:"construction", label:"通氣置換與竣工移交", icon:"🔥", color:"#EA580C", bg:"#FFF7ED", desc:"氮氣吹驅記錄、點火測試、GIS座標、聯驗簽名", formKind:"generic",
    config:{
      fields:[
        { key:"projectName", label:"案名" },{ key:"purgeDate", label:"氮氣吹驅日期", placeholder:"YYYY/MM/DD" },
        { key:"purgeResult", label:"吹驅排空結果" },{ key:"ignitionTest", label:"點火測試結果", type:"select", options:["正常","異常"] },
        { key:"gisCoord", label:"GIS 座標（as-built）", placeholder:"經度,緯度" }
      ],
      notesLabel:"備註", hasPhoto:true, photoLabel:"通氣/點火現場照片", sigCols:["工地主任","業主/監造","天然氣事業單位聯驗"]
    }
  },

  { id:"row_permit", dept:"admin", label:"路權與許可證追蹤表", icon:"📜", color:"#0EA5E9", bg:"#F0F9FF", desc:"道路挖掘許可證號、交維計畫核備、路權期限狀態", formKind:"generic",
    config:{
      fields:[
        { key:"projectName", label:"案名" },{ key:"permitNo", label:"道路挖掘許可證號" },
        { key:"trafficPlan", label:"交維計畫核備函文號" },{ key:"rowExpiry", label:"路權期限", placeholder:"YYYY/MM/DD" },
        { key:"status", label:"狀態", type:"select", options:["申請中","已核准","即將到期","已到期"] }
      ],
      notesLabel:"備註", hasPhoto:false
    }
  },
  { id:"joint_survey", dept:"admin", label:"地下管線聯合會勘記錄", icon:"🗺️", color:"#6366F1", bg:"#EEF2FF", desc:"與水電/電信/排水等單位聯合會勘紀錄", formKind:"generic",
    config:{
      fields:[{ key:"projectName", label:"案名" },{ key:"surveyDate", label:"會勘日期", placeholder:"YYYY/MM/DD" },{ key:"attendUnits", label:"與會單位", multi:true }],
      items:{ label:"套圖比對結果", columns:[{ key:"item", label:"既有管線類別" },{ key:"conflict", label:"衝突/淨距結果" },{ key:"note", label:"備註" }] },
      notesLabel:"結論", hasPhoto:true, photoLabel:"會勘現場照片", sigCols:["本公司代表","水電代表","電信代表","業主/監造"]
    }
  },

  { id:"material_use", dept:"materials", label:"領料與扣庫回報", icon:"📦", color:"#059669", bg:"#ECFDF5", desc:"現場用料與機具運作時數回報", formKind:"generic",
    config:{
      fields:[{ key:"projectName", label:"案名" },{ key:"useDate", label:"日期", placeholder:"YYYY/MM/DD" },{ key:"handler", label:"經辦人員" }],
      items:{ label:"材料/機具明細", columns:[{ key:"name", label:"品名/機具" },{ key:"spec", label:"規格" },{ key:"qty", label:"數量/時數" },{ key:"unit", label:"單位" },{ key:"note", label:"備註（退庫/使用時數）" }] },
      notesLabel:"備註", hasPhoto:false
    }
  },
  { id:"cert_tracking", dept:"materials", label:"人員機具證照校期管理表", icon:"🪪", color:"#F97316", bg:"#FFF7ED", desc:"銲工證/勞安證照、機具校正效期管理", formKind:"generic",
    config:{
      fields:[{ key:"checkDate", label:"盤點日期", placeholder:"YYYY/MM/DD" },{ key:"handler", label:"經辦人員" }],
      items:{ label:"證照/校正清單", columns:[{ key:"target", label:"人員/機具" },{ key:"certType", label:"證照/校正類型" },{ key:"expiry", label:"到期日" },{ key:"status", label:"狀態" }] },
      notesLabel:"備註", hasPhoto:false
    }
  },
];

const T04_SITES = ["中山幹管新設", "文心路瓦斯延管", "五權新村商辦接管", "大雅重劃區道路埋設", "文心森林公園旁建案接管"];

/* ─── 租戶主表 ─── */
const TENANTS = [
  {
    id:"T01", name:"巴洛克建設", industry:"建商／不動產開發",
    accounts:[
      { code:"T01-A", password:"demo1234", role:"admin" },
      { code:"T01-O", password:"demo1234", role:"office" },
      { code:"T01-F", password:"demo1234", role:"field" },
    ],
    staff:["王建成","李佩玲","張志豪"], mgr:"陳協理",
    departments:[{ id:"site", label:"工地巡檢", icon:"🏗️", color:"#F0793A", bg:"#FFF3EC" }],
    cards:[{ id:"t01_form", dept:"site", label:T01_SCHEMA.title, icon:"🏗️", color:"#F0793A", bg:"#FFF3EC", desc:"現場巡檢動態欄位表單（可由管理者調整）", formKind:"dynamicSchema", noPdf:true,
      aiJudge:{ rule:T01_SCHEMA.aiRule }, config:{ schema:T01_SCHEMA } }],
    sites: T01_SCHEMA.sites,
  },
  {
    id:"T02", name:"光宇燈具", industry:"燈具批發商",
    accounts:[
      { code:"T02-A", password:"demo1234", role:"admin" },
      { code:"T02-O", password:"demo1234", role:"office" },
      { code:"T02-F", password:"demo1234", role:"field" },
    ],
    staff:["林倉管","黃出貨","吳司機"], mgr:"周經理",
    departments:[{ id:"ship", label:"出貨檢驗", icon:"🚚", color:"#0EA5E9", bg:"#F0F9FF" }],
    cards:[{ id:"t02_form", dept:"ship", label:T02_SCHEMA.title, icon:"🚚", color:"#0EA5E9", bg:"#F0F9FF", desc:"出貨動態欄位表單（可由管理者調整）", formKind:"dynamicSchema", noPdf:true,
      aiJudge:{ rule:T02_SCHEMA.aiRule }, config:{ schema:T02_SCHEMA } }],
    sites: T02_SCHEMA.sites,
  },
  {
    id:"T03", name:"日光照明顧問", industry:"工程顧問／設計",
    accounts:[
      { code:"T03-A", password:"demo1234", role:"admin" },
      { code:"T03-O", password:"demo1234", role:"office" },
      { code:"T03-F", password:"demo1234", role:"field" },
    ],
    staff:["翁明騰","蔡璧澤","曾玉麟","黃國隆","郭毓斌"], mgr:"李部長",
    departments: T03_DEPARTMENTS,
    cards: T03_CARDS,
    caseData: T03_CASE_DATA,
    sites: T03_SITES,
  },
  {
    id:"T04", name:"天然氣管路規劃公司", industry:"天然氣管線工程",
    accounts:[
      { code:"T04-A", password:"demo1234", role:"admin" },
      { code:"T04-O", password:"demo1234", role:"office" },
      { code:"T04-F", password:"demo1234", role:"field" },
    ],
    staff:["洪工班長","陳銲工","林工務員"], mgr:"許主任",
    departments: T04_DEPARTMENTS,
    cards: T04_CARDS,
    sites: T04_SITES,
  },
];
