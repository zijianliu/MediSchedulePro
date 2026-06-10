function renderLoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-box">
        <h2>MediSchedulePro</h2>
        <p class="subtitle">医院预约挂号与医生排班系统</p>
        
        <div class="form-group">
          <label>选择角色</label>
          <div class="role-selector">
            <div class="role-option selected" data-role="PATIENT" onclick="selectRole('PATIENT')">
              <div class="icon">👤</div>
              <div class="name">患者</div>
            </div>
            <div class="role-option" data-role="DOCTOR" onclick="selectRole('DOCTOR')">
              <div class="icon">👨‍⚕️</div>
              <div class="name">医生</div>
            </div>
            <div class="role-option" data-role="ADMIN" onclick="selectRole('ADMIN')">
              <div class="icon">⚙️</div>
              <div class="name">管理员</div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label>用户名</label>
          <input type="text" id="username" placeholder="请输入用户名">
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="password" placeholder="请输入密码">
        </div>
        
        <button class="btn btn-primary" onclick="handleLogin()">登录</button>
        
        <div style="margin-top: 20px; text-align: center;">
          <p style="color: #999; font-size: 13px; margin-bottom: 8px;">测试账号（点击快速填充）</p>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-default" style="padding: 4px 12px; font-size: 12px;" onclick="quickLogin('admin')">管理员</button>
            <button class="btn btn-default" style="padding: 4px 12px; font-size: 12px;" onclick="quickLogin('dept_admin')">科室管理员</button>
            <button class="btn btn-default" style="padding: 4px 12px; font-size: 12px;" onclick="quickLogin('doctor')">医生</button>
            <button class="btn btn-default" style="padding: 4px 12px; font-size: 12px;" onclick="quickLogin('finance')">财务</button>
            <button class="btn btn-default" style="padding: 4px 12px; font-size: 12px;" onclick="quickLogin('patient')">患者</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  selectRole('PATIENT');
}

let selectedRole = 'PATIENT';

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.role === role);
  });
}

async function quickLogin(type) {
  const roleMap = {
    admin: { role: 'ADMIN', username: 'admin', password: 'admin123' },
    dept_admin: { role: 'DEPT_ADMIN', username: 'dept_admin', password: 'admin123' },
    doctor: { role: 'DOCTOR', username: 'doctor', password: 'doctor123' },
    finance: { role: 'FINANCE', username: 'finance', password: 'finance123' },
    patient: { role: 'PATIENT', username: 'patient', password: 'patient123' },
  };
  
  const info = roleMap[type];
  selectRole(info.role);
  document.getElementById('username').value = info.username;
  document.getElementById('password').value = info.password;
  
  try {
    const registerRes = await API.post('/api/auth/register', {
      username: info.username,
      password: info.password,
      realName: type === 'admin' ? '系统管理员' : 
               type === 'dept_admin' ? '科室管理员' :
               type === 'doctor' ? '张医生' :
               type === 'finance' ? '财务人员' : '张三',
      role: info.role,
    });
  } catch (e) {
  }
  
  handleLogin();
}

async function handleLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  
  if (!username || !password) {
    showToast('请输入用户名和密码', 'warn');
    return;
  }
  
  try {
    const res = await API.post('/api/auth/login', { username, password });
    if (!res || !res.token) {
      showToast('登录失败：服务器响应异常', 'error');
      return;
    }
    AppState.setAuth(res.token, res.user);
    showToast('登录成功', 'success');
    renderPage();
  } catch (error) {
    showToast(error.message || '登录失败，请稍后重试', 'error');
  }
}

function handleLogout() {
  AppState.clearAuth();
  showToast('已退出登录', 'info');
  renderLoginPage();
}

function renderMainLayout() {
  const user = AppState.user;
  const role = user.role;
  
  let menuItems = [];
  
  if (role === 'PATIENT') {
    menuItems = [
      { key: 'departments', label: '科室列表', icon: '🏥' },
      { key: 'appointments', label: '我的预约', icon: '📋' },
      { key: 'notifications', label: '通知中心', icon: '🔔' },
    ];
  } else if (role === 'DOCTOR') {
    menuItems = [
      { key: 'todaySchedule', label: '今日排班', icon: '📅' },
      { key: 'notifications', label: '通知中心', icon: '🔔' },
    ];
  } else if (role === 'DEPT_ADMIN' || role === 'ADMIN') {
    menuItems = [
      { key: 'deptManage', label: '科室管理', icon: '🏥' },
      { key: 'scheduleManage', label: '排班管理', icon: '📅' },
      { key: 'refundManage', label: '退款处理', icon: '💰' },
      { key: 'logs', label: '操作日志', icon: '📋' },
      { key: 'notifications', label: '通知中心', icon: '🔔' },
    ];
  } else if (role === 'FINANCE') {
    menuItems = [
      { key: 'refundManage', label: '退款处理', icon: '💰' },
      { key: 'notifications', label: '通知中心', icon: '🔔' },
    ];
  }
  
  const currentPage = getParam('page') || getDefaultPage();
  
  const menuHtml = menuItems.map(item => `
    <div class="menu-item ${currentPage === item.key ? 'active' : ''}" 
         onclick="navigate('${item.key}')">
      ${item.icon} ${item.label}
    </div>
  `).join('');
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="header">
      <h1>🏥 MediSchedulePro - ${getRoleText(role)}端</h1>
      <div class="user-info">
        <span>👤 ${escapeHtml(user.realName)}</span>
        <span class="status-tag status-info">${getRoleText(role)}</span>
        <button onclick="handleLogout()">退出</button>
      </div>
    </div>
    <div class="layout">
      <div class="sidebar">
        ${menuHtml}
      </div>
      <div class="main-content" id="content">
        加载中...
      </div>
    </div>
  `;
}

function getDefaultPage() {
  const role = AppState.user?.role;
  if (role === 'PATIENT') return 'departments';
  if (role === 'DOCTOR') return 'todaySchedule';
  if (role === 'DEPT_ADMIN' || role === 'ADMIN') return 'deptManage';
  if (role === 'FINANCE') return 'refundManage';
  return 'departments';
}

function renderPage() {
  if (!AppState.isLoggedIn()) {
    renderLoginPage();
    return;
  }
  
  renderMainLayout();
  
  const page = getParam('page') || getDefaultPage();
  const role = AppState.user.role;
  
  if (role === 'PATIENT') {
    switch (page) {
      case 'departments':
        PatientPages.renderDepartments();
        break;
      case 'doctors':
        PatientPages.renderDoctors();
        break;
      case 'schedules':
        PatientPages.renderSchedules();
        break;
      case 'appointments':
        PatientPages.renderAppointments();
        break;
      case 'appointmentDetail':
        PatientPages.renderAppointmentDetail();
        break;
      case 'notifications':
        AdminPages.renderNotifications();
        break;
      default:
        PatientPages.renderDepartments();
    }
  } else if (role === 'DOCTOR') {
    switch (page) {
      case 'todaySchedule':
        DoctorPages.renderTodaySchedules();
        break;
      case 'queue':
        DoctorPages.renderQueue();
        break;
      case 'notifications':
        AdminPages.renderNotifications();
        break;
      default:
        DoctorPages.renderTodaySchedules();
    }
  } else if (role === 'DEPT_ADMIN' || role === 'ADMIN') {
    switch (page) {
      case 'deptManage':
        AdminPages.renderDepartmentManagement();
        break;
      case 'scheduleManage':
        AdminPages.renderScheduleManagement();
        break;
      case 'refundManage':
        AdminPages.renderRefundManagement();
        break;
      case 'logs':
        AdminPages.renderLogs();
        break;
      case 'notifications':
        AdminPages.renderNotifications();
        break;
      default:
        AdminPages.renderDepartmentManagement();
    }
  } else if (role === 'FINANCE') {
    switch (page) {
      case 'refundManage':
        AdminPages.renderRefundManagement();
        break;
      case 'notifications':
        AdminPages.renderNotifications();
        break;
      default:
        AdminPages.renderRefundManagement();
    }
  }
}

window.addEventListener('popstate', () => {
  renderPage();
});

document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
  renderPage();
});
