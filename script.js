document.addEventListener("DOMContentLoaded", () => {
  const yearSelect = document.getElementById("yearSelect");
  for (let i = 2025; i <= 2050; i++) {
    yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
  }
  generateMonthOptions();
});

function generateMonthOptions() {
  const monthSelect = document.getElementById("monthSelect");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  monthSelect.innerHTML = "";
  months.forEach((month, i) => {
    monthSelect.innerHTML += `<option value="${i}">${month}</option>`;
  });
  generateTable();
}

function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

function getSundays(year, month) {
  const sundays = [];
  const days = getDaysInMonth(month, year);
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    if (date.getDay() === 0) sundays.push(d);
  }
  return sundays;
}

function generateTable() {
  const year = parseInt(document.getElementById("yearSelect").value);
  const month = parseInt(document.getElementById("monthSelect").value);
  const days = getDaysInMonth(month, year);
  const sundays = getSundays(year, month);
  const dateRow = document.getElementById("dateRow");
  const tableBody = document.getElementById("tableBody");
  dateRow.innerHTML = "";
  tableBody.innerHTML = "";

  for (let d = 1; d <= days; d++) {
    const isSunday = sundays.includes(d);
    dateRow.innerHTML += `<th class="${isSunday ? 'sunday-label' : ''}">${d}${isSunday ? "<br><small>Sunday</small>" : ""}</th>`;
  }

  for (let i = 0; i < 5; i++) {
    addEmployeeRow();
  }
}

function addEmployeeRow() {
  const year = parseInt(document.getElementById("yearSelect").value);
  const month = parseInt(document.getElementById("monthSelect").value);
  const days = getDaysInMonth(month, year);
  const sundays = getSundays(year, month);
  const tableBody = document.getElementById("tableBody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td contenteditable="true">Employee</td>
    <td contenteditable="true">Designation</td>
    <td><input type="number" class="form-control form-control-sm fullSalary" /></td>
    <td class="presentCount">0</td>
    <td class="absentCount">0</td>
    <td class="halfCount">0</td>
    <td class="adjustedSalary">0</td>
  `;

  for (let d = 1; d <= days; d++) {
    const isSunday = sundays.includes(d);
    row.innerHTML += `
      <td>
        <div class="att-box ${isSunday ? 'sunday' : ''}" onclick="toggleStatus(this)"></div>
      </td>`;
  }

  row.innerHTML += `
    <td style="min-width: 250px;">
      <button class="btn btn-sm btn-success me-1" onclick="markRow(this, 'present')">All ✔</button>
      <button class="btn btn-sm btn-danger me-1" onclick="markRow(this, 'absent')">All ✖</button>
      <button class="btn btn-sm btn-outline-danger" onclick="this.closest('tr').remove()">🗑️</button>
    </td>`;

  tableBody.appendChild(row);
}

function toggleStatus(box) {
  if (box.classList.contains('present')) {
    box.classList.remove('present');
    box.classList.add('absent');
    box.innerHTML = '✖';
  } else if (box.classList.contains('absent')) {
    box.classList.remove('absent');
    box.classList.add('half');
    box.innerHTML = '½';
  } else if (box.classList.contains('half')) {
    box.classList.remove('half');
    box.innerHTML = '';
  } else {
    box.classList.add('present');
    box.innerHTML = '✔';
  }
}

function markRow(button, status) {
  const boxes = button.closest("tr").querySelectorAll(".att-box:not(.sunday)");
  boxes.forEach(box => {
    box.className = "att-box";
    if (status === "present") {
      box.classList.add("present");
      box.innerHTML = "✔";
    } else if (status === "absent") {
      box.classList.add("absent");
      box.innerHTML = "✖";
    }
  });
}

function calculateSalary() {
  const rows = document.querySelector('#salaryTable tbody').rows;
  for (let row of rows) {
    const fullSalaryInput = row.querySelector('.fullSalary');
    const fullSalary = parseFloat(fullSalaryInput?.value) || 0;
    const boxes = row.querySelectorAll('.att-box');
    let present = 0, absent = 0, half = 0;

    boxes.forEach(box => {
      if (box.classList.contains('present')) present++;
      else if (box.classList.contains('absent')) absent++;
      else if (box.classList.contains('half')) half++;
    });

    const adjusted = ((fullSalary / boxes.length) * (present + half * 0.5)).toFixed(2);

    row.querySelector('.presentCount').textContent = present;
    row.querySelector('.absentCount').textContent = absent;
    row.querySelector('.halfCount').textContent = half;
    row.querySelector('.adjustedSalary').textContent = adjusted;
  }
}

function downloadExcel() {
  calculateSalary();
  const table = document.getElementById('salaryTable');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, "SalarySheet");
  XLSX.writeFile(wb, "Salary_Sheet.xlsx");
}

function downloadPDF() {
  calculateSalary();
  html2canvas(document.getElementById("salaryTable")).then(canvas => {
    const img = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF('l', 'mm', 'a3');
    const width = pdf.internal.pageSize.getWidth();
    const height = canvas.height * width / canvas.width;
    pdf.addImage(img, 'PNG', 10, 10, width - 20, height);
    pdf.save("Salary_Sheet.pdf");
  });
}

function downloadWord() {
  calculateSalary();
  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'></head><body>
    ${document.getElementById("salaryTable").outerHTML}
    </body></html>`;
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Salary_Sheet.doc";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
