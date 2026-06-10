const DoctorPages = {
  async renderTodaySchedules() {
    const today = formatDate(new Date());

    try {
      const doctorId = AppState.user.id;
      const res = await API.get(`/api/schedules?doctorId=${doctorId}&startDate=${today}&endDate=${today}`);
      const schedules = res || [];

      const queueRes = await API.get(`/api/doctors/${doctorId}/queue?date=${today}`);
      const allPatients = queueRes || [];

      const patientList = Array.isArray(allPatients) ? allPatients : (allPatients.list || []);

      const stats = {
        total: patientList.length,
        checkedIn: patientList.filter(p => p.status === 'CHECKED_IN').length,
        inVisit: patientList.filter(p => p.status === 'IN_VISIT').length,
        completed: patientList.filter(p => p.status === 'COMPLETED').length,
      };

      let schedulesHtml = '';
      if (!schedules || schedules.length === 0) {
        schedulesHtml = `<div class="empty"><div class="icon">📅</div><p>今日暂无排班</p></div>`;
      } else {
        (schedules || []).forEach(schedule => {
          const patients = patientList.filter(p => p.scheduleId === schedule.id);
          const inventory = schedule.slotInventory || {};

          schedulesHtml += `
            <div class="schedule-item">
              <div>
                <div class="time-slot">${getTimeSlotText(schedule.timeSlot)}</div>
                <div class="slots-info">
                  总号源：${inventory.totalSlots || 0} |
                  已预约：${inventory.bookedSlots || 0} |
                  已签到：${patients.filter(p => p.status === 'CHECKED_IN').length}
                </div>
              </div>
              <div class="fee">¥${schedule.fee}</div>
              <button class="btn btn-primary" onclick="DoctorPages.viewQueue('${schedule.id}')">
                查看队列
              </button>
            </div>
          `;
        });
      }

      document.getElementById('content').innerHTML = `
        <h2 style="margin-bottom: 20px;">今日排班 - ${today}</h2>

        <div class="grid grid-4" style="margin-bottom: 24px;">
          <div class="stat-card">
            <div class="label">今日总预约</div>
            <div class="value">${stats.total}</div>
          </div>
          <div class="stat-card warning">
            <div class="label">等待中</div>
            <div class="value">${stats.checkedIn}</div>
          </div>
          <div class="stat-card info">
            <div class="label">就诊中</div>
            <div class="value">${stats.inVisit}</div>
          </div>
          <div class="stat-card success">
            <div class="label">已完成</div>
            <div class="value">${stats.completed}</div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom: 16px;">排班列表</h3>
          ${schedulesHtml}
        </div>
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  viewQueue(scheduleId) {
    navigate('queue', { scheduleId });
  },

  async renderQueue() {
    const scheduleId = getParam('scheduleId');
    const today = formatDate(new Date());
    const doctorId = AppState.user.id;

    try {
      const [scheduleRes, queueRes] = await Promise.all([
        scheduleId ? API.get(`/api/schedules/${scheduleId}`) : Promise.resolve({}),
        API.get(`/api/doctors/${doctorId}/queue?date=${today}`),
      ]);

      const schedule = scheduleRes || {};
      const allPatients = queueRes || [];
      const patientList = Array.isArray(allPatients) ? allPatients : (allPatients.list || []);
      const patients = scheduleId ? patientList.filter(p => p.scheduleId === scheduleId) : patientList;

      const waiting = patients.filter(p => p.status === 'CHECKED_IN').sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
      const inVisit = patients.filter(p => p.status === 'IN_VISIT');
      const completed = patients.filter(p => p.status === 'COMPLETED');
      const missed = patients.filter(p => p.status === 'MISSED');

      const currentPatient = inVisit[0] || null;
      const nextPatient = waiting[0] || null;

      let patientListHtml = '';
      if (!waiting || waiting.length === 0) {
        patientListHtml = `<div class="empty"><div class="icon">👥</div><p>暂无等待患者</p></div>`;
      } else {
        patientListHtml = `<table class="table">
          <thead>
            <tr>
              <th>排号</th>
              <th>姓名</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;

        waiting.forEach(p => {
          const name = (p.patient && (p.patient.realName || p.patient.name)) || p.patientName || '未知';
          patientListHtml += `
            <tr>
              <td>${p.queueNumber || '-'}</td>
              <td>${escapeHtml(name)}</td>
              <td><span class="status-tag status-success">等待中</span></td>
              <td>
                <button class="btn btn-primary btn-sm" onclick="DoctorPages.callPatient('${p.id}')">叫号</button>
                <button class="btn btn-warning btn-sm" style="margin-left: 8px;" onclick="DoctorPages.markMissed('${p.id}')">过号</button>
              </td>
            </tr>
          `;
        });

        patientListHtml += '</tbody></table>';
      }

      const currentName = currentPatient ? ((currentPatient.patient && (currentPatient.patient.realName || currentPatient.patient.name)) || currentPatient.patientName || '') : '';

      document.getElementById('content').innerHTML = `
        <div style="margin-bottom: 20px;">
          <a href="javascript:void(0)" onclick="navigate('todaySchedule')" style="color: #1890ff; text-decoration: none;">
            ← 返回今日排班
          </a>
        </div>

        <div class="calling-section">
          <div style="font-size: 16px; color: #666;">当前就诊</div>
          <div class="current-number">${currentPatient ? (currentPatient.queueNumber || '--') : '--'}</div>
          <div class="patient-name">${currentPatient ? escapeHtml(currentName) : '暂无患者'}</div>
          ${currentPatient ? `
            <div style="margin-top: 16px;">
              <button class="btn btn-success btn-lg" onclick="DoctorPages.completeVisit('${currentPatient.id}')">完成就诊</button>
              <button class="btn btn-warning btn-lg" style="margin-left: 12px;" onclick="DoctorPages.markMissed('${currentPatient.id}')">标记过号</button>
            </div>
          ` : ''}
        </div>

        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0;">等待队列 (${waiting.length})</h3>
            <button class="btn btn-primary" ${nextPatient ? '' : 'disabled'} onclick="DoctorPages.callNext('${scheduleId}')">
              叫下一位
            </button>
          </div>
          ${patientListHtml}
        </div>

        ${missed.length > 0 ? `
        <div class="card" style="margin-top: 16px;">
          <h3 style="margin-bottom: 16px;">过号列表 (${missed.length})</h3>
          <table class="table">
            <thead>
              <tr>
                <th>排号</th>
                <th>姓名</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${missed.map(p => {
                const name = (p.patient && (p.patient.realName || p.patient.name)) || p.patientName || '未知';
                return `
                <tr>
                  <td>${p.queueNumber || '-'}</td>
                  <td>${escapeHtml(name)}</td>
                  <td><span class="status-tag status-danger">已过号</span></td>
                  <td>
                    <button class="btn btn-default btn-sm" onclick="DoctorPages.requeue('${p.id}')">重新排队</button>
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${completed.length > 0 ? `
        <div class="card" style="margin-top: 16px;">
          <h3 style="margin-bottom: 16px;">已完成 (${completed.length})</h3>
          <table class="table">
            <thead>
              <tr>
                <th>排号</th>
                <th>姓名</th>
                <th>完成时间</th>
              </tr>
            </thead>
            <tbody>
              ${completed.map(p => {
                const name = (p.patient && (p.patient.realName || p.patient.name)) || p.patientName || '未知';
                return `
                <tr>
                  <td>${p.queueNumber || '-'}</td>
                  <td>${escapeHtml(name)}</td>
                  <td>${formatDateTime(p.completedAt)}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async callNext(scheduleId) {
    try {
      const res = await API.post('/api/visit/call', { scheduleId });
      const queueNum = (res && res.queueNumber) ? res.queueNumber : '';
      showToast(`正在叫号：${queueNum || '下一位'}号`, 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async callPatient(appointmentId) {
    try {
      const scheduleId = getParam('scheduleId');
      await API.post('/api/visit/call', { scheduleId, appointmentId });
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async markMissed(appointmentId) {
    if (!confirm('确定标记此患者为过号吗？')) return;

    try {
      await API.post(`/api/appointments/${appointmentId}/miss`);
      showToast('已标记为过号', 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async requeue(appointmentId) {
    if (!confirm('确定将此患者重新排队吗？')) return;

    try {
      await API.post(`/api/appointments/${appointmentId}/requeue`);
      showToast('已重新排队', 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },

  async completeVisit(appointmentId) {
    if (!confirm('确定完成此患者的就诊吗？')) return;

    try {
      await API.post(`/api/appointments/${appointmentId}/complete`);
      showToast('就诊完成', 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
};
