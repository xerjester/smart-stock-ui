import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ⚠️ เปลี่ยนเป็นลิงก์ Vercel ของคุณเหมือนเดิมนะครับ
const BASE_URL = 'https://smart-stock-xerjesters-projects.vercel.app/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('username') || '');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginStatus, setLoginStatus] = useState({ loading: false, error: '' });

  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [dashboardView, setDashboardView] = useState('summary'); 
  const [stocks, setStocks] = useState([]);
  const [detailedLots, setDetailedLots] = useState([]); 
  const [historyLogs, setHistoryLogs] = useState([]);
  const [chemicals, setChemicals] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [newChemData, setNewChemData] = useState({ chemical_code: '', name: '', base_unit: 'Bottle', minimum_level: '' });
  const [chemStatus, setChemStatus] = useState({ type: '', message: '' });

  const [receiveData, setReceiveData] = useState({ chemical_id: '', batch_number: '', quantity: '', expiration_date: '' });
  const [receiveStatus, setReceiveStatus] = useState({ type: '', message: '' });

  const [dispenseData, setDispenseData] = useState({ chemical_id: '', quantity: '' });
  const [dispenseStatus, setDispenseStatus] = useState({ type: '', message: '', details: [] });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAllData();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      const [summaryRes, lotsRes, chemRes, histRes] = await Promise.all([
        axios.get(`${BASE_URL}/inventory/balance`),
        axios.get(`${BASE_URL}/inventory/lots`),
        axios.get(`${BASE_URL}/chemicals`),
        axios.get(`${BASE_URL}/inventory/history`)
      ]);
      setStocks(summaryRes.data.data || []);
      setDetailedLots(lotsRes.data.data || []);
      
      const chemList = chemRes.data.data || [];
      setChemicals(chemList);
      if (chemList.length > 0) {
        setReceiveData(prev => ({ ...prev, chemical_id: chemList[0].ID }));
        setDispenseData(prev => ({ ...prev, chemical_id: chemList[0].ID }));
      }
      setHistoryLogs(histRes.data.data || []);
    } catch (err) { 
      console.error(err);
      if (err.response?.status === 401) handleLogout(); 
    } finally { 
      setLoadingData(false); 
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginStatus({ loading: true, error: '' });
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, loginData);
      const { token, username } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      setToken(token);
      setCurrentUser(username);
    } catch (err) {
      setLoginStatus({ loading: false, error: err.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken('');
    setCurrentUser('');
  };

  const handleAddChemicalSubmit = async (e) => {
    e.preventDefault();
    setChemStatus({ type: 'loading', message: 'กำลังบันทึก...' });
    try {
      await axios.post(`${BASE_URL}/chemicals`, { ...newChemData, minimum_level: parseFloat(newChemData.minimum_level) });
      setChemStatus({ type: 'success', message: 'เพิ่มรายการสำเร็จ!' });
      setNewChemData({ chemical_code: '', name: '', base_unit: 'Bottle', minimum_level: '' });
      fetchAllData();
      setTimeout(() => setChemStatus({type: '', message: ''}), 3000);
    } catch (err) { setChemStatus({ type: 'error', message: 'บันทึกล้มเหลว' }); }
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    setReceiveStatus({ type: 'loading', message: 'กำลังบันทึก...' });
    try {
      await axios.post(`${BASE_URL}/inventory/receive`, { ...receiveData, quantity: parseFloat(receiveData.quantity), user_id: currentUser });
      setReceiveStatus({ type: 'success', message: 'รับเข้าสำเร็จ!' });
      setReceiveData(prev => ({ ...prev, batch_number: '', quantity: '', expiration_date: '' }));
      fetchAllData(); 
      setTimeout(() => setReceiveStatus({type: '', message: ''}), 3000);
    } catch (err) { setReceiveStatus({ type: 'error', message: 'บันทึกล้มเหลว' }); }
  };

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();
    setDispenseStatus({ type: 'loading', message: 'กำลังตัดสต๊อก...', details: [] });
    try {
      const res = await axios.post(`${BASE_URL}/inventory/dispense`, { ...dispenseData, quantity: parseFloat(dispenseData.quantity), user_id: currentUser });
      setDispenseStatus({ type: 'success', message: 'เบิกจ่ายสำเร็จ!', details: res.data.dispensed_details });
      setDispenseData(prev => ({ ...prev, quantity: '' }));
      fetchAllData(); 
    } catch (err) { setDispenseStatus({ type: 'error', message: 'เบิกล้มเหลว: ' + (err.response?.data?.error || err.message) }); }
  };

  // =========================================================
  // 1. หน้าจอ Login (Responsive)
  // =========================================================
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans relative overflow-hidden px-4">
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 sm:w-96 sm:h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-72 h-72 sm:w-96 sm:h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 w-full max-w-md relative z-10">
          <div className="text-center mb-8 sm:mb-10">
            <div className="bg-indigo-600 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl mx-auto mb-4 shadow-lg shadow-indigo-200">🧪</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">SMART-STOCK</h1>
            <p className="text-slate-500 mt-2 text-sm sm:text-base font-medium">เข้าสู่ระบบการจัดการคลังสินค้า</p>
          </div>
          
          {loginStatus.error && (
            <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-xl mb-6 text-xs sm:text-sm font-medium border border-red-100 flex items-center gap-2">
              <span className="text-base sm:text-lg">⚠️</span> {loginStatus.error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">ชื่อผู้ใช้งาน</label>
              <input type="text" required value={loginData.username} onChange={(e) => setLoginData({...loginData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm sm:text-base" placeholder="Username" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">รหัสผ่าน</label>
              <input type="password" required value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm sm:text-base" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loginStatus.loading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200 text-sm sm:text-base">
              {loginStatus.loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================
  // 2. หน้าจอหลัก (Responsive Dashboard)
  // =========================================================
  
  // 📱 ปุ่มเมนู ปรับให้ไม่หดตัว (shrink-0) เพื่อให้เลื่อนซ้ายขวาบนมือถือได้
  const TabBtn = ({ id, icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
      >
        <span className="text-base sm:text-lg">{icon}</span> {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 pb-10">
      
      {/* 🚀 Top Navigation (Responsive) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          {/* ส่วนหัวโลโก้ และโปรไฟล์ผู้ใช้ */}
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-indigo-600 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-md shadow-indigo-200">🧪</div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">SMART-STOCK</h1>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 bg-slate-50 py-1 sm:py-1.5 px-2 sm:px-3 rounded-full border border-slate-200">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold">
                  {currentUser.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 hidden sm:block">{currentUser}</span>
              </div>
              <button onClick={handleLogout} className="text-xs sm:text-sm text-slate-500 hover:text-rose-600 font-semibold transition-colors">ออก</button>
            </div>
          </div>

          {/* ส่วนแถบเมนู (เลื่อนซ้ายขวาได้บนมือถือ) */}
          <div className="px-4 sm:px-6 pb-2 pt-1 overflow-x-auto flex space-x-1 sm:bg-slate-50 sm:p-1.5 sm:rounded-2xl sm:border sm:border-slate-100 sm:m-4 sm:mt-0 sm:w-fit custom-scrollbar">
            <TabBtn id="dashboard" icon="📊" label="ภาพรวม" />
            <TabBtn id="add_chem" icon="✨" label="รายการใหม่" />
            <TabBtn id="receive" icon="📥" label="รับเข้า" />
            <TabBtn id="dispense" icon="📤" label="เบิกจ่าย" />
            <TabBtn id="history" icon="🕒" label="ประวัติ" />
          </div>
        </div>
      </nav>

      {/* 📦 Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 mt-2 sm:mt-4">
        
        {/* --- 📊 แดชบอร์ด --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">ภาพรวมคลังสินค้า</h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">ติดตามยอดคงเหลือสารเคมีทั้งหมดแบบเรียลไทม์</p>
              </div>
              <button onClick={fetchAllData} className="w-full sm:w-auto flex justify-center items-center gap-2 text-xs sm:text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2.5 sm:py-2 rounded-xl hover:bg-indigo-100 transition-colors">
                🔄 รีเฟรชข้อมูล
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="inline-flex bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                  <button onClick={() => setDashboardView('summary')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${dashboardView === 'summary' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>สรุปยอดรวม</button>
                  <button onClick={() => setDashboardView('detailed')} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${dashboardView === 'detailed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>แสดงแยกตามล็อต</button>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">รหัส</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[120px]">ชื่อสารเคมี</th>
                      {dashboardView === 'detailed' && <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">หมายเลขล็อต</th>}
                      {dashboardView === 'detailed' && <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">วันหมดอายุ</th>}
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingData ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium text-sm">กำลังโหลดข้อมูล...</td></tr> : 
                     (dashboardView === 'summary' ? stocks : detailedLots).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap">{item.chemical_code}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 font-medium">{item.name}</td>
                        {dashboardView === 'detailed' && <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-500 whitespace-nowrap"><span className="bg-slate-100 px-2 py-1 rounded-md font-mono text-[10px] sm:text-xs">{item.batch_number}</span></td>}
                        {dashboardView === 'detailed' && <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-amber-600 whitespace-nowrap">{item.expiration_date}</td>}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right whitespace-nowrap">
                          <span className="font-bold text-base sm:text-lg text-indigo-600">{dashboardView === 'summary' ? item.total_remain : item.quantity_remain}</span>
                          <span className="text-slate-400 ml-1 sm:ml-1.5 text-[10px] sm:text-xs">{item.base_unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- ✨ ฟอร์มเพิ่มสารเคมี (Responsive Grid) --- */}
        {activeTab === 'add_chem' && (
          <div className="max-w-2xl mx-auto">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-slate-100">
                <div className="bg-indigo-100 text-indigo-600 p-2 sm:p-2.5 rounded-xl text-lg sm:text-xl shrink-0">✨</div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">ลงทะเบียนสารเคมีใหม่</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">เพิ่มรายการสินค้าใหม่เข้าสู่ระบบแคตตาล็อก</p>
                </div>
              </div>
              
              {chemStatus.message && <div className={`p-3 sm:p-4 mb-6 rounded-xl text-sm font-medium flex gap-2 ${chemStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{chemStatus.type === 'success' ? '✅' : '❌'} {chemStatus.message}</div>}
              
              <form onSubmit={handleAddChemicalSubmit} className="space-y-4 sm:space-y-5">
                {/* 📱 ปรับกริดจากตายตัว 2 ให้เป็น 1 บนมือถือ และเป็น 2 บนจอใหญ่ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">รหัสสารเคมี</label><input type="text" value={newChemData.chemical_code} onChange={(e) => setNewChemData({...newChemData, chemical_code: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="เช่น CHM-001" /></div>
                  <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">ชื่อสารเคมี</label><input type="text" value={newChemData.name} onChange={(e) => setNewChemData({...newChemData, name: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="เช่น Ethanol 95%" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">หน่วยนับ</label><select value={newChemData.base_unit} onChange={(e) => setNewChemData({...newChemData, base_unit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"><option value="Bottle">ขวด</option><option value="Liter">ลิตร</option><option value="Gram">กรัม</option><option value="Box">กล่อง</option></select></div>
                  <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">จุดแจ้งเตือนสั่งซื้อ (Min Level)</label><input type="number" step="0.01" value={newChemData.minimum_level} onChange={(e) => setNewChemData({...newChemData, minimum_level: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" placeholder="จำนวนขั้นต่ำ" /></div>
                </div>
                <button type="submit" disabled={chemStatus.type === 'loading'} className="w-full bg-indigo-600 text-white font-bold py-3 sm:py-3.5 mt-2 sm:mt-4 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-[0.98] text-sm sm:text-base">บันทึกข้อมูลสารเคมี</button>
              </form>
            </div>
          </div>
        )}

        {/* --- 📥 รับของเข้า (Responsive Grid) --- */}
        {activeTab === 'receive' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-slate-100">
                <div className="bg-emerald-100 text-emerald-600 p-2 sm:p-2.5 rounded-xl text-lg sm:text-xl shrink-0">📥</div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">รับสินค้าเข้าสต๊อก</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">สร้างล็อตใหม่และบันทึกประวัติการรับ</p>
                </div>
              </div>
              
              {receiveStatus.message && <div className={`p-3 sm:p-4 mb-6 rounded-xl text-sm font-medium flex gap-2 ${receiveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{receiveStatus.type === 'success' ? '✅' : '❌'} {receiveStatus.message}</div>}
              
              <form onSubmit={handleReceiveSubmit} className="space-y-4 sm:space-y-5">
                <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">เลือกสารเคมี</label><select value={receiveData.chemical_id} onChange={(e) => setReceiveData({...receiveData, chemical_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm">{chemicals.map(c => <option key={c.ID} value={c.ID}>{c.ChemicalCode} - {c.Name}</option>)}</select></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">หมายเลขล็อต</label><input type="text" value={receiveData.batch_number} onChange={(e) => setReceiveData({...receiveData, batch_number: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" placeholder="เช่น LOT-2026A"/></div>
                  <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">จำนวนรับเข้า</label><input type="number" step="0.01" value={receiveData.quantity} onChange={(e) => setReceiveData({...receiveData, quantity: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" placeholder="ระบุจำนวน" /></div>
                </div>
                <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">วันหมดอายุ</label><input type="date" value={receiveData.expiration_date} onChange={(e) => setReceiveData({...receiveData, expiration_date: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-600 text-sm" /></div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 sm:py-3.5 mt-2 sm:mt-4 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 active:scale-[0.98] text-sm sm:text-base">ยืนยันการรับเข้าสต๊อก</button>
              </form>
            </div>
          </div>
        )}

        {/* --- 📤 เบิกจ่าย (Responsive) --- */}
        {activeTab === 'dispense' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-slate-100">
                <div className="bg-rose-100 text-rose-600 p-2 sm:p-2.5 rounded-xl text-lg sm:text-xl shrink-0">📤</div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">เบิกจ่าย (ระบบ FEFO)</h2>
                  <p className="text-slate-500 text-xs sm:text-sm">ระบบจะตัดสต๊อกจากล็อตที่ใกล้หมดอายุก่อนอัตโนมัติ</p>
                </div>
              </div>

              {dispenseStatus.message && (
                <div className={`p-4 sm:p-5 mb-6 rounded-2xl border ${dispenseStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                  <p className={`font-bold text-base sm:text-lg flex items-center gap-2 ${dispenseStatus.type === 'success' ? 'text-emerald-700' : ''}`}>{dispenseStatus.type === 'success' ? '✅' : '❌'} {dispenseStatus.message}</p>
                  {dispenseStatus.details && dispenseStatus.details.length > 0 && (
                    <div className="mt-3 sm:mt-4 text-xs sm:text-sm bg-white p-3 sm:p-4 rounded-xl border border-emerald-100/50 shadow-sm">
                      <p className="font-semibold text-slate-700 mb-2">📋 สรุปการตัดล็อต:</p>
                      <ul className="space-y-1.5 text-slate-600">
                        {dispenseStatus.details.map((detail, idx) => (
                          <li key={idx} className="flex justify-between border-b border-slate-50 pb-1">
                            <span>ล็อต <span className="font-mono bg-slate-100 px-1.5 rounded text-[10px] sm:text-xs">{detail.batch_number}</span></span>
                            <span className="font-bold text-rose-600">-{detail.deducted} หน่วย</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleDispenseSubmit} className="space-y-4 sm:space-y-5">
                <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">สารเคมีที่ต้องการเบิก</label><select value={dispenseData.chemical_id} onChange={(e) => setDispenseData({...dispenseData, chemical_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm">{chemicals.map(c => <option key={c.ID} value={c.ID}>{c.ChemicalCode} - {c.Name}</option>)}</select></div>
                <div><label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">จำนวนที่เบิก</label><input type="number" step="0.01" value={dispenseData.quantity} onChange={(e) => setDispenseData({...dispenseData, quantity: e.target.value})} required className="w-full bg-slate-50 border border-slate-200 px-3 sm:px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm" placeholder="ระบุตัวเลข" /></div>
                <button type="submit" disabled={dispenseStatus.type === 'loading'} className="w-full bg-rose-500 text-white font-bold py-3 sm:py-3.5 mt-2 sm:mt-4 rounded-xl hover:bg-rose-600 transition-all shadow-md shadow-rose-200 active:scale-[0.98] text-sm sm:text-base">
                  {dispenseStatus.type === 'loading' ? 'กำลังประมวลผล...' : 'ยืนยันการเบิกจ่าย'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- 🕒 ประวัติการทำรายการ --- */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">🕒 ประวัติการรับ-เบิกจ่าย</h2>
              <button onClick={fetchAllData} className="text-xs sm:text-sm text-indigo-600 font-semibold hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors">🔄 รีเฟรช</button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-white">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">วัน-เวลา</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">รายการ</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase min-w-[120px]">สารเคมี</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">หมายเลขล็อต</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">จำนวน</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-bold text-slate-400 uppercase whitespace-nowrap">ผู้ทำรายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingData ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium text-sm">กำลังโหลด...</td></tr> : 
                   historyLogs.length === 0 ? <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium text-sm">ยังไม่มีประวัติการทำรายการ</td></tr> :
                   historyLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-sm text-slate-500 whitespace-nowrap">{log.transaction_date}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border ${log.transaction_type === 'IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          {log.transaction_type === 'IN' ? '📥 รับเข้า' : '📤 เบิกจ่าย'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800">{log.chemical_code}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500">{log.name}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><span className="text-[10px] sm:text-xs font-mono bg-slate-100 text-slate-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{log.batch_number}</span></td>
                      <td className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right font-bold whitespace-nowrap ${log.transaction_type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {log.transaction_type === 'IN' ? '+' : '-'}{log.quantity}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-sm font-medium text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-slate-200 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] text-slate-600 font-bold shrink-0">{log.user_id.charAt(0).toUpperCase()}</div>
                          {log.user_id}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
      
      {/* ซ่อน Scrollbar ของแถบเมนูใน CSS inline เล็กน้อย */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

export default App;