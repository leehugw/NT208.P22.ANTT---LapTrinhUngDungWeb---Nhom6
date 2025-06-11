// BackEnd\Services\student\CrawlService.js
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const Student = require("../../../Database/SaveToMongo/models/Student");
const Score = require("../../../Database/SaveToMongo/models/Score");
const User = require("../../../Database/SaveToMongo/models/Users");

// Truyền profileHtml là html lấy được từ puppeteer
function parseProfileInfo(profileHtml) {
  const $ = cheerio.load(profileHtml);

  // Lấy tên, ngày sinh, giới tính
  const name = $(".hoten strong")
    .first()
    .text()
    .replace(/I\.1\.\s*HỌ VÀ TÊN:/, "")
    .trim();
  const gender = $(".gioitinh strong")
    .first()
    .text()
    .replace(/I\.2\.\s*Giới tính:/, "")
    .trim();
  const birth_date = $(".ngaysinh strong")
    .first()
    .text()
    .replace(/I\.3\.\s*Ngày, tháng, năm sinh:/, "")
    .trim();
  const birthplace = $("#edit-noisinh option:selected").text().trim();
  // Lấy MSSV ưu tiên theo input ẩn, nếu không có thì lấy từ div text
  const student_id =
    $('input[name="masv"]').val() ||
    $('div[style*="Mã số sinh viên"]')
      .first()
      .text()
      .match(/Mã số sinh viên:\s*(\d+)/)?.[1] ||
    "";

  const school_email = $('input[name="email"]').val() || "";
  const program_type = $('input[name="hedt"]').val() || "";

  // CMND
  const identity_number = $("#edit-cmnd").val() || "";
  const identity_issue_date =
    $("#edit-cmnd-ngaycap-datepicker-popup-0").val() || "";
  const identity_issue_place = $("#edit-cmnd-noicap option:selected")
    .text()
    .trim();

  // Dân tộc, tôn giáo
  const ethnicity = $("#edit-dantoc option:selected").text().trim();
  const religion = $("#edit-tongiao option:selected").text().trim();

  // Địa chỉ
  // Địa chỉ thường trú
  const diachi_thuongtru = $("#edit-diachi-thuongtru").val() || "";
  const phuongxa = $("#edit-diachi-phuongxa option:selected").text().trim();
  const quanhuyen = $("#edit-diachi-quanhuyen option:selected").text().trim();
  const tinhtp = $("#edit-diachi-tinhtp option:selected").text().trim();
  const permanent_address = [diachi_thuongtru, phuongxa, quanhuyen, tinhtp]
    .filter(Boolean)
    .join(", ");

  // Địa chỉ tạm trú
  let temporary_address = "";
  const isKTX = $("#edit-noitamtru-ktx").is(":checked");
  if (isKTX) {
    temporary_address = "Ký túc xá ĐHQG-HCM";
    const ktx_vitri = $("#edit-ktx-vitri option:selected").text().trim();
    const ktx_toanha = $("#edit-ktx-toanha option:selected").text().trim();
    const ktx_sophong = $("#edit-ktx-sophong").val() || "";
    const ktxDetail = [ktx_vitri, ktx_toanha, ktx_sophong]
      .filter(Boolean)
      .join(", ");
    if (ktxDetail) temporary_address += ", " + ktxDetail;
  } else {
    const diachi_tamtru = $("#edit-diachi-tamtru").val() || "";
    const tamtru_xaphuong = $("#edit-diachi-tamtru-xaphuong option:selected")
      .text()
      .trim();
    const tamtru_quanhuyen = $("#edit-diachi-tamtru-quanhuyen option:selected")
      .text()
      .trim();
    const tamtru_tinhtp = $("#edit-diachi-tamtru-tinhtp option:selected")
      .text()
      .trim();
    temporary_address = [
      diachi_tamtru,
      tamtru_xaphuong,
      tamtru_quanhuyen,
      tamtru_tinhtp,
    ]
      .filter(Boolean)
      .join(", ");
  }

  // Liên hệ
  const personal_email = $("#edit-email-canhan").val() || "";
  const phone = $("#edit-dienthoai").val() || "";

  // Gia đình
  const father_name = $("#edit-cha-hoten").val() || "";
  const father_job = $("#edit-cha-nghenghiep").val() || "";
  const father_phone = $("#edit-cha-dienthoai").val() || "";
  const father_address = $("#edit-cha-diachi").val() || "";

  const mother_name = $("#edit-me-hoten").val() || "";
  const mother_job = $("#edit-me-nghenghiep").val() || "";
  const mother_phone = $("#edit-me-dienthoai").val() || "";
  const mother_address = $("#edit-me-diachi").val() || "";

  // Người bảo tin
  const guardian_full = $("#edit-baotin-diachi").val() || "";
  const guardian_name = guardian_full.split(",")[0]?.trim() || "";
  const guardian_phone = $("#edit-baotin-dienthoai").val() || "";
  const guardian_address = guardian_full
    .replace(guardian_name, "")
    .replace(/^,/, "")
    .trim();

  // Ngày vào Đoàn, Đảng
  const union_join_date =
    $("#edit-ngayvaodoan").val() ||
    $("#edit-ngayvaodoan-datepicker-popup-0").val() ||
    "Không";
  const party_join_date =
    $("#edit-ngayvaodang").val() ||
    $("#edit-ngayvaodang-datepicker-popup-0").val() ||
    "Không";

  // Lấy student_id, class_id, major_id, ... (nếu có) từ div text hoặc từ bảng điểm sau
  // ==> Trang lý lịch thường có div dạng:
  // <div style="clear: both;padding-top:10px;padding-bottom: 10px;font-weight: bold">
  //    I.21. Mã số sinh viên: 23521561, Ngành học: 7480202 - An toàn Thông tin, Trường ĐH CNTT, Ký hiệu Trường QSC.
  // </div>

  // Có thể lấy thêm ngành, lớp ở đây hoặc từ trang bảng điểm
  return {
    student_id,
    name,
    gender,
    birth_date,
    birthplace,
    program_type: program_type || "", // Có thể lấy ở đây nếu muốn
    class_id: "", // Chưa lấy được từ trang này, sẽ lấy từ bảng điểm
    major_id: "", // Chưa lấy được từ trang này, sẽ lấy từ bảng điểm
    program_id: "", // Chưa lấy được từ trang này, sẽ lấy từ bảng điểm
    has_english_certificate: false, // nếu không lấy được thì default
    contact: {
      school_email:
        school_email || (student_id ? `${student_id}@gm.uit.edu.vn` : ""),
      alias_email: "",
      personal_email: $("#edit-email-canhan").val() || "",
      phone: $("#edit-dienthoai").val() || "",
    },
    address: {
      permanent_address: permanent_address || "",
      temporary_address: temporary_address || "",
    },
    identity: {
      identity_number: $("#edit-cmnd").val() || "",
      identity_issue_date:
        $("#edit-cmnd-ngaycap-datepicker-popup-0").val() || "",
      identity_issue_place: $("#edit-cmnd-noicap option:selected")
        .text()
        .trim(),
      ethnicity: $("#edit-dantoc option:selected").text().trim(),
      religion: $("#edit-tongiao option:selected").text().trim(),
      origin: $("#edit-xuatthan option:selected").text().trim() || "",
      union_join_date:
        $("#edit-ngayvaodoan").val() ||
        $("#edit-ngayvaodoan-datepicker-popup-0").val() ||
        "",
      party_join_date:
        $("#edit-ngayvaodang").val() ||
        $("#edit-ngayvaodang-datepicker-popup-0").val() ||
        "",
    },
    family: {
      father: {
        name: $("#edit-cha-hoten").val() || "",
        job: $("#edit-cha-nghenghiep").val() || "",
        phone: $("#edit-cha-dienthoai").val() || "",
        address: $("#edit-cha-diachi").val() || "",
      },
      mother: {
        name: $("#edit-me-hoten").val() || "",
        job: $("#edit-me-nghenghiep").val() || "",
        phone: $("#edit-me-dienthoai").val() || "",
        address: $("#edit-me-diachi").val() || "",
      },
      guardian: {
        name:
          ($("#edit-baotin-diachi").val() || "").split(",")[0]?.trim() || "",
        phone: $("#edit-baotin-dienthoai").val() || "",
        address: ($("#edit-baotin-diachi").val() || "")
          .replace(
            ($("#edit-baotin-diachi").val() || "").split(",")[0] || "",
            ""
          )
          .replace(/^,/, "")
          .trim(),
      },
    },
  };
}

function parseStudyResultTable(html, student_id) {
  const $ = cheerio.load(html);

  const studentTable = $("table").first();
  const rows = studentTable.find("tr");
  const class_id = $(rows[1]).find("td:nth-child(4) strong").text().trim();
  const major_id = $(rows[1]).find("td:nth-child(6) strong").text().trim();
  const program_id = $(rows[2]).find("td:nth-child(2) strong").text().trim();
  const program_type = $(rows[2]).find("td:nth-child(4) strong").text().trim();

  // --- scores mapping chuẩn ---
  let currentSemester = null,
    academic_year = null,
    semester_num = null;
  const scores = [];
  const scoreListPerSubject = {};

  $('table[border="1"] tr').each((i, row) => {
    const tds = $(row).find("td");
    if (tds.length === 1) {
      const semesterText = tds.eq(0).text().trim();
      const match = semesterText.match(
        /Học kỳ\s*(\d+)\s*-\s*Năm học\s*(\d{4})-(\d{4})/
      );
      if (match) {
        semester_num = match[1];
        academic_year = `${match[2]}-${match[3]}`;
        currentSemester = `HK${semester_num}${match[2]}${match[3]}`;
      }
      return;
    }
    if (tds.length !== 10 || tds.eq(1).text().trim() === "") return;

    const subject_id = tds.eq(1).text().trim();
    const subject_name = tds.eq(2).text().trim();
    const credits = parseInt(tds.eq(3).text().trim()) || 0;
    const score_QT = parseFloat(tds.eq(4).text().trim()) || null;
    const score_GK = parseFloat(tds.eq(5).text().trim()) || null;
    const score_TH = parseFloat(tds.eq(6).text().trim()) || null;
    const score_CK = parseFloat(tds.eq(7).text().trim()) || null;
    const score_HP = tds.eq(8).text().trim();
    let status = "None";
    if (score_HP === "Miễn") {
      status = "Đậu";
    } else if (score_HP && !isNaN(parseFloat(score_HP))) {
      status = parseFloat(score_HP) >= 5 ? "Đậu" : "Rớt";
    }

    // Push vào array cho logic isRetaken chuẩn
    const scoreRecord = {
      student_id,
      subject_id,
      subject_name,
      semester_id: currentSemester,
      semester_num: semester_num?.toString(),
      academic_year,
      score_QT,
      score_GK,
      score_TH,
      score_CK,
      score_HP: score_HP?.toString(),
      credits,
      status,
      isRetaken: false, // Sẽ tính lại sau
    };

    if (!scoreListPerSubject[subject_id]) scoreListPerSubject[subject_id] = [];
    scoreListPerSubject[subject_id].push(scoreRecord);
    scores.push(scoreRecord);
  });

  // CHUẨN HÓA isRetaken
  for (const subjectId in scoreListPerSubject) {
    let failedBefore = false;
    scoreListPerSubject[subjectId].sort(
      (a, b) => parseInt(a.semester_num) - parseInt(b.semester_num)
    );
    for (const score of scoreListPerSubject[subjectId]) {
      score.isRetaken = failedBefore;
      if (score.status === "Rớt") failedBefore = true;
    }
  }

  return {
    class_id,
    major_id,
    program_id,
    program_type,
    scores,
  };
}

exports.crawlAll = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 1. Crawl profile
  await page.goto("https://daa.uit.edu.vn/sinhvien/thongtin", {
    waitUntil: "networkidle2",
  });

  try {
    await page.waitForSelector("fieldset#edit-fieldset-create-thongtinsv h2", {
      timeout: 180000,
    });
  } catch (err) {
    await browser.close();
    throw new Error(
      "Quá thời gian chờ đăng nhập. Hãy thử lại và đảm bảo bạn đã đăng nhập DAA!"
    );
  }

  const profileHtml = await page.content();
  if (!profileHtml.includes("Mã số sinh viên")) {
    await browser.close();
    throw new Error("Bạn chưa đăng nhập thành công DAA!");
  }

  const profile = parseProfileInfo(profileHtml);
  const student_id = profile.student_id;

  // 2. Crawl bảng điểm
  await page.goto(
    `https://daa.uit.edu.vn/print/sinhvien/kqhoctap/?sid=${student_id}`,
    { waitUntil: "networkidle2" }
  );
  try {
    await page.waitForSelector('table[border="1"]', { timeout: 180000 });
  } catch (err) {
    await browser.close();
    throw new Error(
      "Quá thời gian chờ tải bảng điểm. Hãy thử lại và đảm bảo bạn đã đăng nhập DAA!"
    );
  }
  const scoresHtml = await page.content();
  if (!scoresHtml.includes("Học kỳ")) {
    await browser.close();
    throw new Error(
      "Không tìm thấy bảng điểm. Hãy đảm bảo bạn đã đăng nhập DAA!"
    );
  }
  // Chờ bảng điểm tải xong
  const resultTable = parseStudyResultTable(scoresHtml, student_id);

  // Kiểm tra chứng chỉ tiếng Anh
const hasEnglishCert = resultTable.scores.some(
  s =>
    ["ENG01", "ENG02", "ENG03"].includes(s.subject_id) &&
    s.score_HP === "Miễn"
);

  const class_id = resultTable.class_id || "";
  const major_id = class_id.substring(0, 4);
  const yearMatch = class_id.match(/\d{4}/);
  const program_id = yearMatch ? `CTDT${yearMatch[0]}` : "";

  // Gộp info cho student
  const studentInfo = {
    ...profile,
    class_id: class_id,
    major_id: major_id,
    program_id: program_id,
    program_type: resultTable.program_type,
      has_english_certificate: hasEnglishCert,
  };

  // Upsert student & user
  await Student.deleteMany({ student_id });
  await Student.updateOne({ student_id }, studentInfo, { upsert: true });

  await User.deleteMany({ student_id });
  const username = `${student_id}@gm.uit.edu.vn`;
  await User.updateOne(
    { username },
    { username, role: "student", student_id },
    { upsert: true }
  );

  // Xoá rồi insert bảng điểm
  await Score.deleteMany({ student_id });
  await Score.insertMany(resultTable.scores);

  await browser.close();

  return { student: studentInfo, scores: resultTable.scores };
};
