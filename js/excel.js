/**
 * Excel Export Engine using SheetJS (XLSX)
 * Generates print-ready .xlsx workbooks with formatted multi-level headers,
 * metadata blocks, custom sheets, averages, and printable signature blocks.
 */

class ExcelExporter {
  static exportSemester(semester, storage) {
    const state = storage.getState();
    const classKey = storage.getActiveClassKey();
    const classInfo = storage.getClassInfo(classKey);
    const identity = state.identity;
    const curriculum = state.curriculum;
    const students = storage.getStudents(classKey);

    const wb = XLSX.utils.book_new();
    const ws = this.createSemesterSheet(semester, classKey, classInfo, identity, curriculum, students, storage);
    
    const semTitle = semester === 1 ? 'Semester 1' : 'Semester 2';
    XLSX.utils.book_append_sheet(wb, ws, semTitle);

    const filename = `Penilaian_${classInfo.name.replace(/\s+/g, '_')}_Semester_${semester}_${identity.tahunPelajaran.replace('/', '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  static exportAllSemesters(storage) {
    const state = storage.getState();
    const classKey = storage.getActiveClassKey();
    const classInfo = storage.getClassInfo(classKey);
    const identity = state.identity;
    const curriculum = state.curriculum;
    const students = storage.getStudents(classKey);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Identitas
    const wsIdentitas = this.createIdentitasSheet(classInfo, identity, students);
    XLSX.utils.book_append_sheet(wb, wsIdentitas, 'Identitas');

    // Sheet 2: Semester 1
    const wsS1 = this.createSemesterSheet(1, classKey, classInfo, identity, curriculum, students, storage);
    XLSX.utils.book_append_sheet(wb, wsS1, 'Semester 1');

    // Sheet 3: Semester 2
    const wsS2 = this.createSemesterSheet(2, classKey, classInfo, identity, curriculum, students, storage);
    XLSX.utils.book_append_sheet(wb, wsS2, 'Semester 2');

    // Sheet 4: Rekap Keseluruhan
    const wsRekap = this.createRekapSheet(classKey, classInfo, identity, students, storage);
    XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap Keseluruhan');

    const filename = `Penilaian_Lengkap_${classInfo.name.replace(/\s+/g, '_')}_${identity.tahunPelajaran.replace('/', '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  static createSemesterSheet(semester, classKey, classInfo, identity, curriculum, students, storage) {
    const rows = [];
    const merges = [];

    // Top Metadata Header
    rows.push(['DAFTAR PENILAIAN SISWA']);
    rows.push([`Nama Sekolah`, `:`, identity.namaSekolah]);
    rows.push([`Nama Guru`, `:`, identity.namaGuru]);
    rows.push([`Mata Pelajaran`, `:`, identity.mataPelajaran]);
    rows.push([`Kelas`, `:`, classInfo.name]);
    rows.push([`Tahun Pelajaran`, `:`, identity.tahunPelajaran]);
    rows.push([`Semester`, `:`, `Semester ${semester}`]);
    rows.push([]); // Blank row gap

    const headerRow1Index = rows.length; // 8
    const headerRow2Index = rows.length + 1; // 9

    // Build Table Header (Row 1 & Row 2)
    const row1 = ['No', 'Nama Siswa'];
    const row2 = ['', ''];

    const lmStartIndex = semester === 1 ? 0 : 4;
    const lmEndIndex = semester === 1 ? 3 : 7;

    let colPointer = 2; // Column 0=No, 1=Nama Siswa

    for (let i = lmStartIndex; i <= lmEndIndex; i++) {
      const lm = curriculum[i];
      const lmName = lm ? lm.name.toUpperCase() : `LINGKUP MATERI ${i + 1}`;
      
      row1.push(lmName, '', '', '');
      merges.push({ s: { r: headerRow1Index, c: colPointer }, e: { r: headerRow1Index, c: colPointer + 3 } });

      for (let tpIdx = 0; tpIdx < 4; tpIdx++) {
        row2.push(`TP ${tpIdx + 1}`);
      }
      colPointer += 4;
    }

    row1.push('Rata-rata');
    row2.push('');

    // Merge No, Nama Siswa, and Rata-rata vertically
    merges.push({ s: { r: headerRow1Index, c: 0 }, e: { r: headerRow2Index, c: 0 } });
    merges.push({ s: { r: headerRow1Index, c: 1 }, e: { r: headerRow2Index, c: 1 } });
    merges.push({ s: { r: headerRow1Index, c: 18 }, e: { r: headerRow2Index, c: 18 } });

    // Merge Title Banner across entire width
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 18 } });

    rows.push(row1);
    rows.push(row2);

    // Data Rows
    students.forEach((student, idx) => {
      const dataRow = [idx + 1, student.name];
      for (let lmIndex = lmStartIndex; lmIndex <= lmEndIndex; lmIndex++) {
        for (let tpIndex = 0; tpIndex < 4; tpIndex++) {
          const score = storage.getGrade(classKey, semester, student.id, lmIndex, tpIndex);
          dataRow.push(score !== '' ? score : '');
        }
      }
      const avg = storage.calculateStudentSemesterAverage(classKey, semester, student.id);
      dataRow.push(avg !== null ? Number(avg.toFixed(1)) : '');
      rows.push(dataRow);
    });

    // Signature Block
    rows.push([]); // Gap
    rows.push([]);

    const sigRow1Idx = rows.length;
    rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', 'Mengetahui,']);
    rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', 'Kepala Sekolah', '', '', '', '', 'Guru Kelas / Mata Pelajaran']);
    rows.push([]);
    rows.push([]);
    rows.push([]);
    rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', `( ${identity.namaKepalaSekolah || '................................'} )`, '', '', '', '', `( ${identity.namaGuru || '................................'} )`]);
    rows.push(['', '', '', '', '', '', '', '', '', '', '', '', '', `NIP. ${identity.nipKepalaSekolah || '....................'}`, '', '', '', '', `NIP. ${identity.nipGuru || '....................'}`]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = merges;

    // Set Column Widths
    const cols = [
      { wch: 5 },  // No
      { wch: 25 }, // Nama Siswa
    ];
    for (let i = 0; i < 16; i++) {
      cols.push({ wch: 8 }); // TP columns
    }
    cols.push({ wch: 12 }); // Rata-rata
    ws['!cols'] = cols;

    // Page Setup for Print Ready (Landscape)
    ws['!pageSetup'] = {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };

    return ws;
  }

  static createIdentitasSheet(classInfo, identity, students) {
    const rows = [
      ['IDENTITAS SEKOLAH & DAFTAR SISWA'],
      [],
      ['NAMA SEKOLAH', ':', identity.namaSekolah],
      ['NPSN', ':', identity.npsn],
      ['NAMA GURU', ':', identity.namaGuru],
      ['NIP GURU', ':', identity.nipGuru],
      ['MATA PELAJARAN', ':', identity.mataPelajaran],
      ['KELAS / ROMBEL', ':', classInfo.name],
      ['TAHUN PELAJARAN', ':', identity.tahunPelajaran],
      [],
      ['DAFTAR SISWA'],
      ['No', 'ID Siswa', 'Nama Lengkap Siswa']
    ];

    students.forEach((student, idx) => {
      rows.push([idx + 1, student.id, student.name]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }];
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    return ws;
  }

  static createRekapSheet(classKey, classInfo, identity, students, storage) {
    const rows = [
      ['REKAPITULASI PENILAIAN TAHUNAN'],
      [`Kelas: ${classInfo.name} | Tahun Pelajaran: ${identity.tahunPelajaran}`],
      [],
      ['No', 'Nama Siswa', 'Rata-rata Semester 1', 'Rata-rata Semester 2', 'Rata-rata Akhir']
    ];

    students.forEach((student, idx) => {
      const avgS1 = storage.calculateStudentSemesterAverage(classKey, 1, student.id);
      const avgS2 = storage.calculateStudentSemesterAverage(classKey, 2, student.id);

      let finalAvg = null;
      if (avgS1 !== null && avgS2 !== null) {
        finalAvg = (avgS1 + avgS2) / 2;
      } else if (avgS1 !== null) {
        finalAvg = avgS1;
      } else if (avgS2 !== null) {
        finalAvg = avgS2;
      }

      rows.push([
        idx + 1,
        student.name,
        avgS1 !== null ? Number(avgS1.toFixed(1)) : '-',
        avgS2 !== null ? Number(avgS2.toFixed(1)) : '-',
        finalAvg !== null ? Number(finalAvg.toFixed(1)) : '-'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
    ];

    return ws;
  }
}

window.ExcelExporter = ExcelExporter;
