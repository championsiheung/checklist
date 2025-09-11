// ===============================
// 체크박스 상태 저장용
// ===============================
const STORAGE_KEY = 'checklist_state';

function getAllCheckboxes() {
  return document.querySelectorAll('#checklist input[type=checkbox], #kitchen input[type=checkbox]');
}

// ===============================
// 상태 저장
// ===============================
function saveState() {
  const state = Array.from(getAllCheckboxes()).map(cb => cb.checked);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// 상태 불러오기
function loadState() {
  const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const checkboxes = getAllCheckboxes();
  checkboxes.forEach((cb, i) => {
    cb.checked = state[i] || false;
    updateGroupHighlight(cb); // 로드 시 강조 적용
  });
}

// ===============================
// 전체 완료 / 초기화
// ===============================
document.getElementById('checkAll').addEventListener('click', () => {
  getAllCheckboxes().forEach(cb => cb.checked = true);
  getAllCheckboxes().forEach(updateGroupHighlight);
  saveState();
});

document.getElementById('resetAll').addEventListener('click', () => {
  if(!confirm('모든 체크를 초기화하시겠습니까?')) return;
  getAllCheckboxes().forEach(cb => cb.checked = false);
  getAllCheckboxes().forEach(updateGroupHighlight);
  saveState();
});

// ===============================
// 그룹별 체크 + 배경 강조
// ===============================
function updateGroupHighlight(checkbox) {
  const row = checkbox.closest('tr');

  // rowspan 그룹 처리
  let categoryCell = row.querySelector('.category') || findPrevious(row, '.category');
  let itemCell = row.querySelector('.item-text') || findPrevious(row, '.item-text');

  const checked = checkbox.checked;
}

// 이전 행에서 클래스 탐색 (rowspan 처리용)
function findPrevious(row, selector) {
  let prev = row.previousElementSibling;
  while(prev) {
    const cell = prev.querySelector(selector);
    if(cell) return cell;
    prev = prev.previousElementSibling;
  }
  return null;
}

// ===============================
// 체크박스 클릭 시 그룹 전체 체크
// ===============================
getAllCheckboxes().forEach(cb => {
  cb.addEventListener('change', () => {
    const row = cb.closest('tr');
    const checked = cb.checked;

    // 그룹 내 모든 체크박스 찾기 (같은 item-text 그룹)
    let groupRows = [row];
    let next = row.nextElementSibling;
    while(next && (!next.querySelector('.item-text') || next.querySelector('.item-text').rowSpan > 1)) {
      groupRows.push(next);
      next = next.nextElementSibling;
    }

    groupRows.forEach(r => {
      const boxes = r.querySelectorAll('input[type=checkbox]');
      boxes.forEach(b => b.checked = checked);
      boxes.forEach(updateGroupHighlight);
    });

    saveState();
  });
});

// ===============================
// 체크박스와 체크리스트 td hover
// ===============================
document.querySelectorAll('input[type=checkbox]').forEach(cb => {
  const tdCheckbox = cb.closest('td');            // 체크박스 td
  const tdCheckText = tdCheckbox.previousElementSibling; // 바로 왼쪽 체크리스트 td

  if(!tdCheckText || !tdCheckText.classList.contains('check-text')) return;

  // 체크박스 또는 체크리스트 hover 시 두 칸 모두 강조
  const hoverOn = () => {
    tdCheckText.style.background = 'var(--row-hover)';
    tdCheckbox.style.background = 'var(--row-hover)';
  };
  const hoverOff = () => {
    tdCheckText.style.background = '';
    tdCheckbox.style.background = '';
  };

  cb.addEventListener('mouseenter', hoverOn);
  cb.addEventListener('mouseleave', hoverOff);
  tdCheckText.addEventListener('mouseenter', hoverOn);
  tdCheckText.addEventListener('mouseleave', hoverOff);
});



// ===============================
// 완료 저장 (이미지)
// ===============================
document.getElementById('saveImage').addEventListener('click', () => {
  const area = document.getElementById('captureArea');
  const notes = document.getElementById('specialNotes');

  // textarea 줄바꿈을 <br>로 변환해서 임시 div 생성
  const tempNotesDiv = document.createElement('div');
  tempNotesDiv.style.whiteSpace = 'pre-wrap';
  tempNotesDiv.style.font = window.getComputedStyle(notes).font;
  tempNotesDiv.style.width = notes.offsetWidth + 'px';
  tempNotesDiv.style.padding = window.getComputedStyle(notes).padding;
  tempNotesDiv.innerHTML = notes.value;

  // textarea 숨기고 임시 div 삽입
  notes.style.display = 'none';
  notes.parentElement.appendChild(tempNotesDiv);

  html2canvas(area, {scale: 2, backgroundColor: '#fff'}).then(canvas => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `마감체크리스트_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;
    a.click();

    // 캡처 후 원래 textarea 복원
    tempNotesDiv.remove();
    notes.style.display = 'block';
  });
});


// ===============================
// 로드 시 상태 복원
// ===============================
window.addEventListener('load', loadState);

// ===============================
/* 자동 높이 조절 JS */
// ===============================
const notesDiv = document.getElementById('specialNotes');
notesDiv.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
});

// ===============================
/* 자동 높이 조절 JS */
// ===============================
const sections = document.querySelectorAll('.section');
let currentIndex = 0;

function showSection(index) {
  sections.forEach((sec, i) => {
    sec.classList.toggle('active', i === index);
  });
}

document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    showSection(currentIndex);
  }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentIndex < sections.length - 1) {
    currentIndex++;
    showSection(currentIndex);
  }
});

// 초기 표시
showSection(currentIndex);
