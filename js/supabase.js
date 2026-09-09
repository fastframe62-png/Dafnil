/**
 * Supabase Database Sync Manager
 * Menghubungkan aplikasi Dafnil ke Supabase PostgreSQL
 * Mengambil token via serverless /api/config di Vercel atau via pengaturan lokal
 */

class SupabaseManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = {
      url: '',
      key: ''
    };
    this.init();
  }

  async init() {
    try {
      // 1. Coba ambil dari endpoint Vercel (/api/config)
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.supabaseUrl && data.supabaseAnonKey) {
          this.config.url = data.supabaseUrl;
          this.config.key = data.supabaseAnonKey;
          this.setupClient();
          return;
        }
      }
    } catch (e) {
      // Offline atau dijalankan langsung di file:// lokal
    }

    // 2. Fallback: Cek apakah disimpan manual di localStorage
    try {
      const stored = localStorage.getItem('dafnil_supabase_local_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.key) {
          this.config.url = parsed.url;
          this.config.key = parsed.key;
          this.setupClient();
          return;
        }
      }
    } catch (e) {}

    this.updateStatusBadge(false, 'Mode Lokal (Offline)');
  }

  setupClient() {
    if (!this.config.url || !this.config.key) {
      this.updateStatusBadge(false, 'Belum Terhubung');
      return;
    }

    try {
      if (window.supabase && window.supabase.createClient) {
        this.client = window.supabase.createClient(this.config.url, this.config.key);
        this.testConnection(true);
      } else {
        console.warn('Supabase JS library belum dimuat.');
        this.updateStatusBadge(false, 'SDK Belum Dimuat');
      }
    } catch (err) {
      console.error('Error inisialisasi Supabase client:', err);
      this.updateStatusBadge(false, 'Error Konfigurasi');
    }
  }

  async testConnection(autoPullIfCloudData = false) {
    if (!this.client) return false;
    try {
      const { data, error } = await this.client.from('app_classes').select('id').limit(1);
      if (error) {
        console.error('Supabase test connection failed:', error);
        this.isConnected = false;
        this.updateStatusBadge(false, 'Koneksi Gagal (Cek RLS/Tabel)');
        return false;
      }
      this.isConnected = true;
      this.updateStatusBadge(true, 'Cloud Terhubung 🟢');

      // Auto-pull data terbaru jika cloud memiliki data siswa
      if (autoPullIfCloudData && window.appStorage) {
        this.autoSyncFromCloudOnLoad(window.appStorage);
      }

      return true;
    } catch (err) {
      this.isConnected = false;
      this.updateStatusBadge(false, 'Koneksi Terputus');
      return false;
    }
  }

  async autoSyncFromCloudOnLoad(storage) {
    try {
      const { count, error } = await this.client.from('app_students').select('*', { count: 'exact', head: true });
      if (!error && count && count > 0) {
        console.log(`Supabase memiliki ${count} data siswa. Memuat data cloud terbaru...`);
        await this.pullAllFromCloud(storage);
        if (window.syncHeaderInfo) window.syncHeaderInfo();
        const activeView = document.querySelector('.spa-view.active');
        if (activeView && window.renderCurrentView) {
          window.renderCurrentView(activeView.id.replace('view-', ''));
        }
      }
    } catch (e) {
      console.warn('Auto-sync check skipped:', e);
    }
  }

  updateStatusBadge(connected, label) {
    const badge = document.getElementById('cloud-sync-badge');
    const settingsStatus = document.getElementById('settings-supabase-status');
    
    if (badge) {
      badge.className = connected ? 'cloud-badge cloud-online' : 'cloud-badge cloud-offline';
      badge.textContent = connected ? '☁️ Cloud Aktif' : '💾 Mode Lokal';
      badge.title = label;
    }

    if (settingsStatus) {
      settingsStatus.innerHTML = connected 
        ? `<span style="color: var(--accent-emerald); font-weight: 700;">🟢 ${label}</span>`
        : `<span style="color: var(--accent-amber); font-weight: 700;">🟠 ${label}</span>`;
    }
  }

  // Simpan kredensial lokal (jika tidak via Vercel env)
  setManualConfig(url, key) {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    this.config.url = cleanUrl;
    this.config.key = cleanKey;
    localStorage.setItem('dafnil_supabase_local_config', JSON.stringify({ url: cleanUrl, key: cleanKey }));
    this.setupClient();
  }

  clearManualConfig() {
    localStorage.removeItem('dafnil_supabase_local_config');
    this.config.url = '';
    this.config.key = '';
    this.client = null;
    this.isConnected = false;
    this.updateStatusBadge(false, 'Mode Lokal (Offline)');
  }

  // =========================================================================
  // REAL-TIME STUDENT & GRADE SYNC (IMPORT & CRUD)
  // =========================================================================

  /**
   * Menyimpan / Mengunggah daftar siswa ke Supabase untuk rombel tertentu.
   * Selalu memastikan tabel app_classes memiliki record rombel tersebut sebelum insert siswa
   * untuk mencegah Foreign Key constraint violation.
   */
  async syncStudentsToCloud(classKey, students, storage) {
    if (!this.client) {
      throw new Error('Koneksi Supabase belum aktif. Pastikan URL dan API Key telah diatur.');
    }

    if (!this.isConnected) {
      const ok = await this.testConnection();
      if (!ok) throw new Error('Koneksi ke Supabase gagal. Periksa izin akses (RLS) atau jaringan.');
    }

    // 1. Pastikan record Rombel ada di app_classes
    const classInfo = storage ? storage.getClassInfo(classKey) : null;
    const className = classInfo ? classInfo.name : classKey;
    const classLevel = classInfo ? String(classInfo.level) : '5';

    const { error: classErr } = await this.client.from('app_classes').upsert({
      id: classKey,
      name: className,
      level: classLevel,
      updated_at: new Date().toISOString()
    });

    if (classErr) {
      console.error('Gagal upsert class di Supabase:', classErr);
      throw new Error('Gagal mencatat rombel di database: ' + classErr.message);
    }

    // 2. Siapkan data siswa
    if (!students || students.length === 0) {
      return { success: true, count: 0 };
    }

    const studentRows = students.map(s => ({
      id: s.id,
      class_id: classKey,
      name: s.name,
      updated_at: new Date().toISOString()
    }));

    // 3. Upsert siswa per batch 100
    for (let i = 0; i < studentRows.length; i += 100) {
      const chunk = studentRows.slice(i, i + 100);
      const { error: stdErr } = await this.client.from('app_students').upsert(chunk);
      if (stdErr) {
        console.error('Gagal upsert student di Supabase:', stdErr);
        throw new Error('Gagal menyimpan siswa ke database: ' + stdErr.message);
      }
    }

    return { success: true, count: studentRows.length };
  }

  /**
   * Tambah 1 siswa baru ke database Supabase
   */
  async syncSingleStudentToCloud(classKey, student, storage) {
    if (!this.client || !this.isConnected || !student) return;
    try {
      const classInfo = storage ? storage.getClassInfo(classKey) : null;
      await this.client.from('app_classes').upsert({
        id: classKey,
        name: classInfo ? classInfo.name : classKey,
        level: classInfo ? String(classInfo.level) : '5',
        updated_at: new Date().toISOString()
      });

      const { error } = await this.client.from('app_students').upsert({
        id: student.id,
        class_id: classKey,
        name: student.name,
        updated_at: new Date().toISOString()
      });
      if (error) console.error('Gagal simpan siswa tunggal ke cloud:', error);
    } catch (e) {
      console.error('Error syncSingleStudentToCloud:', e);
    }
  }

  /**
   * Update nama siswa di database Supabase
   */
  async updateStudentInCloud(studentId, newName) {
    if (!this.client || !this.isConnected || !studentId) return;
    try {
      const { error } = await this.client.from('app_students').update({
        name: newName,
        updated_at: new Date().toISOString()
      }).eq('id', studentId);
      if (error) console.error('Gagal update siswa di cloud:', error);
    } catch (e) {
      console.error('Error updateStudentInCloud:', e);
    }
  }

  /**
   * Hapus 1 siswa dari database Supabase
   */
  async deleteStudentFromCloud(studentId) {
    if (!this.client || !this.isConnected || !studentId) return;
    try {
      const { error } = await this.client.from('app_students').delete().eq('id', studentId);
      if (error) console.error('Gagal hapus siswa di cloud:', error);
    } catch (e) {
      console.error('Error deleteStudentFromCloud:', e);
    }
  }

  /**
   * Hapus beberapa siswa (batch) dari database Supabase
   */
  async deleteStudentsBatchFromCloud(studentIds) {
    if (!this.client || !this.isConnected || !studentIds || studentIds.length === 0) return;
    try {
      const { error } = await this.client.from('app_students').delete().in('id', studentIds);
      if (error) console.error('Gagal hapus batch siswa di cloud:', error);
    } catch (e) {
      console.error('Error deleteStudentsBatchFromCloud:', e);
    }
  }

  /**
   * Hapus seluruh siswa rombel dari database Supabase
   */
  async deleteAllStudentsFromCloud(classKey) {
    if (!this.client || !this.isConnected || !classKey) return;
    try {
      const { error } = await this.client.from('app_students').delete().eq('class_id', classKey);
      if (error) console.error('Gagal hapus semua siswa di cloud:', error);
    } catch (e) {
      console.error('Error deleteAllStudentsFromCloud:', e);
    }
  }

  /**
   * Sinkronkan 1 nilai (TP score) langsung ke database Supabase
   */
  async syncSingleGradeToCloud(classKey, semester, studentId, lmIndex, tpIndex, score) {
    if (!this.client || !this.isConnected) return;
    try {
      if (score === null || score === '' || isNaN(score)) {
        await this.client.from('app_grades').delete()
          .match({ class_id: classKey, semester: semester, student_id: studentId, lm_index: lmIndex, tp_index: tpIndex });
      } else {
        await this.client.from('app_grades').upsert({
          class_id: classKey,
          semester: semester,
          student_id: studentId,
          lm_index: lmIndex,
          tp_index: tpIndex,
          score: Number(score),
          updated_at: new Date().toISOString()
        }, { onConflict: 'class_id,semester,student_id,lm_index,tp_index' });
      }
    } catch (e) {
      console.warn('Error syncSingleGradeToCloud:', e);
    }
  }

  // =========================================================================
  // FULL SYNC OPERATIONS (PULL & PUSH)
  // =========================================================================

  // PUSH: Unggah seluruh data lokal ke Supabase
  async pushAllToCloud(storage) {
    if (!this.client || !this.isConnected) {
      const ok = await this.testConnection();
      if (!ok) throw new Error('Tidak dapat terhubung ke Supabase. Periksa URL dan API Key.');
    }

    const state = storage.getState();
    const identity = state.identity;
    const classes = state.classes;
    const curriculum = state.curriculum;
    const grades = state.grades;

    // 1. Upsert Identity
    const { error: idErr } = await this.client.from('app_identity').upsert({
      id: 'default',
      nama_sekolah: identity.namaSekolah,
      npsn: identity.npsn,
      nama_guru: identity.namaGuru,
      nip_guru: identity.nipGuru,
      nama_kepala_sekolah: identity.namaKepalaSekolah,
      nip_kepala_sekolah: identity.nipKepalaSekolah,
      mata_pelajaran: identity.mataPelajaran,
      tahun_pelajaran: identity.tahunPelajaran,
      custom_icon: identity.customIcon,
      nav_icons: state.navIcons || {},
      updated_at: new Date().toISOString()
    });
    if (idErr) throw new Error('Gagal simpan Identitas: ' + idErr.message);

    // 2. Upsert Classes & Students
    for (const classKey in classes) {
      const c = classes[classKey];
      const { error: clsErr } = await this.client.from('app_classes').upsert({
        id: c.id,
        name: c.name,
        level: String(c.level),
        updated_at: new Date().toISOString()
      });
      if (clsErr) throw new Error(`Gagal simpan Kelas ${c.name}: ` + clsErr.message);

      // Students
      if (c.students && c.students.length > 0) {
        const studentRows = c.students.map(s => ({
          id: s.id,
          class_id: c.id,
          name: s.name,
          updated_at: new Date().toISOString()
        }));
        const { error: stdErr } = await this.client.from('app_students').upsert(studentRows);
        if (stdErr) throw new Error(`Gagal simpan Siswa ${c.name}: ` + stdErr.message);
      }
    }

    // 3. Upsert Curriculum
    if (curriculum && curriculum.length > 0) {
      const currRows = curriculum.map((lm, idx) => ({
        lm_index: idx,
        name: lm.name,
        tps: lm.tps,
        updated_at: new Date().toISOString()
      }));
      const { error: curErr } = await this.client.from('app_curriculum').upsert(currRows);
      if (curErr) throw new Error('Gagal simpan Kurikulum: ' + curErr.message);
    }

    // 4. Upsert Grades
    const gradeRows = [];
    for (const classKey in grades) {
      for (const semKey of ['s1', 's2']) {
        const semNum = semKey === 's1' ? 1 : 2;
        const semGrades = grades[classKey]?.[semKey] || {};
        for (const studentId in semGrades) {
          for (const lmIndex in semGrades[studentId]) {
            for (const tpIndex in semGrades[studentId][lmIndex]) {
              const score = semGrades[studentId][lmIndex][tpIndex];
              if (score !== '' && score !== null && score !== undefined) {
                gradeRows.push({
                  class_id: classKey,
                  semester: semNum,
                  student_id: studentId,
                  lm_index: parseInt(lmIndex, 10),
                  tp_index: parseInt(tpIndex, 10),
                  score: Number(score),
                  updated_at: new Date().toISOString()
                });
              }
            }
          }
        }
      }
    }

    if (gradeRows.length > 0) {
      // Upsert in batches of 200
      for (let i = 0; i < gradeRows.length; i += 200) {
        const chunk = gradeRows.slice(i, i + 200);
        const { error: grdErr } = await this.client.from('app_grades').upsert(chunk, {
          onConflict: 'class_id,semester,student_id,lm_index,tp_index'
        });
        if (grdErr) throw new Error('Gagal simpan Nilai: ' + grdErr.message);
      }
    }

    return true;
  }

  // PULL: Ambil seluruh data dari Supabase dan simpan ke lokal
  async pullAllFromCloud(storage) {
    if (!this.client || !this.isConnected) {
      const ok = await this.testConnection();
      if (!ok) throw new Error('Tidak dapat terhubung ke Supabase.');
    }

    // 1. Fetch Identity
    const { data: idData } = await this.client.from('app_identity').select('*').eq('id', 'default').single();
    if (idData) {
      storage.updateIdentity({
        namaSekolah: idData.nama_sekolah,
        npsn: idData.npsn,
        namaGuru: idData.nama_guru,
        nipGuru: idData.nip_guru,
        namaKepalaSekolah: idData.nama_kepala_sekolah,
        nipKepalaSekolah: idData.nip_kepala_sekolah,
        mataPelajaran: idData.mata_pelajaran,
        tahunPelajaran: idData.tahun_pelajaran,
        customIcon: idData.custom_icon || '🏫'
      });
      if (idData.nav_icons) {
        for (const k in idData.nav_icons) {
          storage.setNavIcon(k, idData.nav_icons[k]);
        }
      }
    }

    // 2. Fetch Classes & Students
    const { data: classRows } = await this.client.from('app_classes').select('*');
    const { data: studentRows } = await this.client.from('app_students').select('*').order('created_at', { ascending: true });

    if (classRows && classRows.length > 0) {
      const state = storage.getState();
      state.classes = {};

      classRows.forEach(c => {
        state.classes[c.id] = {
          id: c.id,
          name: c.name,
          level: String(c.level),
          students: []
        };
        if (!state.grades[c.id]) {
          state.grades[c.id] = { s1: {}, s2: {} };
        }
      });

      if (studentRows) {
        studentRows.forEach(s => {
          if (state.classes[s.class_id]) {
            state.classes[s.class_id].students.push({
              id: s.id,
              name: s.name
            });
          }
        });
      }
    }

    // 3. Fetch Curriculum
    const { data: currRows } = await this.client.from('app_curriculum').select('*').order('lm_index', { ascending: true });
    if (currRows && currRows.length === 8) {
      currRows.forEach(c => {
        storage.updateLmTitle(c.lm_index, c.name);
        if (Array.isArray(c.tps)) {
          c.tps.forEach((tp, tpIdx) => storage.updateTpTitle(c.lm_index, tpIdx, tp));
        }
      });
    }

    // 4. Fetch Grades
    const { data: gradeRows } = await this.client.from('app_grades').select('*');
    if (gradeRows) {
      gradeRows.forEach(g => {
        storage.setGrade(g.class_id, g.semester, g.student_id, g.lm_index, g.tp_index, g.score);
      });
    }

    storage.saveData();
    return true;
  }
}

window.appSupabase = new SupabaseManager();
