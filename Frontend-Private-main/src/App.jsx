import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// استيراد خط Tajawal
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// بدل localhost، حط الـ IP مالتك
const API_TASKS = "http://192.168.68.61:5183/api/tasks";
const API_AUTH = "http://192.168.68.61:5183/api/Auth";

const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Calendar: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" ry="2"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, completed, overdue
  const [isLoginView, setIsLoginView] = useState(true);
  const [authData, setAuthData] = useState({ username: "", password: "" });
  const [editingId, setEditingId] = useState(null);

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  // --- Auth Functions ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? "login" : "register";
    try {
      const res = await axios.post(`${API_AUTH}/${endpoint}`, authData);
      if (isLoginView) {
        localStorage.setItem("token", res.data);
        setToken(res.data);
        toast.success("مرحباً بك ! 👋");
      } else { 
        toast.info("تم إنشاء الحساب! سجل دخولك الآن");
        setIsLoginView(true); 
      }
    } catch (err) { toast.error("خطأ في البيانات "); }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setTasks([]);
    toast.info("تم تسجيل الخروج");
  };

  // --- Task Functions ---
  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(API_TASKS, authConfig);
      setTasks(res.data);
    } catch (err) { 
      if(err.response?.status === 401) logout();
      else toast.error("فشل جلب المهام");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [token]);

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      if (editingId) {
        await axios.put(`${API_TASKS}/${editingId}`, { id: editingId, title, status: 0, dueDate: dueDate || null }, authConfig);
        toast.success("تم التحديث بنجاح! ✨");
        setEditingId(null);
      } else {
        await axios.post(API_TASKS, { title, status: 0, dueDate: dueDate || null }, authConfig);
        toast.success("تمت إضافة المهمة! 🚀");
      }
      setTitle(""); setDueDate(""); fetchTasks();
    } catch (err) { toast.error("حدث خطأ في الحفظ"); }
  };

  const toggleComplete = async (id) => {
    try {
      const res = await axios.put(`${API_TASKS}/${id}/complete`, {}, authConfig);
      setTasks(tasks.map(t => t.id === id ? res.data : t));
    } catch (err) { toast.error("خطأ في تحديث الحالة"); }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_TASKS}/${id}`, authConfig);
      setTasks(tasks.filter(task => task.id !== id));
      toast.info("تم حذف المهمة 🗑️");
    } catch (err) { toast.error("فشل الحذف"); fetchTasks(); }
  };

  // --- Helpers & Logic ---
  const isCompleted = (task) => task.status === 2 || task.status === "Completed";

  const getStatusStyle = (task) => {
    if (isCompleted(task)) return { color: "#2ecc71", label: "مكتملة" };
    if (!task.dueDate) return { color: "#3498db", label: "مستمرة" };
    const today = new Date().setHours(0,0,0,0);
    const taskDate = new Date(task.dueDate).setHours(0,0,0,0);
    if (taskDate < today) return { color: "#e84118", label: "متأخرة!" };
    if (taskDate === today) return { color: "#f1c40f", label: "اليوم!" };
    return { color: "#3498db", label: "مستمرة" };
  };

  // Stats
  const completedCount = tasks.filter(isCompleted).length;
  const overdueCount = tasks.filter(t => !isCompleted(t) && t.dueDate && new Date(t.dueDate) < new Date().setHours(0,0,0,0)).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Filter Logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    const completed = isCompleted(t);
    const today = new Date().setHours(0,0,0,0);
    const taskDate = t.dueDate ? new Date(t.dueDate).setHours(0,0,0,0) : null;
    const isOverdue = !completed && taskDate && taskDate < today;

    if (filter === "completed") return completed;
    if (filter === "active") return !completed && !isOverdue;
    if (filter === "overdue") return isOverdue;
    return true;
  });

  if (!token) {
    return (
      <div style={styles.container}>
        <ToastContainer position="top-center" autoClose={2000} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.card}>
          <h1 style={styles.header}>{isLoginView ? "🔐 دخول " : "📝 حساب جديد"}</h1>
          <form onSubmit={handleAuth} style={styles.addForm}>
            <input type="text" placeholder="اسم المستخدم" style={styles.searchInput} required onChange={e => setAuthData({...authData, username: e.target.value})} />
            <input type="password" placeholder="كلمة المرور" style={styles.searchInput} required onChange={e => setAuthData({...authData, password: e.target.value})} />
            <button type="submit" style={styles.addBtn}>{isLoginView ? "دخول" : "تسجيل"}</button>
          </form>
          <p onClick={() => setIsLoginView(!isLoginView)} style={styles.switchText}>{isLoginView ? "ما عندك حساب؟ سجل هنا" : "عندك حساب؟ ادخل من هنا"}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{...styles.card, maxWidth: '550px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
           <h1 style={{...styles.header, marginBottom: 0}}>✨ مهامي الذكية</h1>
           <button onClick={logout} style={styles.logoutBtn} title="خروج"><Icons.Logout /></button>
        </div>
        
        <div style={styles.statsRow}>
          <div style={{...styles.statCard, borderBottom: '3px solid #3498db'}}><span>الكل</span><b>{tasks.length}</b></div>
          <div style={{...styles.statCard, borderBottom: '3px solid #e84118'}}><span>متأخر</span><b>{overdueCount}</b></div>
          <div style={{...styles.statCard, borderBottom: '3px solid #2ecc71'}}><span>إنجاز</span><b>{progressPercent}%</b></div>
        </div>

        <div style={styles.searchContainer}>
          <div style={styles.searchIcon}><Icons.Search /></div>
          <input type="text" placeholder="ابحث عن مهمة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
        </div>

        <div style={styles.filterBar}>
          <button onClick={() => setFilter("all")} style={{...styles.filterBtn, backgroundColor: filter === "all" ? "#3498db" : "#f1f2f6", color: filter === "all" ? "#fff" : "#7f8c8d"}}>الكل</button>
          <button onClick={() => setFilter("active")} style={{...styles.filterBtn, backgroundColor: filter === "active" ? "#3498db" : "#f1f2f6", color: filter === "active" ? "#fff" : "#7f8c8d"}}>مستمرة</button>
          <button onClick={() => setFilter("completed")} style={{...styles.filterBtn, backgroundColor: filter === "completed" ? "#2ecc71" : "#f1f2f6", color: filter === "completed" ? "#fff" : "#7f8c8d"}}>مكتملة</button>
          <button onClick={() => setFilter("overdue")} style={{...styles.filterBtn, backgroundColor: filter === "overdue" ? "#e84118" : "#f1f2f6", color: filter === "overdue" ? "#fff" : "#7f8c8d"}}>متأخرة ⚠️</button>
        </div>

        <form onSubmit={handleSaveTask} style={styles.addForm}>
          <div style={styles.inputWrapper}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={editingId ? "تعديل المهمة..." : "ماذا تريد أن تنجز؟"} style={styles.addInput} />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={styles.dateInput} />
          </div>
          <motion.button whileHover={{ scale: 1.01 }} type="submit" style={{...styles.addBtn, backgroundColor: editingId ? '#f39c12' : '#3498db'}}>
            {editingId ? "تحديث التغييرات" : "إضافة المهمة"}
          </motion.button>
          {editingId && <button type="button" onClick={() => {setEditingId(null); setTitle(""); setDueDate("");}} style={styles.cancelBtn}>إلغاء</button>}
        </form>

        <div style={styles.taskList}>
          {loading ? (
            <div style={styles.loadingWrapper}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={styles.spinner} />
              <p>لحظة ، جاي نجيب البيانات...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.emptyState}>
              <span style={{ fontSize: "50px" }}>☕</span>
              <h3>{searchTerm || filter !== "all" ? "ماكو نتائج!" : "عاشت إيدك !"}</h3>
              <p>{searchTerm || filter !== "all" ? "جرب تغير الفلتر أو البحث" : "ما عندك مهام اليوم، استريح واشرب شاي."}</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredTasks.map(t => {
                const status = getStatusStyle(t);
                return (
                  <motion.div key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ ...styles.taskCard, borderRight: `5px solid ${status.color}`, backgroundColor: isCompleted(t) ? "#fafffb" : "#fff" }}
                  >
                    <div style={styles.taskInfo}>
                      <div onClick={() => toggleComplete(t.id)} style={{ ...styles.checkBox, backgroundColor: isCompleted(t) ? "#2ecc71" : "transparent", borderColor: isCompleted(t) ? "#2ecc71" : "#dcdde1" }}>
                        {isCompleted(t) && <Icons.Check />}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ ...styles.taskTitle, textDecoration: isCompleted(t) ? "line-through" : "none", color: isCompleted(t) ? "#bdc3c7" : "#2d3436" }}>{t.title}</span>
                        <small style={{color: status.color, fontSize: '11px', fontWeight: 'bold'}}>{status.label} {t.dueDate && `• ${new Date(t.dueDate).toLocaleDateString('ar-EG')}`}</small>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      {!isCompleted(t) && <button onClick={() => {setEditingId(t.id); setTitle(t.title); setDueDate(t.dueDate?.split('T')[0] || "");}} style={styles.actionBtn}><Icons.Edit /></button>}
                      <button onClick={() => deleteTask(t.id)} style={{...styles.actionBtn, color: '#e84118'}}><Icons.Trash /></button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  // 1. الخلفية الكبيرة (بدل السواد)
  container: { 
    minHeight: "100vh", 
    width: "100%", 
    backgroundColor: "#f0f2f5", // لون رمادي فاتح جداً واحترافي
    display: "flex", 
    justifyContent: "center", 
    alignItems: "flex-start", // يبدأ من الأعلى عشان لو المهام كثرت
    padding: "60px 20px", 
    fontFamily: "'Tajawal', sans-serif", 
    direction: "rtl",
    boxSizing: "border-box"
  },

  // 2. الكرت الرئيسي (صار أعرض وأفخم)
  card: { 
    backgroundColor: "#fff", 
    width: "100%", 
    maxWidth: "900px", // كبرنا العرض من 480 إلى 900 عشان يملي الشاشة
    padding: "40px", 
    borderRadius: "32px", 
    boxShadow: "0 20px 60px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },

  // 3. الإحصائيات (توزعت براحتها)
  statsRow: { 
    display: 'flex', 
    gap: '20px', 
    marginBottom: '10px',
    flexWrap: 'wrap' // عشان لو فتحته من الموبايل تترتب تلقائياً
  },

  statCard: { 
    flex: 1, 
    minWidth: '120px',
    backgroundColor: '#fff', 
    padding: '20px', 
    borderRadius: '20px', 
    textAlign: 'center', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px',
    border: '1px solid #f0f0f0',
    boxShadow: "0 4px 10px rgba(0,0,0,0.02)"
  },

  header: { textAlign: "center", fontSize: "28px", color: "#2f3640", marginBottom: "10px", fontWeight: "800" },

  searchContainer: { position: "relative", marginBottom: "5px" },
  searchIcon: { position: "absolute", right: "15px", top: "14px", color: "#bdc3c7" },
  searchInput: { 
    width: "100%", 
    padding: "14px 45px 14px 15px", 
    borderRadius: "16px", 
    border: "1.5px solid #eee", 
    outline: "none", 
    boxSizing: "border-box", 
    fontSize: "16px",
    transition: "0.3s focus",
    backgroundColor: "#fdfdfd"
  },

  filterBar: { display: 'flex', gap: '10px', marginBottom: '10px', justifyContent: 'center', flexWrap: 'wrap' },
  filterBtn: { 
    border: 'none', 
    padding: '8px 18px', 
    borderRadius: '25px', 
    cursor: 'pointer', 
    fontSize: '13px', 
    fontWeight: '600', 
    transition: '0.3s' 
  },

  addForm: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" },
  inputWrapper: { 
    display: "flex", 
    border: "1.5px solid #eee", 
    borderRadius: "16px", 
    overflow: "hidden",
    backgroundColor: "#fff"
  },
  addInput: { flex: 1, padding: "15px", border: "none", outline: "none", fontSize: "16px" },
  dateInput: { border: "none", outline: "none", padding: "0 15px", color: "#7f8c8d", fontSize: "13px", cursor: "pointer", backgroundColor: "#fafafa" },
  
  addBtn: { 
    color: "#fff", 
    border: "none", 
    padding: "15px", 
    borderRadius: "16px", 
    cursor: "pointer", 
    fontWeight: "700", 
    fontSize: "16px",
    boxShadow: "0 8px 20px rgba(52, 152, 219, 0.3)" 
  },

  cancelBtn: { backgroundColor: '#f1f2f6', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px' },
  logoutBtn: { 
    backgroundColor: "#fff", 
    border: "1px solid #fee", 
    color: "#e84118", 
    padding: "10px", 
    borderRadius: "12px", 
    cursor: "pointer", 
    boxShadow: "0 4px 10px rgba(0,0,0,0.03)" 
  },

  switchText: { textAlign: "center", marginTop: "10px", color: "#3498db", cursor: "pointer", fontSize: "14px" },
  
  taskList: { display: "flex", flexDirection: "column", gap: "15px", minHeight: '100px' },
  
  taskCard: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: "20px", 
    borderRadius: "20px", 
    boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
    transition: "0.3s" 
  },

  taskInfo: { display: "flex", alignItems: "center", gap: "15px", flex: 1 },
  checkBox: { 
    width: "24px", 
    height: "24px", 
    borderRadius: "8px", 
    border: "2px solid", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    transition: "0.2s"
  },

  taskTitle: { fontSize: "17px", fontWeight: "600" },
  dueDateLabel: { fontSize: "12px", color: "#95a5a6", display: "flex", alignItems: "center", gap: "5px", marginTop: "5px" },
  actionBtn: { background: 'none', border: 'none', color: '#bdc3c7', cursor: 'pointer', padding: "5px" },
  
  loadingWrapper: { textAlign: "center", padding: "50px", color: "#7f8c8d" },
  spinner: { width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #3498db", borderRadius: "50%", margin: "0 auto 15px" },
  emptyState: { textAlign: "center", padding: "50px", backgroundColor: "#fcfcfc", borderRadius: "24px", color: "#7f8c8d", border: "1px dashed #eee" },
};

export default App;