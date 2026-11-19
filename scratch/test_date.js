const INDONESIAN_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const MONTH_MAP = {
  "januari": 0, "january": 0, "jan": 0,
  "februari": 1, "february": 1, "feb": 1,
  "maret": 2, "march": 2, "mar": 2,
  "april": 3, "apr": 3,
  "mei": 4, "may": 4,
  "juni": 5, "june": 5, "jun": 5,
  "juli": 6, "july": 6, "jul": 6,
  "agustus": 7, "august": 7, "agu": 7, "aug": 7,
  "september": 8, "sep": 8,
  "oktober": 9, "october": 9, "okt": 9, "oct": 9,
  "november": 10, "nov": 10,
  "desember": 11, "december": 11, "des": 11, "dec": 11
};

function formatIndonesianDateWithDay(dateStr) {
  if (!dateStr) return "";
  let s = String(dateStr).trim();

  // If already starts with a recognized Indonesian day name, keep or reformat
  for (let i = 0; i < INDONESIAN_DAYS.length; i++) {
    const dayName = INDONESIAN_DAYS[i];
    if (new RegExp("^" + dayName + "[,\\s]+", "i").test(s)) {
      // Strip leading day name to re-evaluate accurately
      s = s.replace(new RegExp("^" + dayName + "[,\\s]+", "i"), "").trim();
      break;
    }
  }

  // Check YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const dateObj = new Date(y, m, d);
    const dayName = INDONESIAN_DAYS[dateObj.getDay()];
    const monthName = INDONESIAN_MONTHS[m] || ymdMatch[2];
    return dayName + ", " + d + " " + monthName + " " + y;
  }

  // Check DD Month YYYY (e.g. 22 November 2026)
  const dmyMatch = s.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const mStr = dmyMatch[2].toLowerCase();
    const m = MONTH_MAP[mStr] !== undefined ? MONTH_MAP[mStr] : -1;
    const y = parseInt(dmyMatch[3], 10);
    if (m >= 0) {
      const dateObj = new Date(y, m, d);
      const dayName = INDONESIAN_DAYS[dateObj.getDay()];
      return dayName + ", " + d + " " + INDONESIAN_MONTHS[m] + " " + y;
    }
  }

  // Fallback to JS Date parser
  const parsedDate = new Date(s);
  if (!isNaN(parsedDate.getTime())) {
    const dayName = INDONESIAN_DAYS[parsedDate.getDay()];
    const d = parsedDate.getDate();
    const m = INDONESIAN_MONTHS[parsedDate.getMonth()];
    const y = parsedDate.getFullYear();
    return dayName + ", " + d + " " + m + " " + y;
  }

  return s;
}

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  let str = String(dateStr).trim();
  // Strip day name if present at start (e.g., "Minggu, 22 November 2026" -> "22 November 2026")
  str = str.replace(/^[a-zA-Z]+,?\s+/, "");

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parts = str.split(/\s+/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const monthName = parts[1].toLowerCase();
    const year = parts[2];
    if (MONTH_MAP[monthName] !== undefined && /^\d{4}$/.test(year)) {
      const mm = String(MONTH_MAP[monthName] + 1).padStart(2, "0");
      return year + "-" + mm + "-" + day;
    }
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }
  return "";
}

console.log("TEST CASES FOR formatIndonesianDateWithDay:");
console.log("22 November 2026 ->", formatIndonesianDateWithDay("22 November 2026"));
console.log("16 November 2026 ->", formatIndonesianDateWithDay("16 November 2026"));
console.log("2026-11-22 ->", formatIndonesianDateWithDay("2026-11-22"));
console.log("2026-11-16 ->", formatIndonesianDateWithDay("2026-11-16"));
console.log("Minggu, 22 November 2026 ->", formatIndonesianDateWithDay("Minggu, 22 November 2026"));
console.log("Senin, 16 November 2026 ->", formatIndonesianDateWithDay("Senin, 16 November 2026"));
console.log("14 Februari 2026 ->", formatIndonesianDateWithDay("14 Februari 2026"));

console.log("\nTEST CASES FOR formatDateForInput:");
console.log("22 November 2026 ->", formatDateForInput("22 November 2026"));
console.log("Minggu, 22 November 2026 ->", formatDateForInput("Minggu, 22 November 2026"));
console.log("Senin, 16 November 2026 ->", formatDateForInput("Senin, 16 November 2026"));
console.log("2026-11-22 ->", formatDateForInput("2026-11-22"));

console.log("\nINLINE HYDRATION TEST:");
function inlineFormatDate(rawD) {
  var days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var mMap = { "januari":0,"februari":1,"maret":2,"april":3,"mei":4,"juni":5,"juli":6,"agustus":7,"september":8,"oktober":9,"november":10,"desember":11 };
  var str = String(rawD || "").trim().replace(/^[a-zA-Z]+,?\s+/, "");
  var m = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (m && mMap[m[2].toLowerCase()] !== undefined) {
    var dt = new Date(parseInt(m[3],10), mMap[m[2].toLowerCase()], parseInt(m[1],10));
    return days[dt.getDay()] + ", " + m[1] + " " + months[mMap[m[2].toLowerCase()]] + " " + m[3];
  }
  var ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    var dt2 = new Date(parseInt(ymd[1],10), parseInt(ymd[2],10)-1, parseInt(ymd[3],10));
    return days[dt2.getDay()] + ", " + parseInt(ymd[3],10) + " " + months[parseInt(ymd[2],10)-1] + " " + ymd[1];
  }
  return rawD;
}
console.log("22 November 2026 ->", inlineFormatDate("22 November 2026"));
console.log("16 November 2026 ->", inlineFormatDate("16 November 2026"));
console.log("2026-11-22 ->", inlineFormatDate("2026-11-22"));
