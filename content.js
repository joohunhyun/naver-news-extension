// 내 뉴스 바구니 - Naver News Chrome Extension Content Script
const SIDEBAR_ID = "naver-news-cart-sidebar";
const STORAGE_KEY = "naverNewsCartItems";

// Sidebar HTML
console.log("Content script loaded");

const sidebar = document.createElement("div");
sidebar.id = SIDEBAR_ID;

// Strong override of stacking with high z-index and fixed position
sidebar.style.position = "fixed";
sidebar.style.left = "0px";
sidebar.style.top = "10rem";
sidebar.style.width = "220px";
sidebar.style.maxHeight = "80vh";
sidebar.style.background = "rgba(255,255,255,0.75)";
sidebar.style.border = "1px solid #e5e7eb";
sidebar.style.borderRadius = "0.5rem";
sidebar.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
sidebar.style.zIndex = "2147483647"; // MAXIMUM
sidebar.style.display = "flex";
sidebar.style.flexDirection = "column";
sidebar.style.overflow = "hidden";
sidebar.style.transition = "box-shadow 0.2s ease";

// Optionally add a CSS class name for Tailwind-based environments
sidebar.className = "tw-sidebar-fix naver-news-cart-sidebar"; // Use this to target in global CSS if needed

sidebar.innerHTML = `
  <div class="flex items-center justify-between px-4 py-3">
    <span class="font-bold text-xl">🛒 나의 뉴스 바구니</span>
    <button id="clear-cart-btn" class="text-gray-400 hover:text-red-500 text-xl" title="모두 비우기">🗑️</button>
  </div>
  <hr class="naver-news-cart-divider" />
  <ul id="cart-list" class="flex-1 overflow-y-auto px-4 py-2 space-y-2"></ul>
  <div class="cart-empty-msg px-4 py-2 text-xs text-gray-400 border-t border-gray-100">뉴스 제목을 드래그해서 바구니에 담으세요.</div>
  <div id="cart-popup" class="hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow text-sm z-50">이미 담았습니다</div>
`;

document.body.appendChild(sidebar);

// Popup for duplicate
function showPopup(msg) {
  const popup = document.getElementById("cart-popup");
  popup.textContent = msg;
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("hidden"), 1200);
}

// Load from storage
function loadCart() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const items = result[STORAGE_KEY] || [];
    renderCart(items);
  });
}

// Save to storage
function saveCart(items) {
  chrome.storage.local.set({ [STORAGE_KEY]: items });
}

// Render cart list
function renderCart(items) {
  const list = document.getElementById("cart-list");
  list.innerHTML = "";
  // Hide or show the empty message
  const emptyMsg = sidebar.querySelector(".cart-empty-msg");
  if (items.length === 0) {
    emptyMsg.style.display = "";
  } else {
    emptyMsg.style.display = "none";
  }
  // Split into unread/read
  const unread = items.filter((item) => !item.read);
  const read = items.filter((item) => item.read);

  // Unread section
  if (unread.length > 0) {
    const unreadHeaderWrap = document.createElement("div");
    unreadHeaderWrap.className = "flex items-center justify-between";
    const unreadHeader = document.createElement("div");
    unreadHeader.textContent = "읽지 않음";
    unreadHeader.className = "text-xs font-bold text-gray-600 mb-1 mt-2";
    unreadHeaderWrap.appendChild(unreadHeader);
    // 모두 읽기 button
    const markAllReadBtn = document.createElement("button");
    markAllReadBtn.textContent = "모두 읽기";
    markAllReadBtn.className = "cart-mark-all-read-btn";
    markAllReadBtn.style.marginLeft = "8px";
    markAllReadBtn.addEventListener("click", () => {
      // Open all unread links in new tabs
      unread.forEach((item) => {
        window.open(item.url, "_blank");
      });
      // Mark all as read
      items.forEach((item) => {
        if (!item.read) item.read = true;
      });
      saveCart(items);
      renderCart(items);
    });
    unreadHeaderWrap.appendChild(markAllReadBtn);
    list.appendChild(unreadHeaderWrap);
    unread.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 group";
      li.innerHTML = `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="truncate max-w-[200px] text-blue-600 hover:underline">${item.title}</a>
        <button class="ml-2 text-gray-400 hover:text-red-500 text-base hidden group-hover:inline" title="삭제">❌</button>
      `;
      // Remove button
      li.querySelector("button").addEventListener("click", (e) => {
        const idxInAll = items.findIndex((i) => i.url === item.url);
        items.splice(idxInAll, 1);
        saveCart(items);
        renderCart(items);
      });
      // Mark as read on click
      li.querySelector("a").addEventListener("click", () => {
        const idxInAll = items.findIndex((i) => i.url === item.url);
        if (idxInAll !== -1) {
          items[idxInAll].read = true;
          saveCart(items);
          setTimeout(() => renderCart(items), 100); // allow navigation
        }
      });
      list.appendChild(li);
    });
  }
  // Read section
  if (read.length > 0) {
    const readHeader = document.createElement("div");
    readHeader.textContent = "읽음";
    readHeader.className = "text-xs font-bold text-gray-600 mb-1 mt-4";
    list.appendChild(readHeader);
    read.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 group opacity-60";
      li.innerHTML = `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="truncate max-w-[200px] text-blue-600 hover:underline">${item.title}</a>
        <button class="ml-2 text-gray-400 hover:text-red-500 text-base hidden group-hover:inline" title="삭제">❌</button>
      `;
      // Remove button
      li.querySelector("button").addEventListener("click", (e) => {
        const idxInAll = items.findIndex((i) => i.url === item.url);
        items.splice(idxInAll, 1);
        saveCart(items);
        renderCart(items);
      });
      list.appendChild(li);
    });
  }
}

// Clear all
sidebar.querySelector("#clear-cart-btn").addEventListener("click", () => {
  chrome.storage.local.set({ [STORAGE_KEY]: [] }, loadCart);
});

// Drag-and-drop logic
function setupDraggables() {
  // 1. strong.cnf_news_title and their parent anchors
  const strongs = document.querySelectorAll("strong.cnf_news_title");
  strongs.forEach((strong) => {
    const a = strong.closest("a");
    if (!a) return;
    a.setAttribute("draggable", "true");
    a.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          title: strong.innerText.trim(),
          url: a.href,
        })
      );
      a.classList.add("ring-2", "ring-blue-400");
    });
    a.addEventListener("dragend", () => {
      a.classList.remove("ring-2", "ring-blue-400");
    });
  });
  // 2. a.cnf_news elements directly
  const anchors = document.querySelectorAll("a.cnf_news");
  anchors.forEach((a) => {
    a.setAttribute("draggable", "true");
    a.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          title: a.innerText.trim(),
          url: a.href,
        })
      );
      a.classList.add("ring-2", "ring-blue-400");
    });
    a.addEventListener("dragend", () => {
      a.classList.remove("ring-2", "ring-blue-400");
    });
  });
  // 3. a.cc_link_channel elements (media/press links)
  const channelLinks = document.querySelectorAll("a.cc_link_channel");
  channelLinks.forEach((a) => {
    a.setAttribute("draggable", "true");
    a.addEventListener("dragstart", (e) => {
      // Prefer the text from .cc_channel_t if present
      const t = a.querySelector(".cc_channel_t");
      const title = t ? t.innerText.trim() : a.innerText.trim();
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          title: title,
          url: a.href,
        })
      );
      a.classList.add("ring-2", "ring-blue-400");
    });
    a.addEventListener("dragend", () => {
      a.classList.remove("ring-2", "ring-blue-400");
    });
  });
  // 4. a.cc_link_clip elements (video/news clip links)
  const clipLinks = document.querySelectorAll("a.cc_link_clip");
  clipLinks.forEach((a) => {
    a.setAttribute("draggable", "true");
    a.addEventListener("dragstart", (e) => {
      // Prefer the text from .cc_clip_t if present
      const t = a.querySelector(".cc_clip_t");
      const title = t ? t.innerText.trim() : a.innerText.trim();
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          title: title,
          url: a.href,
        })
      );
      a.classList.add("ring-2", "ring-blue-400");
    });
    a.addEventListener("dragend", () => {
      a.classList.remove("ring-2", "ring-blue-400");
    });
  });
  // 5. a.sa_text_title elements (mobile/news links)
  const saLinks = document.querySelectorAll("a.sa_text_title");
  saLinks.forEach((a) => {
    a.setAttribute("draggable", "true");
    a.addEventListener("dragstart", (e) => {
      // Prefer the text from .sa_text_strong if present
      const t = a.querySelector(".sa_text_strong");
      const title = t ? t.innerText.trim() : a.innerText.trim();
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          title: title,
          url: a.href,
        })
      );
      a.classList.add("ring-2", "ring-blue-400");
    });
    a.addEventListener("dragend", () => {
      a.classList.remove("ring-2", "ring-blue-400");
    });
  });
}

// Sidebar drop events
sidebar.addEventListener("dragover", (e) => {
  e.preventDefault();
  sidebar.classList.add("ring-2", "ring-blue-400");
});
sidebar.addEventListener("dragleave", (e) => {
  sidebar.classList.remove("ring-2", "ring-blue-400");
});
// Update drop logic to add as unread
sidebar.addEventListener("drop", (e) => {
  e.preventDefault();
  sidebar.classList.remove("ring-2", "ring-blue-400");
  let data;
  try {
    data = JSON.parse(e.dataTransfer.getData("text/plain"));
  } catch {
    return;
  }
  if (!data || !data.title || !data.url) return;
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const items = result[STORAGE_KEY] || [];
    if (items.some((item) => item.url === data.url)) {
      showPopup("이미 담았습니다");
      return;
    }
    items.push({ title: data.title, url: data.url, read: false });
    saveCart(items);
    renderCart(items);
  });
});

// Make sidebar movable by dragging the header
const header = sidebar.querySelector("div.flex.items-center.justify-between");
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

header.style.cursor = "move";

header.addEventListener("mousedown", (e) => {
  isDragging = true;
  // Calculate offset between mouse and sidebar top-left
  const rect = sidebar.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  // Set to absolute so it can move freely
  sidebar.style.position = "absolute";
  sidebar.style.zIndex = "2147483647";
  document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  // Calculate new position
  let newLeft = e.clientX - dragOffsetX;
  let newTop = e.clientY - dragOffsetY;
  // Clamp to viewport
  newLeft = Math.max(
    0,
    Math.min(window.innerWidth - sidebar.offsetWidth, newLeft)
  );
  newTop = Math.max(
    0,
    Math.min(window.innerHeight - sidebar.offsetHeight, newTop)
  );
  sidebar.style.left = newLeft + "px";
  sidebar.style.top = newTop + "px";
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = "";
  }
});

// Add a resize handle to the bottom-right corner
const resizeHandle = document.createElement("div");
resizeHandle.style.position = "absolute";
resizeHandle.style.right = "0";
resizeHandle.style.bottom = "0";
resizeHandle.style.width = "18px";
resizeHandle.style.height = "18px";
resizeHandle.style.cursor = "nwse-resize";
resizeHandle.style.background = "transparent";
resizeHandle.style.zIndex = "2147483648";
resizeHandle.innerHTML =
  '<svg width="18" height="18"><polyline points="3,15 15,15 15,3" style="fill:none;stroke:#bbb;stroke-width:2" /></svg>';
sidebar.appendChild(resizeHandle);

let isResizing = false;
let startWidth, startHeight, startX, startY;

resizeHandle.addEventListener("mousedown", (e) => {
  e.preventDefault();
  isResizing = true;
  startWidth = sidebar.offsetWidth;
  startHeight = sidebar.offsetHeight;
  startX = e.clientX;
  startY = e.clientY;
  document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
  if (isResizing) {
    let newWidth = startWidth + (e.clientX - startX);
    let newHeight = startHeight + (e.clientY - startY);
    // Clamp to min/max
    newWidth = Math.max(
      180,
      Math.min(window.innerWidth - sidebar.offsetLeft, newWidth)
    );
    newHeight = Math.max(
      120,
      Math.min(window.innerHeight - sidebar.offsetTop, newHeight)
    );
    sidebar.style.width = newWidth + "px";
    sidebar.style.height = newHeight + "px";
  }
});

document.addEventListener("mouseup", () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.userSelect = "";
  }
});

// Observe DOM for new articles (SPA, infinite scroll)
const observer = new MutationObserver(() => {
  setupDraggables();
});
observer.observe(document.body, { childList: true, subtree: true });
setupDraggables();
loadCart();
