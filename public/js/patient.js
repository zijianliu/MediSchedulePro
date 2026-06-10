const PatientPages = {
  currentDeptId: null,
  currentDoctorId: null,
  currentScheduleId: null,
  
  async renderDepartments() {
    try {
      const res = await API.get('/api/departments');
      const departments = res.data;
      
      let html = `
        <h2 style="margin-bottom: 20px;">选择科室</h2>
        <div class="grid grid-3">
      `;
      
      if (departments.length === 0) {
        html = `<div class="empty"><div class="icon">🏥</div><p>暂无科室信息</p></div>`;
      } else {
        departments.forEach(dept => {
          html += `
            <div class="dept-card" onclick="PatientPages.selectDepartment('${dept.id}')">
              <h3>${escapeHtml(dept.name)}</h3>
              <p>${escapeHtml(dept.description || '暂无介绍')}</p>
              <div class="doctor-count">👨‍⚕️ ${dept._count?.doctors || 0} 位医生</div>
            </div>
          `;
        });
        html += '</div>';
      }
      
      document.getElementById('content').innerHTML = `
        <div class="card">
          ${html}
        </div>
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  selectDepartment(deptId) {
    this.currentDeptId = deptId;
    navigate('doctors', { deptId });
  },
  
  async renderDoctors() {
    const deptId = getParam('deptId');
    this.currentDeptId = deptId;
    
    try {
      const [deptRes, doctorsRes] = await Promise.all([
        API.get(`/api/departments/${deptId}`),
        API.get(`/api/doctors?departmentId=${deptId}`),
      ]);
      
      const department = deptRes.data;
      const doctors = doctorsRes.data;
      
      let html = `
        <div style="margin-bottom: 20px;">
          <a href="javascript:void(0)" onclick="navigate('departments')" style="color: #1890ff; text-decoration: none;">
            ← 返回科室列表
          </a>
        </div>
        <h2 style="margin-bottom: 20px;">${escapeHtml(department.name)} - 医生列表</h2>
      `;
      
      if (doctors.length === 0) {
        html += `<div class="empty"><div class="icon">👨‍⚕️</div><p>暂无医生信息</p></div>`;
      } else {
        doctors.forEach(doctor => {
          html += `
            <div class="doctor-card" style="margin-bottom: 16px;">
              <div class="doctor-avatar">${escapeHtml(doctor.name.charAt(0))}</div>
              <div class="doctor-info">
                <h3>${escapeHtml(doctor.name)}</h3>
                <div class="title">${escapeHtml(doctor.title)}</div>
                <p class="intro">${escapeHtml(doctor.introduction || '暂无介绍')}</p>
              </div>
              <button class="btn btn-primary" onclick="PatientPages.selectDoctor('${doctor.id}')">
                查看排班
              </button>
            </div>
          `;
        });
      }
      
      document.getElementById('content').innerHTML = `<div class="card">${html}</div>`;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  selectDoctor(doctorId) {
    this.currentDoctorId = doctorId;
    navigate('schedules', { doctorId, deptId: this.currentDeptId });
  },
  
  async renderSchedules() {
    const doctorId = getParam('doctorId');
    const deptId = getParam('deptId');
    this.currentDoctorId = doctorId;
    this.currentDeptId = deptId;
    
    const today = new Date();
    const dateInput = getParam('date') || formatDate(today);
    
    try {
      const [doctorRes, schedulesRes] = await Promise.all([
        API.get(`/api/doctors/${doctorId}`),
        API.get(`/api/schedules/available?doctorId=${doctorId}&date=${dateInput}`),
      ]);
      
      const doctor = doctorRes.data;
      const schedules = schedulesRes.data;
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push({
          value: formatDate(d),
          label: i === 0 ? '今天' : i === 1 ? '明天' : `${d.getMonth() + 1}/${d.getDate()}`,
          weekday: ['日','一','二','三','四','五','六'][d.getDay()],
        });
      }
      
      let dateTabs = '';
      dates.forEach(d => {
        const isActive = d.value === dateInput;
        dateTabs += `
          <div class="menu-item ${isActive ? 'active' : ''}" 
               style="cursor: pointer; text-align: center; padding: 10px;"
               onclick="PatientPages.selectDate('${d.value}')">
            <div style="font-size: 12px;">周${d.weekday}</div>
            <div style="font-weight: 600;">${d.label}</div>
          </div>
        `;
      });
      
      let schedulesHtml = '';
      if (schedules.length === 0) {
        schedulesHtml = `<div class="empty"><div class="icon">📅</div><p>当日暂无可用号源</p></div>`;
      } else {
        schedules.forEach(schedule => {
          const inventory = schedule.slotInventory;
          const remaining = inventory?.availableSlots || 0;
          const canBook = remaining > 0 && !schedule.isCancelled;
          
          schedulesHtml += `
            <div class="schedule-item">
              <div>
                <div class="time-slot">${getTimeSlotText(schedule.timeSlot)}</div>
                <div class="slots-info">剩余 ${remaining} 个号源</div>
              </div>
              <div class="fee">¥${schedule.fee}</div>
              <button class="btn btn-primary" 
                      ${canBook ? '' : 'disabled'}
                      onclick="PatientPages.showConfirm('${schedule.id}')">
                ${canBook ? '立即预约' : '已约满'}
              </button>
            </div>
          `;
        });
      }
      
      document.getElementById('content').innerHTML = `
        <div style="margin-bottom: 20px;">
          <a href="javascript:void(0)" onclick="navigate('doctors', { deptId: '${deptId}' })" style="color: #1890ff; text-decoration: none;">
            ← 返回医生列表
          </a>
        </div>
        <div class="card">
          <h2>${escapeHtml(doctor.name)} - ${escapeHtml(doctor.title)}</h2>
          <div style="display: flex; gap: 8px; margin-bottom: 20px; padding: 8px; background: #fafafa; border-radius: 8px;">
            ${dateTabs}
          </div>
          <h3 style="margin-bottom: 16px;">可预约号源</h3>
          ${schedulesHtml}
        </div>
      `;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  selectDate(date) {
    navigate('schedules', { doctorId: this.currentDoctorId, deptId: this.currentDeptId, date });
  },
  
  async showConfirm(scheduleId) {
    this.currentScheduleId = scheduleId;
    
    try {
      const res = await API.get(`/api/schedules/${scheduleId}`);
      const schedule = res.data;
      
      const html = `
        <h2 style="margin-bottom: 20px;">预约确认</h2>
        <div class="detail-row">
          <div class="label">科室</div>
          <div class="value">${escapeHtml(schedule.department?.name || '')}</div>
        </div>
        <div class="detail-row">
          <div class="label">医生</div>
          <div class="value">${escapeHtml(schedule.doctor?.name || '')} - ${escapeHtml(schedule.doctor?.title || '')}</div>
        </div>
        <div class="detail-row">
          <div class="label">日期</div>
          <div class="value">${formatDate(schedule.date)}</div>
        </div>
        <div class="detail-row">
          <div class="label">时段</div>
          <div class="value">${getTimeSlotText(schedule.timeSlot)}</div>
        </div>
        <div class="detail-row">
          <div class="label">挂号费</div>
          <div class="value" style="color: #ff4d4f; font-weight: 600;">¥${schedule.fee}</div>
        </div>
        
        <h3 style="margin: 24px 0 16px;">实名信息</h3>
        <div class="form-group">
          <label>姓名</label>
          <input type="text" id="patientName" placeholder="请输入真实姓名">
        </div>
        <div class="form-group">
          <label>身份证号</label>
          <input type="text" id="patientIdCard" placeholder="请输入身份证号">
        </div>
        <div class="form-group">
          <label>手机号</label>
          <input type="text" id="patientPhone" placeholder="请输入手机号">
        </div>
        
        <div style="margin-top: 24px; display: flex; gap: 12px;">
          <button class="btn btn-default" onclick="navigate('schedules', { doctorId: '${schedule.doctorId}', deptId: '${schedule.departmentId}' })">取消</button>
          <button class="btn btn-primary" onclick="PatientPages.confirmBooking()">确认预约</button>
        </div>
      `;
      
      document.getElementById('content').innerHTML = `<div class="card">${html}</div>`;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  async confirmBooking() {
    const patientName = document.getElementById('patientName').value.trim();
    const patientIdCard = document.getElementById('patientIdCard').value.trim();
    const patientPhone = document.getElementById('patientPhone').value.trim();
    
    if (!patientName || !patientIdCard || !patientPhone) {
      showToast('请填写完整的实名信息', 'warn');
      return;
    }
    
    try {
      const res = await API.post('/api/appointments', {
        scheduleId: this.currentScheduleId,
        patientName,
        patientIdCard,
        patientPhone,
      });
      
      showToast('预约成功！请尽快完成支付', 'success');
      
      setTimeout(() => {
        this.simulatePayment(res.data.id);
      }, 500);
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  async simulatePayment(appointmentId) {
    try {
      await API.post(`/api/appointments/${appointmentId}/pay`, {
        paymentId: `pay_${Date.now()}`,
      });
      showToast('支付成功！', 'success');
      navigate('appointments');
    } catch (error) {
      showToast('支付失败：' + error.message, 'error');
      navigate('appointments');
    }
  },
  
  async renderAppointments() {
    try {
      const res = await API.get('/api/appointments/my');
      const appointments = res.data;
      
      let html = `<h2 style="margin-bottom: 20px;">我的预约</h2>`;
      
      if (appointments.length === 0) {
        html += `<div class="empty"><div class="icon">📋</div><p>暂无预约记录</p><button class="btn btn-primary" style="margin-top: 16px;" onclick="navigate('departments')">去预约</button></div>`;
      } else {
        html += `<table class="table">
          <thead>
            <tr>
              <th>科室</th>
              <th>医生</th>
              <th>日期</th>
              <th>时段</th>
              <th>费用</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>`;
        
        appointments.forEach(apt => {
          html += `
            <tr>
              <td>${escapeHtml(apt.department?.name || '')}</td>
              <td>${escapeHtml(apt.doctor?.name || '')}</td>
              <td>${formatDate(apt.date)}</td>
              <td>${getTimeSlotText(apt.timeSlot)}</td>
              <td>¥${apt.fee}</td>
              <td><span class="status-tag ${getStatusClass(apt.status)}">${getStatusText(apt.status)}</span></td>
              <td>
                <button class="btn btn-default btn-sm" onclick="navigate('appointmentDetail', { id: '${apt.id}' })">详情</button>
                ${(apt.status === 'PENDING_PAYMENT' || apt.status === 'PENDING_VISIT') ? 
                  `<button class="btn btn-danger btn-sm" style="margin-left: 8px;" onclick="PatientPages.cancelAppointment('${apt.id}')">取消</button>` : ''}
                ${apt.status === 'PENDING_PAYMENT' ? 
                  `<button class="btn btn-success btn-sm" style="margin-left: 8px;" onclick="PatientPages.payAppointment('${apt.id}')">支付</button>` : ''}
              </td>
            </tr>
          `;
        });
        
        html += '</tbody></table>';
      }
      
      document.getElementById('content').innerHTML = `<div class="card">${html}</div>`;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  async renderAppointmentDetail() {
    const id = getParam('id');
    
    try {
      const res = await API.get(`/api/appointments/${id}`);
      const apt = res.data;
      
      let actionsHtml = '';
      if (apt.status === 'PENDING_PAYMENT') {
        actionsHtml = `
          <button class="btn btn-success" onclick="PatientPages.payAppointment('${apt.id}')">立即支付</button>
          <button class="btn btn-danger" style="margin-left: 12px;" onclick="PatientPages.cancelAppointment('${apt.id}')">取消预约</button>
        `;
      } else if (apt.status === 'PENDING_VISIT') {
        actionsHtml = `
          <button class="btn btn-primary" onclick="PatientPages.checkIn('${apt.id}')">签到</button>
          <button class="btn btn-danger" style="margin-left: 12px;" onclick="PatientPages.cancelAppointment('${apt.id}')">取消预约</button>
        `;
      }
      
      const html = `
        <div style="margin-bottom: 20px;">
          <a href="javascript:void(0)" onclick="navigate('appointments')" style="color: #1890ff; text-decoration: none;">
            ← 返回我的预约
          </a>
        </div>
        <h2 style="margin-bottom: 20px;">预约详情</h2>
        <div class="detail-row">
          <div class="label">预约单号</div>
          <div class="value">${apt.id}</div>
        </div>
        <div class="detail-row">
          <div class="label">状态</div>
          <div class="value"><span class="status-tag ${getStatusClass(apt.status)}">${getStatusText(apt.status)}</span></div>
        </div>
        <div class="detail-row">
          <div class="label">科室</div>
          <div class="value">${escapeHtml(apt.department?.name || '')}</div>
        </div>
        <div class="detail-row">
          <div class="label">医生</div>
          <div class="value">${escapeHtml(apt.doctor?.name || '')} - ${escapeHtml(apt.doctor?.title || '')}</div>
        </div>
        <div class="detail-row">
          <div class="label">就诊日期</div>
          <div class="value">${formatDate(apt.date)}</div>
        </div>
        <div class="detail-row">
          <div class="label">就诊时段</div>
          <div class="value">${getTimeSlotText(apt.timeSlot)}</div>
        </div>
        <div class="detail-row">
          <div class="label">挂号费用</div>
          <div class="value">¥${apt.fee}</div>
        </div>
        <div class="detail-row">
          <div class="label">患者姓名</div>
          <div class="value">${escapeHtml(apt.patientName || '')}</div>
        </div>
        <div class="detail-row">
          <div class="label">排队号</div>
          <div class="value">${apt.queueNumber || '-'}</div>
        </div>
        <div class="detail-row">
          <div class="label">创建时间</div>
          <div class="value">${formatDateTime(apt.createdAt)}</div>
        </div>
        ${apt.paidAt ? `
        <div class="detail-row">
          <div class="label">支付时间</div>
          <div class="value">${formatDateTime(apt.paidAt)}</div>
        </div>` : ''}
        
        <div style="margin-top: 24px;">${actionsHtml}</div>
      `;
      
      document.getElementById('content').innerHTML = `<div class="card">${html}</div>`;
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  async payAppointment(appointmentId) {
    if (!confirm('确定要支付此预约吗？')) return;
    
    try {
      await API.post(`/api/appointments/${appointmentId}/pay`, {
        paymentId: `pay_${Date.now()}`,
      });
      showToast('支付成功！', 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  async cancelAppointment(appointmentId) {
    if (!confirm('确定要取消此预约吗？')) return;
    
    try {
      await API.post(`/api/appointments/${appointmentId}/cancel`);
      showToast('取消成功', 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
  
  async checkIn(appointmentId) {
    try {
      await API.post(`/api/appointments/${appointmentId}/checkin`);
      showToast('签到成功！', 'success');
      renderPage();
    } catch (error) {
      showToast(error.message, 'error');
    }
  },
};
