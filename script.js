/*
 * =========================================================
 * Project: 마감 체크리스트
 * File: checklist.js
 * Author: 김용욱
 * Created: 2025-09-12
 * Last Modified: 2025-09-12
 * 
 * Copyright (c) 2025 김용욱
 * All Rights Reserved.
 * 
 * License: MIT License
 * 
 * Description:
 * 체크박스 상태 저장, 강조 표시, 섹션 전환,
 * 이미지 저장, textarea 자동 높이 등 기능 구현
 * =========================================================
 */
// ===============================
// 체크박스 상태 저장용
// ===============================
const STORAGE_KEY = 'checklist_state';

function getAllCheckboxes() {
  return document.querySelectorAll('input[type=checkbox]');
}

// 오늘 날짜 표시
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  
  const formattedDate = `${year}-${month}-${day}`;

  // 오늘자 마감 체크 제목에 날짜 넣기
  const todayHeader = document.getElementById("todayHeader");
  if (todayHeader) {
    todayHeader.textContent = `오늘자 마감 체크 (${formattedDate})`;
  }
});


// ===============================
// 상태 저장
// ===============================
function saveState() {
  const checkboxes = getAllCheckboxes();
  const state = Array.from(checkboxes).map(cb => cb.checked);

  // 이유 textarea 저장
  const reasons = Array.from(document.querySelectorAll('.reason-container textarea'))
                       .map(t => t.value);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, reasons }));
}


// 상태 불러오기
function loadState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const state = saved.state || [];
  const reasons = saved.reasons || [];

  const checkboxes = getAllCheckboxes();
  checkboxes.forEach((cb, i) => {
    cb.checked = state[i] || false;
    updateGroupHighlight(cb);
  });

  // 이유 textarea 복원
  const textareas = document.querySelectorAll('.reason-container textarea');
  textareas.forEach((ta, i) => {
    if (reasons[i]) ta.value = reasons[i];
  });

  // 미체크 항목 리스트 복원 (체크 상태 기반으로 다시 계산)
  sections.forEach((section, idx) => {
    const reasonDiv = section.querySelector('.reason-container');
    const uncheckedDiv = reasonDiv.querySelector('.unchecked-items');
    const checkboxes = section.querySelectorAll('input[type=checkbox]');

    const uncheckedItems = Array.from(checkboxes)
      .filter(cb => !cb.checked && !cb.disabled)
      .map(cb => {
        let textTd = cb.closest('td').previousElementSibling;
        if (!textTd || textTd.tagName !== 'TD') {
          textTd = cb.closest('tr').querySelector('.item-text');
        }
        return textTd ? textTd.innerText.trim() : '항목 없음';
      });

    if (uncheckedItems.length > 0) {
      reasonDiv.style.display = 'block';
      uncheckedDiv.innerHTML = `<strong>체크되지 않은 항목:</strong><br>${uncheckedItems.join('<br>')}`;
    } else {
      reasonDiv.style.display = 'none';
      uncheckedDiv.innerHTML = '';
    }
  });
}
// ===============================

function restorePairs() {
  // mop / wetwipe
  restorePair('mop', 'wetwipe', 'mopText', 'wetwipeText');
  // vacuum / roller
  restorePair('vacuum', 'roller', 'vacuumText', 'rollerText');
  // toiletWater / toiletBleach
  restorePair('toiletWater', 'toiletBleach', 'toiletWaterText', 'toiletBleachText');
}

function recalcUncheckedItems() {
  sections.forEach((section, idx) => {
    const reasonDiv = section.querySelector('.reason-container');
    const uncheckedDiv = reasonDiv.querySelector('.unchecked-items');
    const checkboxes = section.querySelectorAll('input[type=checkbox]');

    const uncheckedItems = Array.from(checkboxes)
      .filter(cb => !cb.checked && !cb.disabled)  // disabled 적용 후 계산
      .map(cb => {
        let textTd = cb.closest('td').previousElementSibling;
        if (!textTd || textTd.tagName !== 'TD') {
          textTd = cb.closest('tr').querySelector('.item-text');
        }
        return textTd ? textTd.innerText.trim() : '항목 없음';
      });

    if (uncheckedItems.length > 0) {
      reasonDiv.style.display = 'block';
      uncheckedDiv.innerHTML = `<strong>체크되지 않은 항목:</strong><br>${uncheckedItems.join('<br>')}`;
    } else {
      reasonDiv.style.display = 'none';
      uncheckedDiv.innerHTML = '';
    }
  });
}


function restorePair(firstId, secondId, firstTextId, secondTextId) {
  const first = document.getElementById(firstId);
  const second = document.getElementById(secondId);
  const firstText = document.getElementById(firstTextId);
  const secondText = document.getElementById(secondTextId);

  if (first.checked) {
    second.disabled = true;
    secondText.classList.add('disabled-text');
  } else if (second.checked) {
    first.disabled = true;
    firstText.classList.add('disabled-text');
  }
}


// ===============================
// 초기화
// ===============================
document.getElementById('resetAll').addEventListener('click', () => {
  if (!confirm('모든 체크를 초기화하시겠습니까?')) return;

  // 체크박스 초기화
  getAllCheckboxes().forEach(cb => {
    cb.checked = false;
    cb.disabled = false; // disabled 풀기
  });

  // 그룹 하이라이트 초기화
  getAllCheckboxes().forEach(updateGroupHighlight);

  // 사유 영역 초기화
  document.querySelectorAll('.reason-container').forEach(reasonDiv => {
    reasonDiv.style.display = 'none'; // 숨김
    const textarea = reasonDiv.querySelector('textarea');
    if (textarea) textarea.value = ''; // 텍스트 지우기
    const uncheckedDiv = reasonDiv.querySelector('.unchecked-items');
    if (uncheckedDiv) uncheckedDiv.innerHTML = ''; // 미체크 항목 삭제
  });

  // 저장 초기화
  localStorage.removeItem(STORAGE_KEY);

  // 첫 섹션으로 이동
  currentIndex = 0;
  showSection(currentIndex);
  updateNavButtons();
});

// ===============================
// 그룹별 체크 강조
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
// 체크박스 클릭 시 배경 강조 + 상태 저장
// ===============================
getAllCheckboxes().forEach(cb => {
  cb.addEventListener('change', () => {
    updateGroupHighlight(cb); // 배경 강조 적용
    saveState();              // 상태 저장
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
// 둘 중 선택 (물걸래/물티슈, 청소기/돌돌이, 화장실 물청소/락스청소)
// ===============================
function togglePair(firstId, secondId, firstTextId, secondTextId) {
    const first = document.getElementById(firstId);
    const second = document.getElementById(secondId);
    const firstText = document.getElementById(firstTextId);
    const secondText = document.getElementById(secondTextId);

    first.addEventListener('change', () => {
        if(first.checked) {
            second.checked = false;
            second.disabled = true;
            secondText.classList.add('disabled-text'); // 흐리게
        } else {
            second.disabled = false;
            secondText.classList.remove('disabled-text');
        }
    });

    second.addEventListener('change', () => {
        if(second.checked) {
            first.checked = false;
            first.disabled = true;
            firstText.classList.add('disabled-text');
        } else {
            first.disabled = false;
            firstText.classList.remove('disabled-text');
        }
    });
}

// 적용
togglePair('mop', 'wetwipe', 'mopText', 'wetwipeText');
togglePair('vacuum', 'roller', 'vacuumText', 'rollerText');
togglePair('toiletWater', 'toiletBleach', 'toiletWaterText', 'toiletBleachText');


// ===============================
// 완료 저장 (이미지)
// ===============================
document.querySelectorAll('.saveImageBtn, .saveImageBtn2, .saveImageBtn3, .saveImageBtn4, .saveImageBtn5').forEach(button => {
  button.addEventListener('click', () => {
    const area = document.getElementById('captureArea');
    const notes = document.getElementById('specialNotes');
    let tempNotesDiv = null;

    if (notes) {
      tempNotesDiv = document.createElement('div');
      const rect = notes.getBoundingClientRect();
      const notesStyle = window.getComputedStyle(notes);

      tempNotesDiv.style.position = 'absolute';
      tempNotesDiv.style.top = rect.top + window.scrollY + 'px';
      tempNotesDiv.style.left = rect.left + window.scrollX + 'px';
      tempNotesDiv.style.width = rect.width + 'px';
      tempNotesDiv.style.height = rect.height + 'px';
      tempNotesDiv.style.padding = notesStyle.padding;
      tempNotesDiv.style.border = notesStyle.border;
      tempNotesDiv.style.background = notesStyle.backgroundColor;
      tempNotesDiv.style.font = notesStyle.font;
      tempNotesDiv.style.whiteSpace = 'pre-wrap';
      tempNotesDiv.innerText = notes.value;

      notes.style.opacity = '0';
      notes.parentElement.appendChild(tempNotesDiv);
    }

    html2canvas(area, { scale: window.devicePixelRatio || 2, backgroundColor: '#fff', scrollY: -window.scrollY, scrollX: -window.scrollX }).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `마감체크리스트_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (tempNotesDiv) tempNotesDiv.remove();
      if (notes) notes.style.opacity = '1';

      // 완료 저장 후 체크박스 초기화
      const currentSection = sections[currentIndex];
      currentSection.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
        updateGroupHighlight(cb);
      });

      // 이유 textarea 초기화
      const reasonDiv = currentSection.querySelector('.reason-container');
      if(reasonDiv) {
        reasonDiv.style.display = 'none';
        const textarea = reasonDiv.querySelector('textarea');
        if(textarea) textarea.value = '';
        const uncheckedDiv = reasonDiv.querySelector('.unchecked-items');
        if(uncheckedDiv) uncheckedDiv.innerHTML = '';
      }

      saveState();

      // 완료 저장 후 다음 섹션으로 이동
      if (currentIndex < sections.length - 1) {
        currentIndex++;
        showSection(currentIndex);
        updateNavButtons();
      }

    }).catch(err => {
      alert('이미지 생성 중 오류가 발생했습니다.');
      console.error(err);
      if(tempNotesDiv) tempNotesDiv.remove();
      if(notes) notes.style.opacity = '1';
    });
  });
});

// ===============================
// 로드 시 상태 복원
// ===============================
window.addEventListener('load', () => {
  loadState();     // 체크 상태 복원
  restorePairs();  // 페어 상태 복원 → disabled 적용
  recalcUncheckedItems(); // 체크되지 않은 항목 다시 계산
});


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


// ===============================
// 이전 다음 버튼
// ===============================
document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    showSection(currentIndex);
    updateNavButtons();
  }
});

sections.forEach(section => {
  const reasonDiv = document.createElement('div');
  reasonDiv.classList.add('reason-container');
  reasonDiv.style.display = 'none';
  reasonDiv.style.marginTop = '8px';
  reasonDiv.innerHTML = `
    <label style="font-weight:600;">체크할 수 없는 이유:</label>
    <textarea rows="2" style="width:100%; margin-top:4px;"></textarea>
    <div class="unchecked-items" style="margin-top:6px; color:#d00; font-size:14px;"></div>
  `;
  section.appendChild(reasonDiv);
});

document.getElementById('nextBtn').addEventListener('click', () => {
  const currentSection = sections[currentIndex];
  const checkboxes = currentSection.querySelectorAll('input[type=checkbox]');
  const reasonDiv = currentSection.querySelector('.reason-container');
  const reasonTextarea = reasonDiv.querySelector('textarea');
  const uncheckedDiv = reasonDiv.querySelector('.unchecked-items');

  const uncheckedItems = Array.from(checkboxes)
    .filter(cb => !cb.checked && !cb.disabled)
    .map(cb => {
      // 체크박스 바로 왼쪽 check-text td 가져오기
      let textTd = cb.closest('td').previousElementSibling;
      // 만약 없으면 item-text td를 찾거나 기본 텍스트 반환
      if (!textTd || textTd.tagName !== 'TD') {
        textTd = cb.closest('tr').querySelector('.item-text');
      }
      return textTd ? textTd.innerText.trim() : '항목 없음';
    });

  const allChecked = uncheckedItems.length === 0;

  if (!allChecked) {
    reasonDiv.style.display = 'block';
    uncheckedDiv.innerHTML = `<strong>체크되지 않은 항목:</strong><br>${uncheckedItems.join('<br>')}`;

    if (reasonTextarea.value.trim().length < 1) {
      alert('체크할 수 없는 경우, 이유를 작성해야 다음으로 넘어갈 수 있습니다.');
      reasonTextarea.focus();
      return;
    }
  } else {
    reasonDiv.style.display = 'none';
    uncheckedDiv.innerHTML = '';
  }

  if (currentIndex < sections.length - 1) {
    currentIndex++;
    showSection(currentIndex);
    updateNavButtons();
  }
});




// 버튼 표시/숨김 상태 업데이트
function updateNavButtons() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  prevBtn.style.display = currentIndex === 0 ? 'none' : 'inline-block';
  nextBtn.style.display = currentIndex === sections.length - 1 ? 'none' : 'inline-block';
}

// 초기 표시
showSection(currentIndex);
updateNavButtons();

