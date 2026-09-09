/**
 * Storage Manager for Student Assessment App
 * Handles local storage persistence, state defaults, multi-rombel class structures,
 * custom logo/icon data, and bulk student operations.
 */

const STORAGE_KEY = 'guru_sd_penilaian_app_v3';

const DEFAULT_STATE = {
  // Active Class & Semester Selection
  activeClassKey: 'kelas_5_umar',
  activeSemester: 1,
  activeLmIndex: 0,

  // Identity & Logo Settings
  identity: {
    namaSekolah: 'SD NEGERI 01 UPT',
    npsn: '10802931',
    namaGuru: 'Ahmad Fauzan, S.Pd.',
    nipGuru: '19880512 201402 1 003',
    namaKepalaSekolah: 'Drs. H. Mulyadi, M.Pd.',
    nipKepalaSekolah: '19700315 199503 1 001',
    mataPelajaran: 'Bahasa Indonesia',
    tahunPelajaran: '2026/2027',
    customIcon: '🏫', // Can be an emoji or Base64 Data URL
  },

  // Bottom Navigation Icons (Customizable per view)
  navIcons: {
    dashboard: '🏠',
    siswa: '👨‍🎓',
    penilaian: '📝',
    rekap: '📊',
    pengaturan: '⚙️'
  },

  // Multi-Rombel Classes configuration
  classes: {
    // Kelas 4
    kelas_4_utsman: {
      id: 'kelas_4_utsman',
      name: 'Kelas 4 Utsman',
      level: '4',
      students: [
        { id: 'std-101', name: 'Ahmad Fauzan' },
        { id: 'std-102', name: 'Budi Santoso' },
        { id: 'std-103', name: 'Citra Aulia' },
        { id: 'std-104', name: 'Dewi Lestari' }
      ]
    },
    
    // Kelas 5 (3 Rombel)
    kelas_5_umar: {
      id: 'kelas_5_umar',
      name: 'Kelas 5 Umar',
      level: '5',
      students: [
        { id: 'std-501', name: 'Aditya Pratama' },
        { id: 'std-502', name: 'Bayu Wijaya' },
        { id: 'std-503', name: 'Dian Sastrowardoyo' },
        { id: 'std-504', name: 'Eka Kurniawan' },
        { id: 'std-505', name: 'Farah Amalia' }
      ]
    },
    kelas_5_hasan: {
      id: 'kelas_5_hasan',
      name: 'Kelas 5 Hasan',
      level: '5',
      students: [
        { id: 'std-511', name: 'Gilang Ramadhan' },
        { id: 'std-512', name: 'Hana Alaydrus' },
        { id: 'std-513', name: 'Irfan Bachdim' },
        { id: 'std-514', name: 'Jasmine Putri' }
      ]
    },
    kelas_5_jafar: {
      id: 'kelas_5_jafar',
      name: 'Kelas 5 Jafar',
      level: '5',
      students: [
        { id: 'std-521', name: 'Khaerul Anam' },
        { id: 'std-522', name: 'Laila Majnun' },
        { id: 'std-523', name: 'Muhammad Ali' },
        { id: 'std-524', name: 'Nabila Syakieb' }
      ]
    },

    // Kelas 6 (2 Rombel)
    kelas_6_ali: {
      id: 'kelas_6_ali',
      name: 'Kelas 6 Ali',
      level: '6',
      students: [
        { id: 'std-601', name: 'Omar Daniel' },
        { id: 'std-602', name: 'Putri Marino' },
        { id: 'std-603', name: 'Qory Gore' }
      ]
    },
    kelas_6_abubakar: {
      id: 'kelas_6_abubakar',
      name: 'Kelas 6 Abu Bakar',
      level: '6',
      students: [
        { id: 'std-611', name: 'Raffi Ahmad' },
        { id: 'std-612', name: 'Siti Nurhaliza' },
        { id: 'std-613', name: 'Tulus Haryanto' }
      ]
    }
  },

  // Lingkup Materi & TP Configuration (8 LM, 4 TP each = 32 TP total)
  curriculum: [
    {
      id: 1,
      name: 'Lingkup Materi 1',
      tps: ['TP 1: Membaca & Memahami Teks', 'TP 2: Menemukan Ide Pokok', 'TP 3: Menyusun Paragraf', 'TP 4: Kosa Kata Baru']
    },
    {
      id: 2,
      name: 'Lingkup Materi 2',
      tps: ['TP 1: Menulis Surat Pribadi', 'TP 2: Penggunaan Tanda Baca', 'TP 3: Menceritakan Kembali', 'TP 4: Presentasi Lisan']
    },
    {
      id: 3,
      name: 'Lingkup Materi 3',
      tps: ['TP 1: Puisi & Majas', 'TP 2: Membaca Indah', 'TP 3: Menulis Puisi Bebas', 'TP 4: Apresiasi Sastra']
    },
    {
      id: 4,
      name: 'Lingkup Materi 4',
      tps: ['TP 1: Teks Prosedur', 'TP 2: Langkah Kegiatan', 'TP 3: Bahasa Petunjuk', 'TP 4: Praktik Mandiri']
    },
    {
      id: 5,
      name: 'Lingkup Materi 5',
      tps: ['TP 1: Teks Narasi Sejarah', 'TP 2: Tokoh & Penokohan', 'TP 3: Alur Cerita', 'TP 4: Amanat Cerita']
    },
    {
      id: 6,
      name: 'Lingkup Materi 6',
      tps: ['TP 1: Teks Eksplanasi', 'TP 2: Sebab & Akibat', 'TP 3: Istilah Ilmiah', 'TP 4: Rangkuman Teks']
    },
    {
      id: 7,
      name: 'Lingkup Materi 7',
      tps: ['TP 1: Surat Resmi & Dinas', 'TP 2: Format & Komponen', 'TP 3: Bahasa Efektif', 'TP 4: Simulasi Kirim']
    },
    {
      id: 8,
      name: 'Lingkup Materi 8',
      tps: ['TP 1: Karya Tulis Sederhana', 'TP 2: Pengumpulan Data', 'TP 3: Penyuntingan Draf', 'TP 4: Publikasi Karya']
    }
  ],

  // Grades Storage Structure
  grades: {
    kelas_4_utsman: { s1: {}, s2: {} },
    kelas_5_umar: {
      s1: {
        'std-501': {
          0: { 0: 85, 1: 90, 2: 88, 3: 92 },
          1: { 0: 80, 1: 85, 2: 90, 3: 87 }
        },
        'std-502': {
          0: { 0: 78, 1: 82, 2: 85, 3: 88 }
        }
      },
      s2: {}
    },
    kelas_5_hasan: { s1: {}, s2: {} },
    kelas_5_jafar: { s1: {}, s2: {} },
    kelas_6_ali: { s1: {}, s2: {} },
    kelas_6_abubakar: { s1: {}, s2: {} }
  }
};

class StorageManager {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
      const parsed = JSON.parse(raw);

      const validClassKey = (parsed.classes && parsed.classes[parsed.activeClassKey]) 
        ? parsed.activeClassKey 
        : 'kelas_5_umar';

      return {
        ...DEFAULT_STATE,
        ...parsed,
        activeClassKey: validClassKey,
        identity: { ...DEFAULT_STATE.identity, ...parsed.identity },
        navIcons: { ...DEFAULT_STATE.navIcons, ...(parsed.navIcons || {}) },
        classes: { ...DEFAULT_STATE.classes, ...parsed.classes },
        curriculum: parsed.curriculum && parsed.curriculum.length === 8 ? parsed.curriculum : DEFAULT_STATE.curriculum,
        grades: { ...DEFAULT_STATE.grades, ...parsed.grades }
      };
    } catch (e) {
      console.error('Error loading localStorage, using default state:', e);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  getState() {
    return this.data;
  }

  // Active Class & Semester getters/setters
  getActiveClassKey() {
    if (!this.data.classes[this.data.activeClassKey]) {
      const keys = Object.keys(this.data.classes);
      this.data.activeClassKey = keys.length > 0 ? keys[0] : 'kelas_5_umar';
    }
    return this.data.activeClassKey;
  }

  setActiveClassKey(key) {
    if (this.data.classes[key]) {
      this.data.activeClassKey = key;
      this.saveData();
    }
  }

  getActiveSemester() {
    return this.data.activeSemester || 1;
  }

  setActiveSemester(sem) {
    this.data.activeSemester = sem === 2 ? 2 : 1;
    this.saveData();
  }

  getActiveLmIndex() {
    return this.data.activeLmIndex ?? 0;
  }

  setActiveLmIndex(index) {
    this.data.activeLmIndex = index;
    this.saveData();
  }

  // Identity methods
  getIdentity() {
    return this.data.identity;
  }

  updateIdentity(newIdentity) {
    this.data.identity = { ...this.data.identity, ...newIdentity };
    this.saveData();
  }

  setCustomIcon(iconDataUrlOrEmoji) {
    this.data.identity.customIcon = iconDataUrlOrEmoji;
    this.saveData();
  }

  // Navigation Icons methods
  getNavIcons() {
    return this.data.navIcons || DEFAULT_STATE.navIcons;
  }

  setNavIcon(key, iconValue) {
    if (!this.data.navIcons) {
      this.data.navIcons = { ...DEFAULT_STATE.navIcons };
    }
    this.data.navIcons[key] = iconValue;
    this.saveData();
  }

  resetNavIcons() {
    this.data.navIcons = { ...DEFAULT_STATE.navIcons };
    this.saveData();
  }

  // Multi-Rombel Class methods
  getAllClasses() {
    return this.data.classes;
  }

  getClassInfo(classKey) {
    const key = classKey || this.getActiveClassKey();
    return this.data.classes[key] || { name: 'Kelas', level: '4', students: [] };
  }

  addClass(level, name) {
    const cleanName = name.trim();
    const id = 'kelas_' + level + '_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    
    this.data.classes[id] = {
      id: id,
      name: cleanName,
      level: String(level),
      students: []
    };

    if (!this.data.grades[id]) {
      this.data.grades[id] = { s1: {}, s2: {} };
    }

    this.saveData();
    return id;
  }

  updateRombelName(classKey, newName) {
    const key = classKey || this.getActiveClassKey();
    if (this.data.classes[key]) {
      this.data.classes[key].name = newName.trim();
      this.saveData();
    }
  }

  deleteClass(classKey) {
    const keys = Object.keys(this.data.classes);
    if (keys.length <= 1) return false;

    delete this.data.classes[classKey];
    delete this.data.grades[classKey];

    if (this.data.activeClassKey === classKey) {
      this.data.activeClassKey = Object.keys(this.data.classes)[0];
    }

    this.saveData();
    return true;
  }

  // Student methods
  getStudents(classKey) {
    const key = classKey || this.getActiveClassKey();
    return this.data.classes[key] ? this.data.classes[key].students : [];
  }

  addStudent(name, classKey) {
    const key = classKey || this.getActiveClassKey();
    if (!this.data.classes[key]) return null;

    const newStudent = {
      id: 'std-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      name: name.trim()
    };
    this.data.classes[key].students.push(newStudent);
    this.saveData();
    return newStudent;
  }

  addStudentsBatch(namesArray, classKey) {
    const key = classKey || this.getActiveClassKey();
    if (!this.data.classes[key]) return 0;

    let addedCount = 0;
    namesArray.forEach((name, idx) => {
      const cleanName = String(name).trim();
      if (cleanName) {
        this.data.classes[key].students.push({
          id: 'std-' + Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 1000),
          name: cleanName
        });
        addedCount++;
      }
    });

    this.saveData();
    return addedCount;
  }

  updateStudent(studentId, newName, classKey) {
    const key = classKey || this.getActiveClassKey();
    const students = this.getStudents(key);
    const student = students.find(s => s.id === studentId);
    if (student) {
      student.name = newName.trim();
      this.saveData();
      return true;
    }
    return false;
  }

  deleteStudent(studentId, classKey) {
    const key = classKey || this.getActiveClassKey();
    if (!this.data.classes[key]) return false;

    this.data.classes[key].students = this.data.classes[key].students.filter(s => s.id !== studentId);
    
    ['s1', 's2'].forEach(sem => {
      if (this.data.grades[key] && this.data.grades[key][sem] && this.data.grades[key][sem][studentId]) {
        delete this.data.grades[key][sem][studentId];
      }
    });

    this.saveData();
    return true;
  }

  deleteStudentsBatch(studentIdsArray, classKey) {
    const key = classKey || this.getActiveClassKey();
    if (!this.data.classes[key]) return 0;

    const idSet = new Set(studentIdsArray);
    const initialCount = this.data.classes[key].students.length;

    this.data.classes[key].students = this.data.classes[key].students.filter(s => !idSet.has(s.id));

    ['s1', 's2'].forEach(sem => {
      if (this.data.grades[key] && this.data.grades[key][sem]) {
        studentIdsArray.forEach(id => {
          if (this.data.grades[key][sem][id]) {
            delete this.data.grades[key][sem][id];
          }
        });
      }
    });

    const deletedCount = initialCount - this.data.classes[key].students.length;
    this.saveData();
    return deletedCount;
  }

  deleteAllStudents(classKey) {
    const key = classKey || this.getActiveClassKey();
    if (!this.data.classes[key]) return 0;

    const count = this.data.classes[key].students.length;
    this.data.classes[key].students = [];
    this.data.grades[key] = { s1: {}, s2: {} };

    this.saveData();
    return count;
  }

  // Curriculum LM & TP methods
  getCurriculum() {
    return this.data.curriculum;
  }

  updateLmTitle(lmIndex, newTitle) {
    if (this.data.curriculum[lmIndex]) {
      this.data.curriculum[lmIndex].name = newTitle.trim();
      this.saveData();
    }
  }

  updateTpTitle(lmIndex, tpIndex, newTitle) {
    if (this.data.curriculum[lmIndex] && this.data.curriculum[lmIndex].tps[tpIndex] !== undefined) {
      this.data.curriculum[lmIndex].tps[tpIndex] = newTitle.trim();
      this.saveData();
    }
  }

  // Grading methods
  getGrade(classKey, semester, studentId, lmIndex, tpIndex) {
    const semKey = `s${semester}`;
    try {
      const val = this.data.grades[classKey]?.[semKey]?.[studentId]?.[lmIndex]?.[tpIndex];
      return (val !== undefined && val !== null && val !== '') ? Number(val) : '';
    } catch (e) {
      return '';
    }
  }

  setGrade(classKey, semester, studentId, lmIndex, tpIndex, score) {
    const semKey = `s${semester}`;
    if (!this.data.grades[classKey]) this.data.grades[classKey] = { s1: {}, s2: {} };
    if (!this.data.grades[classKey][semKey]) this.data.grades[classKey][semKey] = {};
    if (!this.data.grades[classKey][semKey][studentId]) this.data.grades[classKey][semKey][studentId] = {};
    if (!this.data.grades[classKey][semKey][studentId][lmIndex]) this.data.grades[classKey][semKey][studentId][lmIndex] = {};

    if (score === '' || score === null || score === undefined || isNaN(score)) {
      delete this.data.grades[classKey][semKey][studentId][lmIndex][tpIndex];
    } else {
      const numScore = Math.max(0, Math.min(100, Number(score)));
      this.data.grades[classKey][semKey][studentId][lmIndex][tpIndex] = numScore;
    }
    this.saveData();
  }

  // Helper calculations
  calculateStudentSemesterAverage(classKey, semester, studentId) {
    const lmStartIndex = semester === 1 ? 0 : 4;
    const lmEndIndex = semester === 1 ? 3 : 7;
    let sum = 0;
    let count = 0;

    for (let lmIndex = lmStartIndex; lmIndex <= lmEndIndex; lmIndex++) {
      for (let tpIndex = 0; tpIndex < 4; tpIndex++) {
        const score = this.getGrade(classKey, semester, studentId, lmIndex, tpIndex);
        if (typeof score === 'number' && !isNaN(score)) {
          sum += score;
          count++;
        }
      }
    }

    return count > 0 ? (sum / count) : null;
  }

  calculateClassProgress(classKey, semester) {
    const students = this.getStudents(classKey);
    if (students.length === 0) return 0;

    const lmStartIndex = semester === 1 ? 0 : 4;
    const lmEndIndex = semester === 1 ? 3 : 7;
    const totalSlots = students.length * 4 * 4;
    let filledSlots = 0;

    students.forEach(student => {
      for (let lmIndex = lmStartIndex; lmIndex <= lmEndIndex; lmIndex++) {
        for (let tpIndex = 0; tpIndex < 4; tpIndex++) {
          const score = this.getGrade(classKey, semester, student.id, lmIndex, tpIndex);
          if (typeof score === 'number' && !isNaN(score)) {
            filledSlots++;
          }
        }
      }
    });

    return Math.round((filledSlots / totalSlots) * 100);
  }

  // Backup & Reset
  exportJsonData() {
    return JSON.stringify(this.data, null, 2);
  }

  importJsonData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.identity && parsed.classes && parsed.curriculum) {
        this.data = parsed;
        this.saveData();
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON import:', e);
    }
    return false;
  }

  resetAllData() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveData();
  }
}

window.appStorage = new StorageManager();
