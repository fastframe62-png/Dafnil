/**
 * Main Application Controller for Mobile-First Student Assessment Web App
 * Features Desktop Vertical Scroll Fix & Custom Logo/Icon File Uploading.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Atmosphere Animation Background (Meteor -> Badai -> Salju every 10s)
  let atmosphereInstance = null;
  if (window.AtmosphereEngine) {
    atmosphereInstance = new window.AtmosphereEngine('stars-canvas', 'mobile-screen');
    window.atmosphereInstance = atmosphereInstance;
  }

  // Header Atmosphere Badge Click -> Cycle next mode immediately
  const atmosphereBadge = document.getElementById('atmosphere-badge');
  if (atmosphereBadge) {
    atmosphereBadge.addEventListener('click', () => {
      if (atmosphereInstance) {
        const nextIdx = (atmosphereInstance.currentModeIndex + 1) % atmosphereInstance.modes.length;
        const nextMode = atmosphereInstance.modes[nextIdx];
        atmosphereInstance.setMode(nextMode);
        showToast(`Suasana: ${atmosphereInstance.modeLabels[nextMode]}`);
      }
    });
  }

  // 2. Navigation Router
  const navItems = document.querySelectorAll('.nav-item');
  const spaViews = document.querySelectorAll('.spa-view');

  window.appNav = function(viewId) {
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    spaViews.forEach(view => {
      if (view.id === `view-${viewId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    renderCurrentView(viewId);
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewId = item.getAttribute('data-view');
      appNav(viewId);
    });
  });

  // Toast Notification System
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2200);
  }

  // Generic Modal Helpers
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // Custom Logo / Icon Renderer
  function renderAppLogo() {
    const identity = appStorage.getIdentity();
    const icon = identity.customIcon || '🏫';

    const hdrLogoBox = document.getElementById('hdr-logo-box');
    const dashHeroLogo = document.getElementById('dash-hero-logo');
    const settingsPreview = document.getElementById('settings-logo-preview');

    [hdrLogoBox, dashHeroLogo, settingsPreview].forEach(el => {
      if (!el) return;
      if (typeof icon === 'string' && icon.startsWith('data:image')) {
        el.innerHTML = `<img src="${icon}" class="app-logo-img" alt="Logo">`;
      } else {
        el.textContent = icon;
      }
    });
  }

  // Custom Bottom Navigation Icons Renderer
  function renderNavIcons() {
    const navIcons = appStorage.getNavIcons();
    const views = ['dashboard', 'siswa', 'penilaian', 'rekap', 'pengaturan'];

    views.forEach(v => {
      const iconVal = navIcons[v] || '⭐';

      // Bottom Navigation Bar Icon
      const navIconEl = document.getElementById(`nav-icon-${v}`);
      if (navIconEl) {
        if (typeof iconVal === 'string' && iconVal.startsWith('data:image')) {
          navIconEl.innerHTML = `<img src="${iconVal}" class="nav-custom-img" alt="${v}">`;
        } else {
          navIconEl.textContent = iconVal;
        }
      }

      // Settings Preview Box
      const previewBox = document.getElementById(`nav-preview-${v}`);
      if (previewBox) {
        if (typeof iconVal === 'string' && iconVal.startsWith('data:image')) {
          previewBox.innerHTML = `<img src="${iconVal}" class="nav-custom-img" alt="${v}">`;
        } else {
          previewBox.textContent = iconVal;
        }
      }
    });
  }

  // Global State Sync
  function syncHeaderInfo() {
    const identity = appStorage.getIdentity();
    const classKey = appStorage.getActiveClassKey();
    const classInfo = appStorage.getClassInfo(classKey);
    const sem = appStorage.getActiveSemester();

    document.getElementById('hdr-school-name').textContent = identity.namaSekolah || 'SD ..........';
    document.getElementById('hdr-mapel-info').textContent = identity.mataPelajaran || 'Mata Pelajaran';
    document.getElementById('hdr-class-name').textContent = `📚 ${classInfo ? classInfo.name : 'Kelas'}`;
    
    const semBadge = document.getElementById('hdr-semester-badge');
    const semText = document.getElementById('hdr-sem-text');
    semText.textContent = sem === 1 ? '📘 S1' : '📗 S2';

    if (sem === 1) {
      semBadge.className = 'semester-badge sem-1-badge';
    } else {
      semBadge.className = 'semester-badge sem-2-badge';
    }

    renderAppLogo();
    renderNavIcons();
  }

  // Header Semester Click Switcher
  document.getElementById('hdr-semester-badge').addEventListener('click', () => {
    const currentSem = appStorage.getActiveSemester();
    const newSem = currentSem === 1 ? 2 : 1;
    appStorage.setActiveSemester(newSem);
    syncHeaderInfo();
    showToast(`Berpindah ke Semester ${newSem}`);
    
    const activeView = document.querySelector('.spa-view.active');
    if (activeView) {
      renderCurrentView(activeView.id.replace('view-', ''));
    }
  });

  // Header Class Badge Click -> Open Edit / Switch Rombel Modal
  document.getElementById('btn-edit-rombel').addEventListener('click', () => {
    renderRombelManagerModal();
    openModal('modal-edit-rombel');
  });

  document.getElementById('dash-class-tag').addEventListener('click', () => {
    renderRombelManagerModal();
    openModal('modal-edit-rombel');
  });

  document.getElementById('btn-open-class-manager').addEventListener('click', () => {
    renderRombelManagerModal();
    openModal('modal-edit-rombel');
  });

  function renderRombelManagerModal() {
    const activeKey = appStorage.getActiveClassKey();
    const allClasses = appStorage.getAllClasses();
    const container = document.getElementById('modal-rombel-list-container');
    container.innerHTML = '';

    const levels = ['4', '5', '6'];

    levels.forEach(lvl => {
      const levelClasses = Object.values(allClasses).filter(c => String(c.level) === String(lvl));
      
      const groupDiv = document.createElement('div');
      groupDiv.style.marginBottom = '0.5rem';

      let itemsHtml = '';
      levelClasses.forEach(c => {
        const isActive = c.id === activeKey;
        itemsHtml += `
          <div class="glass-card" style="padding: 0.5rem 0.75rem; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: space-between; border-color: ${isActive ? 'var(--primary-light)' : 'var(--card-border)'}; background: ${isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(22, 30, 46, 0.6)'};">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; cursor: pointer;" class="rombel-select-item" data-key="${c.id}">
              <span style="font-size: 1rem;">${isActive ? '🔘' : '⚪'}</span>
              <span style="font-weight: 700; font-size: 0.85rem; color: ${isActive ? '#fff' : 'var(--text-muted)'};">${escapeHtml(c.name)}</span>
              <span style="font-size: 0.675rem; color: var(--text-dim);">(${c.students.length} Siswa)</span>
            </div>
            ${Object.keys(allClasses).length > 1 ? `<button class="icon-btn icon-btn-danger delete-rombel-btn" data-key="${c.id}" data-name="${escapeHtml(c.name)}" title="Hapus Rombel">🗑️</button>` : ''}
          </div>
        `;
      });

      groupDiv.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: 800; color: var(--accent-cyan); margin-bottom: 0.3rem;">📌 KELAS ${lvl}</div>
        ${itemsHtml || '<div style="font-size: 0.7rem; color: var(--text-dim);">Belum ada rombel.</div>'}
      `;

      container.appendChild(groupDiv);
    });

    container.querySelectorAll('.rombel-select-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.getAttribute('data-key');
        appStorage.setActiveClassKey(key);
        closeModal('modal-edit-rombel');
        syncHeaderInfo();
        showToast(`Aktif: ${appStorage.getClassInfo(key).name}`);
        
        const activeView = document.querySelector('.spa-view.active');
        if (activeView) renderCurrentView(activeView.id.replace('view-', ''));
      });
    });

    container.querySelectorAll('.delete-rombel-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const key = btn.getAttribute('data-key');
        const name = btn.getAttribute('data-name');
        if (confirm(`Apakah Anda yakin ingin menghapus rombel "${name}" beserta seluruh data siswanya?`)) {
          appStorage.deleteClass(key);
          renderRombelManagerModal();
          syncHeaderInfo();
          showToast(`Rombel ${name} dihapus.`);

          if (window.appSupabase && window.appSupabase.isConnected) {
            window.appSupabase.deleteClassFromCloud(key);
          }

          const activeView = document.querySelector('.spa-view.active');
          if (activeView) renderCurrentView(activeView.id.replace('view-', ''));
        }
      });
    });
  }

  document.getElementById('btn-add-new-rombel').addEventListener('click', async () => {
    const level = document.getElementById('new-rombel-level-select').value;
    const inputName = document.getElementById('new-rombel-name-input').value.trim();

    if (inputName) {
      let fullName = inputName;
      if (!fullName.toLowerCase().startsWith('kelas')) {
        fullName = `Kelas ${level} ${inputName}`;
      }

      const newKey = appStorage.addClass(level, fullName);
      appStorage.setActiveClassKey(newKey);
      document.getElementById('new-rombel-name-input').value = '';
      closeModal('modal-edit-rombel');
      syncHeaderInfo();
      showToast(`Rombel baru "${fullName}" ditambahkan!`);

      if (window.appSupabase && window.appSupabase.isConnected) {
        try {
          await window.appSupabase.syncClassToCloud(newKey, fullName, level);
        } catch (e) {
          console.warn('Gagal sync rombel baru ke cloud:', e);
        }
      }

      const activeView = document.querySelector('.spa-view.active');
      if (activeView) renderCurrentView(activeView.id.replace('view-', ''));
    }
  });


  // Render Logic based on View ID
  function renderCurrentView(viewId) {
    syncHeaderInfo();
    switch (viewId) {
      case 'dashboard':
        renderDashboardView();
        break;
      case 'siswa':
        renderStudentView();
        break;
      case 'penilaian':
        renderPenilaianView();
        break;
      case 'rekap':
        renderRekapView();
        break;
      case 'pengaturan':
        renderPengaturanView();
        break;
    }
  }

  // ==========================================================================
  // 1. DASHBOARD VIEW RENDER
  // ==========================================================================
  function renderDashboardView() {
    const identity = appStorage.getIdentity();
    const classKey = appStorage.getActiveClassKey();
    const classInfo = appStorage.getClassInfo(classKey);
    const sem = appStorage.getActiveSemester();
    const students = appStorage.getStudents(classKey);

    document.getElementById('dash-school-sub').textContent = identity.namaSekolah || 'SD ..........';
    document.getElementById('dash-class-tag').textContent = `📚 ${classInfo.name} ✏️`;
    document.getElementById('dash-sem-tag').textContent = sem === 1 ? '📘 Semester 1' : '📗 Semester 2';
    
    document.getElementById('dash-count-siswa').textContent = students.length;
    document.getElementById('dash-count-lm').textContent = '4 LM';
    document.getElementById('dash-count-tp').textContent = '16 TP';

    const progress = appStorage.calculateClassProgress(classKey, sem);
    document.getElementById('dash-progress-pct').textContent = `${progress}%`;
    document.getElementById('dash-progress-fill').style.width = `${progress}%`;

    let totalAvgSum = 0;
    let studentAvgCount = 0;
    students.forEach(student => {
      const avg = appStorage.calculateStudentSemesterAverage(classKey, sem, student.id);
      if (avg !== null) {
        totalAvgSum += avg;
        studentAvgCount++;
      }
    });

    const classAvg = studentAvgCount > 0 ? (totalAvgSum / studentAvgCount).toFixed(1) : 0;
    document.getElementById('dash-avg-class').textContent = classAvg;
  }

  document.getElementById('dash-btn-export').addEventListener('click', () => {
    openModal('modal-export-excel');
  });

  // ==========================================================================
  // 2. DAFTAR SISWA VIEW RENDER & BATCH/EXCEL OPERATIONS
  // ==========================================================================
  let selectedStudentIds = new Set();
  const studentSearchInput = document.getElementById('siswa-search-input');
  const chkSelectAll = document.getElementById('chk-select-all-students');
  const btnDeleteSelected = document.getElementById('btn-delete-selected-students');
  const selectedCountBadge = document.getElementById('selected-count-badge');

  studentSearchInput.addEventListener('input', () => {
    renderStudentView();
  });

  chkSelectAll.addEventListener('change', () => {
    const classKey = appStorage.getActiveClassKey();
    const students = appStorage.getStudents(classKey);
    const searchQuery = studentSearchInput.value.toLowerCase().trim();
    const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery));

    if (chkSelectAll.checked) {
      filtered.forEach(s => selectedStudentIds.add(s.id));
    } else {
      filtered.forEach(s => selectedStudentIds.delete(s.id));
    }
    updateBatchToolbar();
    renderStudentListOnly();
  });

  function updateBatchToolbar() {
    const count = selectedStudentIds.size;
    selectedCountBadge.textContent = count;

    if (count > 0) {
      btnDeleteSelected.style.display = 'inline-flex';
      btnDeleteSelected.textContent = `🗑️ Hapus Terpilih (${count})`;
    } else {
      btnDeleteSelected.style.display = 'none';
      chkSelectAll.checked = false;
    }
  }

  function renderStudentView() {
    const classKey = appStorage.getActiveClassKey();
    const classInfo = appStorage.getClassInfo(classKey);
    document.getElementById('siswa-rombel-subtitle').textContent = classInfo.name;

    renderStudentListOnly();
  }

  function renderStudentListOnly() {
    const classKey = appStorage.getActiveClassKey();
    const students = appStorage.getStudents(classKey);
    const searchQuery = studentSearchInput.value.toLowerCase().trim();
    const container = document.getElementById('student-list-container');

    container.innerHTML = '';

    const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery));

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
          ${students.length === 0 ? 'Belum ada siswa di rombel ini.<br>Klik "📥 Import Excel" atau "+ Tambah Manual".' : 'Siswa tidak ditemukan.'}
        </div>
      `;
      updateBatchToolbar();
      return;
    }

    filtered.forEach((student) => {
      const fullIndex = students.findIndex(s => s.id === student.id) + 1;
      const isChecked = selectedStudentIds.has(student.id);

      const card = document.createElement('div');
      card.className = 'student-item-card';
      if (isChecked) {
        card.style.borderColor = 'var(--primary-light)';
        card.style.background = 'rgba(99, 102, 241, 0.15)';
      }

      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; overflow: hidden; margin-right: 0.5rem;">
          <input type="checkbox" class="student-chk" data-id="${student.id}" ${isChecked ? 'checked' : ''} style="accent-color: var(--primary); cursor: pointer;">
          <div class="student-number">${fullIndex}</div>
          <div class="student-name-text">${escapeHtml(student.name)}</div>
        </div>
        <div class="student-actions">
          <button class="icon-btn edit-student-btn" data-id="${student.id}" data-name="${escapeHtml(student.name)}" title="Edit Nama">✏️</button>
          <button class="icon-btn icon-btn-danger delete-student-btn" data-id="${student.id}" data-name="${escapeHtml(student.name)}" title="Hapus Siswa">🗑️</button>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.student-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = chk.getAttribute('data-id');
        if (chk.checked) {
          selectedStudentIds.add(id);
        } else {
          selectedStudentIds.delete(id);
        }
        updateBatchToolbar();
        renderStudentListOnly();
      });
    });

    container.querySelectorAll('.edit-student-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        document.getElementById('modal-edit-student-id').value = id;
        document.getElementById('modal-edit-student-name-input').value = name;
        openModal('modal-edit-student');
      });
    });

    container.querySelectorAll('.delete-student-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        document.getElementById('modal-delete-student-id').value = id;
        document.getElementById('delete-student-confirm-text').textContent = `Apakah Anda yakin ingin menghapus siswa "${name}"?`;
        openModal('modal-confirm-delete-student');
      });
    });

    updateBatchToolbar();
  }

  document.getElementById('btn-add-student-modal').addEventListener('click', () => {
    document.getElementById('modal-student-name-input').value = '';
    openModal('modal-add-student');
  });

  document.getElementById('modal-student-add-btn').addEventListener('click', async () => {
    const name = document.getElementById('modal-student-name-input').value;
    if (name.trim()) {
      const classKey = appStorage.getActiveClassKey();
      const newStd = appStorage.addStudent(name, classKey);
      closeModal('modal-add-student');
      renderStudentView();
      showToast('Siswa berhasil ditambahkan!');

      // Sinkronkan ke Supabase jika terhubung
      if (window.appSupabase && window.appSupabase.isConnected && newStd) {
        try {
          await window.appSupabase.syncSingleStudentToCloud(classKey, newStd, appStorage);
        } catch (e) {
          console.warn('Gagal sinkron siswa baru ke cloud:', e);
        }
      }
    }
  });

  document.getElementById('modal-student-save-edit-btn').addEventListener('click', async () => {
    const id = document.getElementById('modal-edit-student-id').value;
    const newName = document.getElementById('modal-edit-student-name-input').value;
    if (id && newName.trim()) {
      appStorage.updateStudent(id, newName);
      closeModal('modal-edit-student');
      renderStudentView();
      showToast('Nama siswa diperbarui!');

      // Sinkronkan ke Supabase jika terhubung
      if (window.appSupabase && window.appSupabase.isConnected) {
        try {
          await window.appSupabase.updateStudentInCloud(id, newName);
        } catch (e) {
          console.warn('Gagal sinkron edit siswa ke cloud:', e);
        }
      }
    }
  });

  document.getElementById('modal-student-confirm-delete-btn').addEventListener('click', async () => {
    const id = document.getElementById('modal-delete-student-id').value;
    if (id) {
      appStorage.deleteStudent(id);
      selectedStudentIds.delete(id);
      closeModal('modal-confirm-delete-student');
      renderStudentView();
      showToast('Siswa telah dihapus');

      // Sinkronkan ke Supabase jika terhubung
      if (window.appSupabase && window.appSupabase.isConnected) {
        try {
          await window.appSupabase.deleteStudentFromCloud(id);
        } catch (e) {
          console.warn('Gagal sinkron hapus siswa ke cloud:', e);
        }
      }
    }
  });

  btnDeleteSelected.addEventListener('click', () => {
    const count = selectedStudentIds.size;
    if (count > 0) {
      document.getElementById('delete-batch-confirm-text').textContent = `Apakah Anda yakin ingin menghapus ${count} siswa yang dipilih beserta seluruh data nilainya?`;
      openModal('modal-confirm-delete-batch');
    }
  });

  document.getElementById('modal-batch-confirm-delete-btn').addEventListener('click', async () => {
    const idsToDelete = Array.from(selectedStudentIds);
    const deletedCount = appStorage.deleteStudentsBatch(idsToDelete);
    selectedStudentIds.clear();
    closeModal('modal-confirm-delete-batch');
    renderStudentView();
    showToast(`${deletedCount} siswa berhasil dihapus!`);

    // Sinkronkan ke Supabase jika terhubung
    if (window.appSupabase && window.appSupabase.isConnected && idsToDelete.length > 0) {
      try {
        await window.appSupabase.deleteStudentsBatchFromCloud(idsToDelete);
      } catch (e) {
        console.warn('Gagal sinkron hapus batch siswa ke cloud:', e);
      }
    }
  });

  document.getElementById('btn-clear-all-students').addEventListener('click', () => {
    const classKey = appStorage.getActiveClassKey();
    const classInfo = appStorage.getClassInfo(classKey);
    const count = classInfo.students.length;

    if (count === 0) {
      showToast('Belum ada siswa di rombel ini.');
      return;
    }

    document.getElementById('clear-all-confirm-text').textContent = `Apakah Anda yakin ingin menghapus SELURUH ${count} siswa di "${classInfo.name}"? Data nilai rombel ini akan dikosongkan.`;
    openModal('modal-confirm-clear-all');
  });

  document.getElementById('modal-clear-all-confirm-btn').addEventListener('click', async () => {
    const classKey = appStorage.getActiveClassKey();
    const count = appStorage.deleteAllStudents(classKey);
    selectedStudentIds.clear();
    closeModal('modal-confirm-clear-all');
    renderStudentView();
    showToast(`Seluruh data (${count} siswa) dikosongkan.`);

    // Sinkronkan ke Supabase jika terhubung
    if (window.appSupabase && window.appSupabase.isConnected) {
      try {
        await window.appSupabase.deleteAllStudentsFromCloud(classKey);
      } catch (e) {
        console.warn('Gagal sinkron hapus semua siswa ke cloud:', e);
      }
    }
  });


  // EXCEL STUDENT IMPORT LOGIC
  const excelFileInput = document.getElementById('excel-student-file-input');
  const btnImportExcel = document.getElementById('btn-import-excel-students');
  let pendingImportNames = [];

  btnImportExcel.addEventListener('click', () => {
    excelFileInput.value = '';
    excelFileInput.click();
  });

  excelFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        pendingImportNames = extractStudentNamesFromSheet(jsonData);

        if (pendingImportNames.length === 0) {
          alert('Tidak dapat menemukan kolom nama siswa dari file Excel tersebut. Pastikan ada kolom header "Nama" atau daftar nama siswa.');
          return;
        }

        document.getElementById('import-preview-count').textContent = pendingImportNames.length;
        
        const previewList = document.getElementById('import-preview-list');
        previewList.innerHTML = '';
        pendingImportNames.forEach(name => {
          const li = document.createElement('li');
          li.textContent = name;
          previewList.appendChild(li);
        });

        const targetSelect = document.getElementById('import-target-rombel-select');
        targetSelect.innerHTML = '';
        const allClasses = appStorage.getAllClasses();
        const activeKey = appStorage.getActiveClassKey();

        ['4', '5', '6'].forEach(lvl => {
          const levelClasses = Object.values(allClasses).filter(c => String(c.level) === String(lvl));
          if (levelClasses.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `Kelas ${lvl}`;
            levelClasses.forEach(c => {
              const opt = document.createElement('option');
              opt.value = c.id;
              opt.textContent = c.name;
              if (c.id === activeKey) opt.selected = true;
              optgroup.appendChild(opt);
            });
            targetSelect.appendChild(optgroup);
          }
        });

        // Tampilkan indikator status database Supabase di preview modal
        const cloudStatusEl = document.getElementById('import-cloud-sync-status');
        const cloudTextEl = document.getElementById('import-cloud-sync-text');
        if (cloudStatusEl && cloudTextEl) {
          if (window.appSupabase && window.appSupabase.isConnected) {
            cloudStatusEl.style.display = 'flex';
            cloudStatusEl.style.background = 'rgba(16, 185, 129, 0.15)';
            cloudStatusEl.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            cloudStatusEl.style.color = 'var(--accent-emerald)';
            cloudTextEl.innerHTML = '🟢 <b>Database Cloud Terhubung</b>: Data siswa akan otomatis masuk ke Supabase PostgreSQL & memori lokal.';
          } else {
            cloudStatusEl.style.display = 'flex';
            cloudStatusEl.style.background = 'rgba(245, 158, 11, 0.15)';
            cloudStatusEl.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            cloudStatusEl.style.color = 'var(--accent-amber)';
            cloudTextEl.innerHTML = '💾 <b>Mode Lokal</b>: Tersimpan di memori perangkat saat ini. (Hubungkan Supabase di Pengaturan untuk auto-sync database).';
          }
        }

        openModal('modal-excel-import-preview');

      } catch (err) {
        console.error('Failed to parse Excel file:', err);
        alert('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv yang valid.');
      }
    };
    reader.readAsArrayBuffer(file);
  });

  function extractStudentNamesFromSheet(rows) {
    if (!rows || rows.length === 0) return [];

    let nameColIndex = -1;
    let startRowIndex = 0;

    // Scan hingga 25 baris pertama untuk mencari kolom Nama Siswa
    for (let r = 0; r < Math.min(25, rows.length); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').toLowerCase().trim();
        if (val.includes('nama') || val.includes('siswa') || val.includes('peserta') || val.includes('student')) {
          if (!val.includes('ayah') && !val.includes('ibu') && !val.includes('wali') && !val.includes('sekolah') && !val.includes('guru')) {
            nameColIndex = c;
            startRowIndex = r + 1;
            break;
          }
        }
      }
      if (nameColIndex !== -1) break;
    }

    // Fallback: cari kolom teks pertama
    if (nameColIndex === -1) {
      for (let r = 0; r < Math.min(10, rows.length); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').trim();
          if (val && isNaN(val) && val.length > 2 && !val.toLowerCase().includes('no') && !val.toLowerCase().includes('nis')) {
            nameColIndex = c;
            startRowIndex = r;
            break;
          }
        }
        if (nameColIndex !== -1) break;
      }
    }

    if (nameColIndex === -1) nameColIndex = 0;

    const ignoreWords = ['nama', 'siswa', 'peserta', 'daftar', 'no', 'nomor', 'nis', 'nisn', 'l/p', 'jk', 'gender', 'jenis kelamin', 'keterangan', 'status', 'total', 'jumlah', 'rata-rata', 'catatan'];

    const names = [];
    for (let r = startRowIndex; r < rows.length; r++) {
      const row = rows[r];
      if (Array.isArray(row) && row[nameColIndex] !== undefined && row[nameColIndex] !== null) {
        const nameStr = String(row[nameColIndex]).trim();
        const lower = nameStr.toLowerCase();
        
        if (nameStr && isNaN(nameStr) && nameStr.length >= 2) {
          const isIgnored = ignoreWords.some(w => lower === w || lower.startsWith(w + ' '));
          if (!isIgnored) {
            names.push(nameStr);
          }
        }
      }
    }

    return names;
  }

  document.getElementById('btn-confirm-excel-import').addEventListener('click', async () => {
    const targetRombelKey = document.getElementById('import-target-rombel-select').value;
    if (pendingImportNames.length > 0 && targetRombelKey) {
      const confirmBtn = document.getElementById('btn-confirm-excel-import');
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Menyimpan... ⏳';

      // 1. Simpan ke Local Storage
      const count = appStorage.addStudentsBatch(pendingImportNames, targetRombelKey);
      
      appStorage.setActiveClassKey(targetRombelKey);
      syncHeaderInfo();
      renderStudentView();

      // 2. Simpan LANGSUNG ke Database Supabase jika terhubung
      let cloudSaved = false;
      let cloudErrorMsg = '';

      if (window.appSupabase) {
        if (!window.appSupabase.isConnected) {
          await window.appSupabase.testConnection();
        }

        if (window.appSupabase.isConnected) {
          try {
            showToast(`Menyimpan ${count} siswa ke Database Supabase... ⏳`);
            const allStudentsInRombel = appStorage.getStudents(targetRombelKey);
            await window.appSupabase.syncStudentsToCloud(targetRombelKey, allStudentsInRombel, appStorage);
            cloudSaved = true;
          } catch (err) {
            console.error('Supabase import error:', err);
            cloudErrorMsg = err.message || 'Error koneksi database';
          }
        }
      }

      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Proses Impor';
      closeModal('modal-excel-import-preview');

      if (cloudSaved) {
        showToast(`✅ Berhasil! ${count} siswa masuk ke database Supabase & Lokal! 🎉`, 4000);
      } else if (cloudErrorMsg) {
        showToast(`⚠️ Siswa tersimpan di lokal, namun gagal masuk database: ${cloudErrorMsg}`, 5000);
      } else {
        showToast(`Berhasil mengimpor ${count} siswa (Tersimpan Lokal) 📊`, 4000);
      }
    }
  });


  // ==========================================================================
  // 3. INPUT NILAI VIEW RENDER
  // ==========================================================================
  const btnSem1 = document.getElementById('btn-sem-1-select');
  const btnSem2 = document.getElementById('btn-sem-2-select');

  btnSem1.addEventListener('click', () => {
    appStorage.setActiveSemester(1);
    appStorage.setActiveLmIndex(0);
    renderPenilaianView();
  });

  btnSem2.addEventListener('click', () => {
    appStorage.setActiveSemester(2);
    appStorage.setActiveLmIndex(4);
    renderPenilaianView();
  });

  function renderPenilaianView() {
    const sem = appStorage.getActiveSemester();
    const classKey = appStorage.getActiveClassKey();
    const curriculum = appStorage.getCurriculum();
    const students = appStorage.getStudents(classKey);

    if (sem === 1) {
      btnSem1.className = 'sem-toggle-btn active-s1';
      btnSem2.className = 'sem-toggle-btn';
    } else {
      btnSem1.className = 'sem-toggle-btn';
      btnSem2.className = 'sem-toggle-btn active-s2';
    }

    const lmStartIndex = sem === 1 ? 0 : 4;
    const lmEndIndex = sem === 1 ? 3 : 7;

    let activeLmIdx = appStorage.getActiveLmIndex();
    if (activeLmIdx < lmStartIndex || activeLmIdx > lmEndIndex) {
      activeLmIdx = lmStartIndex;
      appStorage.setActiveLmIndex(activeLmIdx);
    }

    const chipBar = document.getElementById('lm-chip-bar');
    chipBar.innerHTML = '';

    for (let i = lmStartIndex; i <= lmEndIndex; i++) {
      const lm = curriculum[i];
      const chip = document.createElement('div');
      chip.className = `chip-item ${i === activeLmIdx ? 'active' : ''}`;
      chip.textContent = lm ? lm.name : `LM ${i + 1}`;
      chip.addEventListener('click', () => {
        appStorage.setActiveLmIndex(i);
        renderPenilaianView();
      });
      chipBar.appendChild(chip);
    }

    const currentLm = curriculum[activeLmIdx];
    document.getElementById('active-lm-title-text').textContent = currentLm ? currentLm.name : `Lingkup Materi ${activeLmIdx + 1}`;
    document.getElementById('active-tp-summary-text').textContent = currentLm ? (currentLm.tps.join(' • ') + ' • Sumatif LM') : 'TP 1 - TP 4 • Sumatif LM';

    const container = document.getElementById('scoring-cards-container');
    container.innerHTML = '';

    if (students.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
          Belum ada siswa di rombel ini.<br>Buka menu <b>Siswa</b> untuk menambah atau impor dari Excel.
        </div>
      `;
      return;
    }

    students.forEach((student, idx) => {
      const card = document.createElement('div');
      card.className = 'score-card';

      let tpInputsHtml = '';
      // TP 1 sampai TP 4
      for (let tpIdx = 0; tpIdx < 4; tpIdx++) {
        const score = appStorage.getGrade(classKey, sem, student.id, activeLmIdx, tpIdx);
        
        let scoreClass = '';
        if (typeof score === 'number') {
          if (score >= 75) scoreClass = 'tp-score-pass';
          else if (score >= 60) scoreClass = 'tp-score-warn';
          else scoreClass = 'tp-score-low';
        }

        tpInputsHtml += `
          <div class="tp-input-box">
            <span class="tp-label">TP ${tpIdx + 1}</span>
            <input type="number" 
                   min="0" max="100" 
                   class="tp-input ${scoreClass}" 
                   data-student-id="${student.id}" 
                   data-tp-idx="${tpIdx}" 
                   value="${score !== '' ? score : ''}" 
                   placeholder="-">
          </div>
        `;
      }

      // Kolom Nilai Sumatif LM (tpIdx = 4) untuk Lingkup Materi 1 s/d 8
      const sumatifScore = appStorage.getGrade(classKey, sem, student.id, activeLmIdx, 4);
      let sumatifClass = '';
      if (typeof sumatifScore === 'number') {
        if (sumatifScore >= 75) sumatifClass = 'tp-score-pass';
        else if (sumatifScore >= 60) sumatifClass = 'tp-score-warn';
        else sumatifClass = 'tp-score-low';
      }

      tpInputsHtml += `
        <div class="tp-input-box sumatif-box">
          <span class="tp-label sumatif-label">Sumatif</span>
          <input type="number" 
                 min="0" max="100" 
                 class="tp-input sumatif-input ${sumatifClass}" 
                 data-student-id="${student.id}" 
                 data-tp-idx="4" 
                 data-is-sumatif="true"
                 value="${sumatifScore !== '' ? sumatifScore : ''}" 
                 placeholder="-">
        </div>
      `;

      card.innerHTML = `
        <div class="score-card-header">
          <div class="score-student-info">
            <div class="student-number">${idx + 1}</div>
            <div class="student-name-text">${escapeHtml(student.name)}</div>
          </div>
        </div>
        <div class="tp-grid">
          ${tpInputsHtml}
        </div>
      `;

      container.appendChild(card);
    });

    container.querySelectorAll('.tp-input').forEach(input => {
      input.addEventListener('input', () => {
        const studentId = input.getAttribute('data-student-id');
        const tpIdx = parseInt(input.getAttribute('data-tp-idx'), 10);
        const isSumatif = input.getAttribute('data-is-sumatif') === 'true';
        let valStr = input.value.trim();

        if (valStr === '') {
          appStorage.setGrade(classKey, sem, studentId, activeLmIdx, tpIdx, '');
          input.className = isSumatif ? 'tp-input sumatif-input' : 'tp-input';
          return;
        }

        let num = parseInt(valStr, 10);
        if (isNaN(num)) num = 0;
        if (num > 100) num = 100;
        if (num < 0) num = 0;

        input.value = num;

        let passClass = isSumatif ? 'tp-input sumatif-input ' : 'tp-input ';
        if (num >= 75) input.className = passClass + 'tp-score-pass';
        else if (num >= 60) input.className = passClass + 'tp-score-warn';
        else input.className = passClass + 'tp-score-low';

        appStorage.setGrade(classKey, sem, studentId, activeLmIdx, tpIdx, num);
      });

      input.addEventListener('change', async () => {
        const isSumatif = input.getAttribute('data-is-sumatif') === 'true';
        showToast(isSumatif ? 'Nilai sumatif tersimpan' : 'Nilai tersimpan');
        if (window.appSupabase && window.appSupabase.isConnected) {
          const studentId = input.getAttribute('data-student-id');
          const tpIdx = parseInt(input.getAttribute('data-tp-idx'), 10);
          const valStr = input.value.trim();
          const score = valStr === '' ? null : parseInt(valStr, 10);
          try {
            await window.appSupabase.syncSingleGradeToCloud(classKey, sem, studentId, activeLmIdx, tpIdx, score);
          } catch (e) {
            console.warn('Gagal sync nilai ke cloud:', e);
          }
        }
      });
    });
  }

  document.getElementById('btn-edit-materi-modal').addEventListener('click', () => {
    const activeLmIdx = appStorage.getActiveLmIndex();
    const curriculum = appStorage.getCurriculum();
    const currentLm = curriculum[activeLmIdx];

    document.getElementById('modal-lm-title-input').value = currentLm ? currentLm.name : `Lingkup Materi ${activeLmIdx + 1}`;
    document.getElementById('modal-tp1-input').value = currentLm && currentLm.tps[0] ? currentLm.tps[0] : 'TP 1';
    document.getElementById('modal-tp2-input').value = currentLm && currentLm.tps[1] ? currentLm.tps[1] : 'TP 2';
    document.getElementById('modal-tp3-input').value = currentLm && currentLm.tps[2] ? currentLm.tps[2] : 'TP 3';
    document.getElementById('modal-tp4-input').value = currentLm && currentLm.tps[3] ? currentLm.tps[3] : 'TP 4';

    openModal('modal-edit-materi');
  });

  document.getElementById('modal-materi-save-btn').addEventListener('click', async () => {
    const activeLmIdx = appStorage.getActiveLmIndex();
    const lmTitle = document.getElementById('modal-lm-title-input').value;
    const tp1 = document.getElementById('modal-tp1-input').value;
    const tp2 = document.getElementById('modal-tp2-input').value;
    const tp3 = document.getElementById('modal-tp3-input').value;
    const tp4 = document.getElementById('modal-tp4-input').value;

    if (lmTitle.trim()) {
      appStorage.updateLmTitle(activeLmIdx, lmTitle.trim());
      appStorage.updateTpTitle(activeLmIdx, 0, tp1.trim());
      appStorage.updateTpTitle(activeLmIdx, 1, tp2.trim());
      appStorage.updateTpTitle(activeLmIdx, 2, tp3.trim());
      appStorage.updateTpTitle(activeLmIdx, 3, tp4.trim());

      closeModal('modal-edit-materi');
      renderPenilaianView();
      showToast('Judul Lingkup Materi & TP berhasil disimpan!');

      if (window.appSupabase && window.appSupabase.isConnected) {
        try {
          const tps = [tp1.trim(), tp2.trim(), tp3.trim(), tp4.trim()];
          await window.appSupabase.syncCurriculumLmToCloud(activeLmIdx, lmTitle.trim(), tps);
        } catch (e) {
          console.warn('Gagal sync materi ke cloud:', e);
        }
      }
    }
  });


  // ==========================================================================
  // 4. REKAP NILAI VIEW RENDER
  // ==========================================================================
  let activeRekapSem = 1;

  const rekapTabS1 = document.getElementById('rekap-tab-s1');
  const rekapTabS2 = document.getElementById('rekap-tab-s2');
  const rekapSearchInput = document.getElementById('rekap-search-input');

  rekapTabS1.addEventListener('click', () => {
    activeRekapSem = 1;
    rekapTabS1.className = 'chip-item active';
    rekapTabS2.className = 'chip-item';
    renderRekapView();
  });

  rekapTabS2.addEventListener('click', () => {
    activeRekapSem = 2;
    rekapTabS1.className = 'chip-item';
    rekapTabS2.className = 'chip-item active';
    renderRekapView();
  });

  rekapSearchInput.addEventListener('input', () => {
    renderRekapView();
  });

  document.getElementById('rekap-btn-export').addEventListener('click', () => {
    openModal('modal-export-excel');
  });

  function renderRekapView() {
    const classKey = appStorage.getActiveClassKey();
    const students = appStorage.getStudents(classKey);
    const curriculum = appStorage.getCurriculum();
    const searchQuery = rekapSearchInput.value.toLowerCase().trim();
    const table = document.getElementById('rekap-data-table');

    const lmStartIndex = activeRekapSem === 1 ? 0 : 4;
    const lmEndIndex = activeRekapSem === 1 ? 3 : 7;

    let tr1 = `<tr><th rowspan="2">No</th><th rowspan="2">Nama Siswa</th>`;
    let tr2 = `<tr>`;

    for (let i = lmStartIndex; i <= lmEndIndex; i++) {
      const lm = curriculum[i];
      const name = lm ? lm.name : `LM ${i + 1}`;
      tr1 += `<th colspan="5">${escapeHtml(name)}</th>`;
      tr2 += `<th>TP1</th><th>TP2</th><th>TP3</th><th>TP4</th><th class="th-sumatif">Sumatif</th>`;
    }

    tr1 += `<th rowspan="2">Rata-rata</th></tr>`;
    tr2 += `</tr>`;

    let tableHtml = `<thead>${tr1}${tr2}</thead><tbody>`;

    const filtered = students.filter(s => s.name.toLowerCase().includes(searchQuery));

    if (filtered.length === 0) {
      tableHtml += `
        <tr>
          <td colspan="23" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Tidak ada data rekap nilai.
          </td>
        </tr>
      `;
    } else {
      filtered.forEach((student, idx) => {
        tableHtml += `<tr>`;
        tableHtml += `<td>${idx + 1}</td>`;
        tableHtml += `<td class="name-col">${escapeHtml(student.name)}</td>`;

        for (let lmIndex = lmStartIndex; lmIndex <= lmEndIndex; lmIndex++) {
          // TP 1 sampai TP 4
          for (let tpIndex = 0; tpIndex < 4; tpIndex++) {
            const score = appStorage.getGrade(classKey, activeRekapSem, student.id, lmIndex, tpIndex);
            tableHtml += `<td>${score !== '' ? score : '-'}</td>`;
          }
          // Kolom Nilai Sumatif LM (tpIndex = 4)
          const sumatifScore = appStorage.getGrade(classKey, activeRekapSem, student.id, lmIndex, 4);
          tableHtml += `<td class="td-sumatif">${sumatifScore !== '' ? `<b>${sumatifScore}</b>` : '-'}</td>`;
        }

        const avg = appStorage.calculateStudentSemesterAverage(classKey, activeRekapSem, student.id);
        if (avg !== null) {
          const avgVal = avg.toFixed(1);
          let badgeColor = avgVal >= 75 ? 'rgba(16, 185, 129, 0.2)' : (avgVal >= 60 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(244, 63, 94, 0.2)');
          let textColor = avgVal >= 75 ? 'var(--accent-emerald)' : (avgVal >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)');
          tableHtml += `<td><span class="avg-badge" style="background: ${badgeColor}; color: ${textColor};">${avgVal}</span></td>`;
        } else {
          tableHtml += `<td>-</td>`;
        }

        tableHtml += `</tr>`;
      });
    }

    tableHtml += `</tbody>`;
    table.innerHTML = tableHtml;
  }


  // ==========================================================================
  // 5. PENGATURAN VIEW RENDER & LOGO ACTIONS
  // ==========================================================================
  function renderPengaturanView() {
    const identity = appStorage.getIdentity();
    const classKey = appStorage.getActiveClassKey();
    const classInfo = appStorage.getClassInfo(classKey);
    const allClasses = appStorage.getAllClasses();

    document.getElementById('id-nama-sekolah').value = identity.namaSekolah || '';
    document.getElementById('id-npsn').value = identity.npsn || '';
    document.getElementById('id-nama-guru').value = identity.namaGuru || '';
    document.getElementById('id-nip-guru').value = identity.nipGuru || '';
    document.getElementById('id-nama-ks').value = identity.namaKepalaSekolah || '';
    document.getElementById('id-nip-ks').value = identity.nipKepalaSekolah || '';
    document.getElementById('id-mapel').value = identity.mataPelajaran || '';
    document.getElementById('id-tp-tahun').value = identity.tahunPelajaran || '';

    const selectClass = document.getElementById('select-active-class-key');
    selectClass.innerHTML = '';

    ['4', '5', '6'].forEach(lvl => {
      const levelClasses = Object.values(allClasses).filter(c => String(c.level) === String(lvl));
      if (levelClasses.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `Kelas ${lvl}`;
        levelClasses.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          if (c.id === classKey) opt.selected = true;
          optgroup.appendChild(opt);
        });
        selectClass.appendChild(optgroup);
      }
    });

    document.getElementById('input-rombel-name-current').value = classInfo.name;
    renderAppLogo();
    renderNavIcons();

    if (window.appSupabase) {
      document.getElementById('input-supabase-url').value = window.appSupabase.config.url || '';
      document.getElementById('input-supabase-key').value = window.appSupabase.config.key || '';
      window.appSupabase.testConnection();
    }
  }

  // Helper: Kompresi gambar upload agar ringan dan cepat tersimpan di Supabase
  function compressImageFile(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', 0.85);
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Preset Icon Bar Listeners
  document.querySelectorAll('.preset-icon-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const icon = btn.getAttribute('data-icon');
      appStorage.setCustomIcon(icon);
      renderAppLogo();
      showToast('Icon diperbarui!');

      if (window.appSupabase && window.appSupabase.isConnected) {
        try {
          await window.appSupabase.syncIdentityToCloud(appStorage);
        } catch (e) {
          console.warn('Gagal sync icon ke cloud:', e);
        }
      }
    });
  });

  // Custom Logo File Upload Listener
  const btnUploadLogo = document.getElementById('btn-trigger-upload-logo');
  const customLogoFileInput = document.getElementById('custom-logo-file-input');

  btnUploadLogo.addEventListener('click', () => {
    customLogoFileInput.value = '';
    customLogoFileInput.click();
  });

  customLogoFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file gambar terlalu besar. Harap gunakan gambar maksimal 5MB.');
      return;
    }

    showToast('Memproses & mengunggah logo... ⏳');
    compressImageFile(file, 256, 256, async (dataUrl) => {
      appStorage.setCustomIcon(dataUrl);
      renderAppLogo();
      showToast('Logo berhasil diunggah! 🖼️');

      if (window.appSupabase && window.appSupabase.isConnected) {
        try {
          await window.appSupabase.syncIdentityToCloud(appStorage);
          showToast('✅ Logo tersimpan di database Supabase!');
        } catch (e) {
          console.warn('Gagal sync logo ke cloud:', e);
        }
      }
    });
  });

  document.getElementById('btn-reset-custom-logo').addEventListener('click', async () => {
    appStorage.setCustomIcon('🏫');
    renderAppLogo();
    showToast('Icon di-reset ke bawaan');

    if (window.appSupabase && window.appSupabase.isConnected) {
      try {
        await window.appSupabase.syncIdentityToCloud(appStorage);
      } catch (e) {
        console.warn('Gagal sync reset logo ke cloud:', e);
      }
    }
  });

  // Nav Icon Upload & Reset Listeners
  let currentTargetNavKey = null;
  const navIconFileInput = document.getElementById('nav-icon-file-input');

  document.querySelectorAll('.btn-upload-nav-icon').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTargetNavKey = btn.getAttribute('data-nav');
      if (navIconFileInput) {
        navIconFileInput.value = '';
        navIconFileInput.click();
      }
    });
  });

  if (navIconFileInput) {
    navIconFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || !currentTargetNavKey) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran icon terlalu besar. Maksimal 5MB.');
        return;
      }

      showToast('Memproses icon... ⏳');
      compressImageFile(file, 128, 128, async (dataUrl) => {
        appStorage.setNavIcon(currentTargetNavKey, dataUrl);
        renderNavIcons();
        showToast(`Icon ${currentTargetNavKey.toUpperCase()} berhasil diubah!`);

        if (window.appSupabase && window.appSupabase.isConnected) {
          try {
            await window.appSupabase.syncIdentityToCloud(appStorage);
            showToast(`✅ Icon ${currentTargetNavKey.toUpperCase()} tersimpan di database Supabase!`);
          } catch (e) {
            console.warn('Gagal sync nav icon ke cloud:', e);
          }
        }
      });
    });
  }

  const btnResetAllNavIcons = document.getElementById('btn-reset-all-nav-icons');
  if (btnResetAllNavIcons) {
    btnResetAllNavIcons.addEventListener('click', async () => {
      appStorage.resetNavIcons();
      renderNavIcons();
      showToast('Seluruh icon menu dikembalikan ke bawaan');

      if (window.appSupabase && window.appSupabase.isConnected) {
        try {
          await window.appSupabase.syncIdentityToCloud(appStorage);
        } catch (e) {
          console.warn('Gagal sync reset nav icons ke cloud:', e);
        }
      }
    });
  }

  // Atmosphere Effect Mode Switcher Buttons
  document.querySelectorAll('.btn-atmosphere-select').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      document.querySelectorAll('.btn-atmosphere-select').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');

      if (atmosphereInstance) {
        if (mode === 'auto') {
          showToast('Suasana: Otomatis berganti tiap 10s');
        } else {
          atmosphereInstance.setMode(mode);
          showToast(`Suasana diatur: ${atmosphereInstance.modeLabels[mode] || mode}`);
        }
      }
    });
  });

  // Supabase Manual Connection Listener
  document.getElementById('btn-save-supabase-manual')?.addEventListener('click', async () => {
    const url = document.getElementById('input-supabase-url').value;
    const key = document.getElementById('input-supabase-key').value;
    if (url && key && window.appSupabase) {
      window.appSupabase.setManualConfig(url, key);
      showToast('Menghubungkan ke Supabase...');
      const ok = await window.appSupabase.testConnection();
      if (ok) {
        showToast('Berhasil terhubung ke Supabase Cloud! 🟢');
      } else {
        alert('Gagal terhubung. Pastikan URL, API Key benar, dan script SQL telah dijalankan di Supabase.');
      }
    }
  });

  document.getElementById('btn-clear-supabase-manual')?.addEventListener('click', () => {
    if (window.appSupabase) {
      window.appSupabase.clearManualConfig();
      document.getElementById('input-supabase-url').value = '';
      document.getElementById('input-supabase-key').value = '';
      showToast('Koneksi manual diputus (Mode Lokal)');
    }
  });

  // Supabase Push to Cloud
  document.getElementById('btn-sync-push-cloud')?.addEventListener('click', async () => {
    if (!window.appSupabase) return;
    try {
      showToast('Mengunggah data ke Supabase Cloud...');
      await window.appSupabase.pushAllToCloud(appStorage);
      showToast('Seluruh data berhasil diupload ke Supabase Cloud! ☁️');
    } catch (err) {
      console.error(err);
      alert('Gagal upload ke cloud: ' + err.message);
    }
  });

  // Supabase Pull from Cloud
  document.getElementById('btn-sync-pull-cloud')?.addEventListener('click', async () => {
    if (!window.appSupabase) return;
    if (!confirm('Unduh data dari Supabase Cloud? Data lokal di perangkat ini akan diperbarui sesuai database cloud.')) return;
    try {
      showToast('Mengunduh data dari Supabase Cloud...');
      await window.appSupabase.pullAllFromCloud(appStorage);
      syncHeaderInfo();
      const activeView = document.querySelector('.spa-view.active');
      if (activeView) renderCurrentView(activeView.id.replace('view-', ''));
      showToast('Data berhasil diperbarui dari Supabase Cloud! ☁️');
    } catch (err) {
      console.error(err);
      alert('Gagal download dari cloud: ' + err.message);
    }
  });

  document.getElementById('form-identity').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.querySelector('#form-identity button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan ke Cloud... ⏳';
    }

    const updated = {
      namaSekolah: document.getElementById('id-nama-sekolah').value.trim(),
      npsn: document.getElementById('id-npsn').value.trim(),
      namaGuru: document.getElementById('id-nama-guru').value.trim(),
      nipGuru: document.getElementById('id-nip-guru').value.trim(),
      namaKepalaSekolah: document.getElementById('id-nama-ks').value.trim(),
      nipKepalaSekolah: document.getElementById('id-nip-ks').value.trim(),
      mataPelajaran: document.getElementById('id-mapel').value.trim(),
      tahunPelajaran: document.getElementById('id-tp-tahun').value.trim(),
    };

    appStorage.updateIdentity(updated);
    syncHeaderInfo();

    let cloudSaved = false;
    let cloudErrorMsg = '';

    if (window.appSupabase) {
      if (!window.appSupabase.isConnected) {
        await window.appSupabase.testConnection();
      }
      if (window.appSupabase.isConnected) {
        try {
          showToast('Menyimpan ke database Supabase... ⏳');
          await window.appSupabase.syncIdentityToCloud(appStorage);
          cloudSaved = true;
        } catch (err) {
          console.error('Gagal simpan identitas ke Supabase:', err);
          cloudErrorMsg = err.message || 'Error koneksi database';
        }
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Simpan Identitas';
    }

    if (cloudSaved) {
      showToast('✅ Identitas Sekolah berhasil tersimpan di database Supabase & Lokal! 🎉');
    } else if (cloudErrorMsg) {
      showToast(`⚠️ Tersimpan di lokal, gagal sinkron database: ${cloudErrorMsg}`, 5000);
    } else {
      showToast('Identitas Sekolah & Guru disimpan di memori lokal!');
    }
  });

  document.getElementById('select-active-class-key').addEventListener('change', (e) => {
    const newClassKey = e.target.value;
    appStorage.setActiveClassKey(newClassKey);
    renderPengaturanView();
    syncHeaderInfo();
    showToast(`Aktif: ${appStorage.getClassInfo(newClassKey).name}`);
  });

  document.getElementById('btn-save-rombel-inline').addEventListener('click', async () => {
    const classKey = appStorage.getActiveClassKey();
    const newName = document.getElementById('input-rombel-name-current').value;
    if (newName.trim()) {
      appStorage.updateRombelName(classKey, newName.trim());
      syncHeaderInfo();
      showToast('Nama Rombel berhasil diubah!');

      if (window.appSupabase && window.appSupabase.isConnected) {
        try {
          const cInfo = appStorage.getClassInfo(classKey);
          await window.appSupabase.syncClassToCloud(classKey, newName.trim(), cInfo.level);
        } catch (e) {
          console.warn('Gagal sync nama rombel ke cloud:', e);
        }
      }
    }
  });

  document.getElementById('btn-export-backup-json').addEventListener('click', () => {
    const jsonStr = appStorage.exportJsonData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_penilaian_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON berhasil diunduh');
  });

  document.getElementById('btn-trigger-reset-data').addEventListener('click', () => {
    openModal('modal-confirm-reset');
  });

  document.getElementById('modal-confirm-reset-btn').addEventListener('click', async () => {
    appStorage.resetAllData();
    closeModal('modal-confirm-reset');
    appNav('dashboard');
    showToast('Aplikasi telah di-reset ke data bawaan');

    if (window.appSupabase && window.appSupabase.isConnected) {
      showToast('Mereset database cloud... ⏳');
      try {
        await window.appSupabase.syncResetAllToCloud(appStorage);
        showToast('Database cloud telah direset ke data awal! ☁️');
      } catch (e) {
        console.warn('Gagal reset data di cloud:', e);
      }
    }
  });


  // ==========================================================================
  // 6. EXPORT EXCEL MODAL ACTIONS
  // ==========================================================================
  document.getElementById('btn-export-opt-s1').addEventListener('click', () => {
    ExcelExporter.exportSemester(1, appStorage);
    closeModal('modal-export-excel');
    showToast('Excel Semester 1 berhasil dibuat! 📊');
  });

  document.getElementById('btn-export-opt-s2').addEventListener('click', () => {
    ExcelExporter.exportSemester(2, appStorage);
    closeModal('modal-export-excel');
    showToast('Excel Semester 2 berhasil dibuat! 📊');
  });

  document.getElementById('btn-export-opt-all').addEventListener('click', () => {
    ExcelExporter.exportAllSemesters(appStorage);
    closeModal('modal-export-excel');
    showToast('Excel Semua Semester berhasil dibuat! 📊');
  });


  // Utility: HTML Escaper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Load Trigger
  appNav('dashboard');
});
