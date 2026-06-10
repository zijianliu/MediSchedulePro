const AdminPages = {
  async renderDepartmentManagement() {
    try {
      const res = await API.get('/api/departments?includeInactive=true');
      const departments = res || [];
      const deptList = Array.isArray(departments) ? departments : (departments.list || []);

      let tableHtml = '';
      if (!deptList || deptList.length === 0) {
        tableHtml = `
          <div class="empty">
            <div class="icon">🏥</div>
            <p>暂无科室数据</p>
            <p style="color: #999; font-size: 13px; margin-top: 8px;">请新增科室以开始使用排班和预约功能</p>
            <button class="btn btn-primary" style="margin-top: 16px;" onclick="AdminPages.showCreateDepartment()">+ 新增科室</button>
          </div>
        `;
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>科室名称</th>
              <th>科室编码</th>
              <th>描述</th>
              <th>医生数</th>
              <th>排班数</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;

        (deptList || []).forEach(d => {
          const doctorCount = (d._count && d._count.doctors) || 0;
          const scheduleCount = (d._count && d._count.schedules) || 0;
          const isActive = d.status !== 'INACTIVE';

          tableHtml += `
            <tr>
              <td style="font-weight: 600;">${escapeHtml(d.name || '')}</td>
              <td><code>${escapeHtml(d.code || '-')}</code></td>
              <td>${escapeHtml(d.description || '-')}</td>
              <td>${doctorCount}</td>
              <td>${scheduleCount}</td>
              <td>
                <span class="status-tag ${isActive ? 'status-success' : 'status-default'}">
                  ${isActive ? '启用' : '停用'}
                </span>
              </td>
              <td>${formatDateTime(d.createdAt)}</td>
              <td>
                <button class="btn btn-default btn-sm" onclick="AdminPages.showEditDepartment('${d.id}')">编辑</button>
                <button class="btn ${isActive ? 'btn-warning' : 'btn-success'} btn-sm" style="margin-left: 8px;" onclick="AdminPages.toggleDepartment('${d.id}')">
                  ${isActive ? '停用' : '启用'}
                </button>
              </td>
            </tr>
          `;
        });

        tableHtml += '</tbody></table>';
      }

      document.getElementById('content').innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">科室管理</h2>
          <button class="btn btn-primary" onclick="AdminPages.showCreateDepartment()">+ 新增科室</button>
        </div>
        <div class="card">
          ${tableHtml}
        </div>
        <div id="deptModal" class="card" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        </div>
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  showCreateDepartment() {
    const html = `
      <h3 style="margin-bottom: 20px;">新增科室</h3>
      <div class="form-group">
        <label>科室名称 <span style="color: red;">*</span></label>
        <input type="text" id="deptName" placeholder="如：内科、外科、儿科">
      </div>
      <div class="form-group">
        <label>科室编码</label>
        <input type="text" id="deptCode" placeholder="如：DEPT_NK">
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea id="deptDesc" rows="3" placeholder="科室介绍"></textarea>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn btn-default" onclick="AdminPages.closeDeptModal()">取消</button>
        <button class="btn btn-primary" onclick="AdminPages.createDepartment()">确认新增</button>
      </div>
    `;

    const modal = document.getElementById('deptModal');
    modal.innerHTML = html;
    modal.style.display = 'block';
  },

  async createDepartment() {
    const name = document.getElementById('deptName').value.trim();
    const code = document.getElementById('deptCode').value.trim();
    const description = document.getElementById('deptDesc').value.trim();

    if (!name) {
      showToast('请输入科室名称', 'warn');
      return;
    }

    try {
      await API.post('/api/departments', { name, code: code || undefined, description: description || undefined });
      showToast('科室创建成功', 'success');
      AdminPages.closeDeptModal();
      AdminPages.renderDepartmentManagement();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async showEditDepartment(deptId) {
    try {
      const dept = await API.get(`/api/departments/${deptId}`);

      const html = `
        <h3 style="margin-bottom: 20px;">编辑科室</h3>
        <div class="form-group">
          <label>科室名称 <span style="color: red;">*</span></label>
          <input type="text" id="editDeptName" value="${escapeHtml(dept.name || '')}">
        </div>
        <div class="form-group">
          <label>科室编码</label>
          <input type="text" id="editDeptCode" value="${escapeHtml(dept.code || '')}">
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea id="editDeptDesc" rows="3">${escapeHtml(dept.description || '')}</textarea>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-default" onclick="AdminPages.closeDeptModal()">取消</button>
          <button class="btn btn-primary" onclick="AdminPages.updateDepartment('${deptId}')">保存修改</button>
        </div>
      `;

      const modal = document.getElementById('deptModal');
      modal.innerHTML = html;
      modal.style.display = 'block';
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async updateDepartment(deptId) {
    const name = document.getElementById('editDeptName').value.trim();
    const code = document.getElementById('editDeptCode').value.trim();
    const description = document.getElementById('editDeptDesc').value.trim();

    if (!name) {
      showToast('请输入科室名称', 'warn');
      return;
    }

    try {
      await API.put(`/api/departments/${deptId}`, { name, code: code || undefined, description: description || undefined });
      showToast('科室更新成功', 'success');
      AdminPages.closeDeptModal();
      AdminPages.renderDepartmentManagement();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async toggleDepartment(deptId) {
    try {
      await API.patch(`/api/departments/${deptId}/toggle-status`);
      showToast('科室状态已更新', 'success');
      AdminPages.renderDepartmentManagement();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  closeDeptModal() {
    const modal = document.getElementById('deptModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  async renderScheduleManagement() {
    const date = getParam('date') || formatDate(new Date());
    const deptId = getParam('deptId') || '';

    try {
      const params = [];
      if (date) params.push(`startDate=${date}&endDate=${date}`);
      if (deptId) params.push(`departmentId=${deptId}`);

      const [schedulesRes, departmentsRes] = await Promise.all([
        API.get(`/api/schedules?includeCancelled=true&${params.join('&')}`),
        API.get('/api/departments?includeInactive=true'),
      ]);

      const schedules = schedulesRes || [];
      const departments = departmentsRes || [];
      const scheduleList = Array.isArray(schedules) ? schedules : (schedules.list || []);
      const deptList = Array.isArray(departments) ? departments : (departments.list || []);

      const deptOptions = (deptList || []).map(d =>
        `<option value="${d.id}" ${d.id === deptId ? 'selected' : ''}>${escapeHtml(d.name || '')}</option>`
      ).join('');

      let tableHtml = '';
      if (!scheduleList || scheduleList.length === 0) {
        tableHtml = `<div class="empty"><div class="icon">📅</div><p>暂无排班数据</p></div>`;
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>日期</th>
              <th>时段</th>
              <th>科室</th>
              <th>医生</th>
              <th>号源总数</th>
              <th>已预约</th>
              <th>剩余</th>
              <th>费用</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;

        (scheduleList || []).forEach(s => {
          const inv = s.slotInventory || {};
          const deptName = (s.department && s.department.name) || '';
          const doctorInfo = s.doctor || {};
          const doctorName = doctorInfo.realName || doctorInfo.name || '';

          tableHtml += `
            <tr>
              <td>${formatDate(s.date)}</td>
              <td>${getTimeSlotText(s.timeSlot)}</td>
              <td>${escapeHtml(deptName)}</td>
              <td>${escapeHtml(doctorName)}</td>
              <td>${inv.totalSlots || 0}</td>
              <td>${inv.bookedSlots || 0}</td>
              <td>${inv.availableSlots || 0}</td>
              <td>¥${s.fee}</td>
              <td>
                <span class="status-tag ${s.isCancelled ? 'status-danger' : 'status-success'}">
                  ${s.isCancelled ? '已停诊' : '正常'}
                </span>
              </td>
              <td>
                ${!s.isCancelled ?
                  `<button class="btn btn-danger btn-sm" onclick="AdminPages.showCancelSchedule('${s.id}')">停诊</button>` :
                  `<span style="color: #999;">已停诊</span>`}
              </td>
            </tr>
          `;
        });

        tableHtml += '</tbody></table>';
      }

      document.getElementById('content').innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">排班管理</h2>
          <button class="btn btn-primary" onclick="AdminPages.showCreateSchedule()">+ 新增排班</button>
        </div>

        <div class="card">
          <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 6px; font-size: 14px;">科室</label>
              <select id="filterDept" onchange="AdminPages.filterSchedule()" class="form-control">
                <option value="">全部科室</option>
                ${deptOptions}
              </select>
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 6px; font-size: 14px;">日期</label>
              <input type="date" id="filterDate" value="${date}" onchange="AdminPages.filterSchedule()" class="form-control">
            </div>
          </div>

          ${tableHtml}
        </div>

        <div id="scheduleModal" class="card" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
        </div>
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  filterSchedule() {
    const date = document.getElementById('filterDate').value;
    const deptId = document.getElementById('filterDept').value;
    navigate('scheduleManage', { date, deptId });
  },

  async showCreateSchedule() {
    try {
      const [departmentsRes, doctorsRes] = await Promise.all([
        API.get('/api/departments?includeInactive=true'),
        API.get('/api/doctors'),
      ]);

      const departments = departmentsRes || [];
      const doctors = doctorsRes || [];
      const deptList = Array.isArray(departments) ? departments : (departments.list || []);
      const doctorList = Array.isArray(doctors) ? doctors : (doctors.list || []);

      const deptOptions = (deptList || []).map(d =>
        `<option value="${d.id}">${escapeHtml(d.name || '')}</option>`
      ).join('');

      const html = `
        <h3 style="margin-bottom: 20px;">新增排班</h3>
        <div class="form-group">
          <label>科室</label>
          <select id="newDeptId" onchange="AdminPages.loadDoctorsByDept()">
            ${deptOptions}
          </select>
        </div>
        <div class="form-group">
          <label>医生</label>
          <select id="newDoctorId">
            ${(doctorList || []).map(d => {
              const name = d.realName || d.name || '';
              return `<option value="${d.id}">${escapeHtml(name)}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>日期</label>
          <input type="date" id="newDate" value="${formatDate(new Date())}">
        </div>
        <div class="form-group">
          <label>时段</label>
          <select id="newTimeSlot">
            <option value="MORNING">上午</option>
            <option value="AFTERNOON">下午</option>
            <option value="EVENING">晚上</option>
          </select>
        </div>
        <div class="form-group">
          <label>最大号源数</label>
          <input type="number" id="newMaxSlots" value="20" min="1">
        </div>
        <div class="form-group">
          <label>挂号费用 (元)</label>
          <input type="number" id="newFee" value="100" min="0" step="0.01">
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-default" onclick="AdminPages.closeModal()">取消</button>
          <button class="btn btn-primary" onclick="AdminPages.createSchedule()">确认创建</button>
        </div>
      `;

      const modal = document.getElementById('scheduleModal');
      modal.innerHTML = html;
      modal.style.display = 'block';

      AdminPages.loadDoctorsByDept();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async loadDoctorsByDept() {
    const deptId = document.getElementById('newDeptId').value;
    try {
      const res = await API.get(`/api/doctors?departmentId=${deptId}`);
      const doctors = res || [];
      const doctorList = Array.isArray(doctors) ? doctors : (doctors.list || []);
      const select = document.getElementById('newDoctorId');
      select.innerHTML = (doctorList || []).map(d => {
        const name = d.realName || d.name || '';
        return `<option value="${d.id}">${escapeHtml(name)}</option>`;
      }).join('');
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async createSchedule() {
    const departmentId = document.getElementById('newDeptId').value;
    const doctorId = document.getElementById('newDoctorId').value;
    const date = document.getElementById('newDate').value;
    const timeSlot = document.getElementById('newTimeSlot').value;
    const maxSlots = parseInt(document.getElementById('newMaxSlots').value);
    const fee = parseFloat(document.getElementById('newFee').value);

    try {
      await API.post('/api/schedules', {
        doctorId,
        departmentId,
        date,
        timeSlot,
        maxSlots,
        fee,
      });

      showToast('排班创建成功', 'success');
      AdminPages.closeModal();
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  showCancelSchedule(scheduleId) {
    const html = `
      <h3 style="margin-bottom: 20px;">停诊确认</h3>
      <div class="form-group">
        <label>停诊原因</label>
        <textarea id="cancelReason" rows="3" placeholder="请填写停诊原因"></textarea>
      </div>
      <p style="color: #ff4d4f; font-size: 13px; margin-bottom: 16px;">
        ⚠️ 停诊后，已预约的患者将自动进入退款流程
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button class="btn btn-default" onclick="AdminPages.closeModal()">取消</button>
        <button class="btn btn-danger" onclick="AdminPages.cancelSchedule('${scheduleId}')">确认停诊</button>
      </div>
    `;

    const modal = document.getElementById('scheduleModal');
    modal.innerHTML = html;
    modal.style.display = 'block';
  },

  async cancelSchedule(scheduleId) {
    const reason = document.getElementById('cancelReason').value.trim();
    if (!reason) {
      showToast('请填写停诊原因', 'warn');
      return;
    }

    try {
      await API.post(`/api/schedules/${scheduleId}/cancel`, { reason });
      showToast('停诊操作成功', 'success');
      AdminPages.closeModal();
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  closeModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  async renderRefundManagement() {
    try {
      const res = await API.get('/api/refunds');
      const refunds = res || [];
      const refundList = Array.isArray(refunds) ? refunds : (refunds.list || []);

      let tableHtml = '';
      if (!refundList || refundList.length === 0) {
        tableHtml = `<div class="empty"><div class="icon">💰</div><p>暂无退款记录</p></div>`;
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>退款单号</th>
              <th>关联预约</th>
              <th>患者</th>
              <th>金额</th>
              <th>原因</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;

        (refundList || []).forEach(r => {
          const patientName = (r.patient && (r.patient.realName || r.patient.name)) || '';
          tableHtml += `
            <tr>
              <td>${(r.id || '').substring(0, 8)}...</td>
              <td>${(r.appointmentId || '').substring(0, 8)}...</td>
              <td>${escapeHtml(patientName)}</td>
              <td style="color: #ff4d4f; font-weight: 600;">¥${r.amount}</td>
              <td>${escapeHtml(r.reason || '')}</td>
              <td>
                <span class="status-tag ${r.status === 'COMPLETED' ? 'status-success' : r.status === 'PROCESSING' ? 'status-warn' : 'status-info'}">
                  ${r.status === 'PENDING' ? '待处理' : r.status === 'PROCESSING' ? '处理中' : r.status === 'COMPLETED' ? '已完成' : '失败'}
                </span>
              </td>
              <td>${formatDateTime(r.createdAt)}</td>
              <td>
                ${r.status === 'PENDING' ?
                  `<button class="btn btn-primary btn-sm" onclick="AdminPages.processRefund('${r.id}')">处理退款</button>` :
                  r.status === 'PROCESSING' ?
                  `<button class="btn btn-success btn-sm" onclick="AdminPages.completeRefund('${r.id}')">完成退款</button>` :
                  `<span style="color: #999;">已完成</span>`}
              </td>
            </tr>
          `;
        });

        tableHtml += '</tbody></table>';
      }

      document.getElementById('content').innerHTML = `
        <h2 style="margin-bottom: 20px;">退款管理</h2>
        <div class="card">
          ${tableHtml}
        </div>
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async processRefund(refundId) {
    try {
      await API.post(`/api/refunds/${refundId}/process`);
      showToast('退款处理中', 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async completeRefund(refundId) {
    try {
      await API.post(`/api/refunds/${refundId}/complete`);
      showToast('退款完成', 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async renderLogs() {
    try {
      const res = await API.get('/api/logs/operation?pageSize=50');
      const logs = (res && res.list) ? res.list : (Array.isArray(res) ? res : []);

      let tableHtml = '';
      if (!logs || logs.length === 0) {
        tableHtml = `<div class="empty"><div class="icon">📋</div><p>暂无日志记录</p></div>`;
      } else {
        tableHtml = `<table class="table">
          <thead>
            <tr>
              <th>时间</th>
              <th>操作类型</th>
              <th>操作人</th>
              <th>角色</th>
              <th>目标类型</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>`;

        (logs || []).forEach(log => {
          const operatorName = (log.operator && (log.operator.realName || log.operator.name)) || '';
          tableHtml += `
            <tr>
              <td>${formatDateTime(log.createdAt)}</td>
              <td><span class="status-tag status-info">${log.type || ''}</span></td>
              <td>${escapeHtml(operatorName)}</td>
              <td>${getRoleText(log.operatorRole)}</td>
              <td>${log.targetType || ''}</td>
              <td>${escapeHtml(log.content || '-')}</td>
            </tr>
          `;
        });

        tableHtml += '</tbody></table>';
      }

      document.getElementById('content').innerHTML = `
        <h2 style="margin-bottom: 20px;">操作日志</h2>
        <div class="card">
          ${tableHtml}
        </div>
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async renderNotifications() {
    try {
      const res = await API.get('/api/notifications');
      const notifications = (res && res.list) ? res.list : (Array.isArray(res) ? res : []);

      let html = '';
      if (!notifications || notifications.length === 0) {
        html = `<div class="empty"><div class="icon">🔔</div><p>暂无通知</p></div>`;
      } else {
        (notifications || []).forEach(n => {
          html += `
            <div class="card" style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <h4 style="margin-bottom: 8px;">${escapeHtml(n.title || '')}</h4>
                  <p style="color: #666; font-size: 14px;">${escapeHtml(n.content || '')}</p>
                </div>
                <span class="status-tag ${n.status === 'SENT' ? 'status-success' : n.status === 'FAILED' ? 'status-danger' : 'status-warn'}">
                  ${n.status === 'SENT' ? '已发送' : n.status === 'FAILED' ? '发送失败' : '待发送'}
                </span>
              </div>
              <div style="margin-top: 8px; font-size: 12px; color: #999;">
                ${formatDateTime(n.createdAt)}
              </div>
              ${n.status === 'FAILED' && n.failReason ? `
              <div style="margin-top: 8px; font-size: 12px; color: #ff4d4f;">
                失败原因：${escapeHtml(n.failReason)}
              </div>
              ` : ''}
            </div>
          `;
        });
      }

      document.getElementById('content').innerHTML = `
        <h2 style="margin-bottom: 20px;">通知中心</h2>
        ${html}
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
};
