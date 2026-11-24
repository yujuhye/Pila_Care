// 본문 내 **볼드** 및 [[큰글씨]] 서식 자동 변환 함수
function formatRichText(text) {
    if (!text) return "";
    return text
        .replace(/\[\[(.*?)\]\]/g, '<span class="text-[16px] font-black text-[#182b49] inline-block mt-1">$1</span>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-[#182b49]">$1</strong>');
}

const defaultCaseMeta = [
    { key: 'case1', name: '어깨충돌증후군', engName: 'Shoulder Impingement', icon: '💪', tags: ['회전근개', '어깨세모근', '어깨 통증'] },
    { key: 'case2', name: '후천성 사경', engName: 'Acquired Torticollis', icon: '💆‍♂️', tags: ['목빗근', '위등세모근', '어깨올림근'] },
    { key: 'case3', name: '호흡 / 코어', engName: 'Breathing & Core', icon: '🫁', tags: ['가로막', '배가로근', '복압 안정화'] },
    { key: 'case4', name: '익상견갑', engName: 'Winging Scapula', icon: '🦴', tags: ['앞톱니근', '아래등세모근', '날개뼈 안정화'] },
    { key: 'case5', name: '거북목', engName: 'Forward Head Posture', icon: '🦒', tags: ['뒤통수밑근', '깊은목굽힘근', '아래등세모근'] }
];

let currentCaseKey = 'case1';
let timerInterval;
let currentTargetSeconds = 15;

function getMergedCases() {
    return defaultCaseMeta.map(meta => {
        const loaded = allCases[meta.key] || {};
        return {
            ...meta,
            ...loaded,
            title: loaded.title || `${meta.name} 맞춤 스트레칭`,
            exercises: loaded.exercises || []
        };
    });
}

function getCaseImageSrc(item) {
    if (item.cardImage && item.cardImage.trim() !== "") return item.cardImage.trim();
    if (item.icon && (item.icon.includes('/') || item.icon.includes('.'))) return item.icon.trim();
    return null;
}

function initApp() {
    const merged = getMergedCases();

    // 1) 홈 화면 5개 카드 렌더링
    const homeGrid = document.getElementById('home-case-grid');
    homeGrid.innerHTML = '';
    merged.forEach(item => {
        const card = document.createElement('button');
        card.onclick = () => openCaseFromHome(item.key);
        card.className = "group text-left bg-white hover:bg-[#f4fbfb] border border-slate-200/90 hover:border-teal-400 rounded-3xl p-4 transition shadow-sm hover:shadow-md flex flex-col justify-between";

        const imgSrc = getCaseImageSrc(item);
        const thumbHtml = imgSrc
            ? `<img src="${imgSrc}" alt="${item.name}" class="w-full h-full object-contain">`
            : `<span class="text-5xl group-hover:scale-110 transition-transform">${item.icon}</span>`;

        const boxPadding = imgSrc ? "p-0 bg-[#dff4f2]/70" : "p-3 bg-[#dff4f2]/70";

        const tagsHtml = (item.tags || []).map(tag =>
            `<span class="text-[11px] font-bold bg-slate-100 group-hover:bg-white text-slate-600 px-2.5 py-1 rounded-full">${tag}</span>`
        ).join('');

        card.innerHTML = `
            <div>
                <div class="w-full h-40 rounded-2xl ${boxPadding} flex items-center justify-center mb-4 overflow-hidden">
                    ${thumbHtml}
                </div>
                <h4 class="text-lg font-black text-[#182b49] text-center">${item.name}</h4>
                <p class="text-[11px] font-semibold text-teal-700 text-center mt-0.5">${item.engName}</p>
            </div>
            <div class="flex flex-wrap justify-center gap-1.5 mt-4">
                ${tagsHtml}
            </div>
        `;
        homeGrid.appendChild(card);
    });

    // 2) 상세 화면 좌측 사이드바 렌더링
    const menuContainer = document.getElementById('sidebar-menu');
    menuContainer.innerHTML = '';
    merged.forEach(item => {
        const btn = document.createElement('button');
        btn.id = 'btn-' + item.key;
        btn.onclick = () => selectCase(item.key);
        btn.className = "case-btn w-full text-left p-3.5 rounded-2xl flex items-center gap-3.5 transition";

        const imgSrc = getCaseImageSrc(item);
        btn.dataset.hasImg = imgSrc ? "true" : "false";

        const iconHtml = imgSrc
            ? `<img src="${imgSrc}" alt="${item.name}" class="w-full h-full object-cover object-top">`
            : item.icon;

        const iconBoxStyle = imgSrc
            ? "icon-box w-11 h-11 rounded-xl bg-[#f0f9f9] p-0 overflow-hidden flex items-center justify-center shrink-0 border border-teal-100/70"
            : "icon-box w-11 h-11 text-2xl bg-[#f4f8f9] p-2 rounded-xl flex items-center justify-center shrink-0";

        btn.innerHTML = `
            <span class="${iconBoxStyle}">${iconHtml}</span>
            <div class="min-w-0">
                <h3 class="title-text font-extrabold text-sm truncate">${item.name}</h3>
                <p class="desc-text text-xs font-medium truncate">${item.engName}</p>
            </div>
        `;
        menuContainer.appendChild(btn);
    });
}

function stopAllVideos() {
    document.getElementById('case-video').src = "";
    document.getElementById('adv-video').src = "";
    document.querySelectorAll('#imbalance-cards-grid iframe, #cause-images-grid iframe').forEach(el => {
        el.src = "";
    });
}

function showHome() {
    clearInterval(timerInterval);
    stopAllVideos();
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('home-view').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openCaseFromHome(caseKey) {
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('detail-view').classList.remove('hidden');
    selectCase(caseKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selectCase(caseKey) {
    currentCaseKey = caseKey;
    const merged = getMergedCases();
    const caseObj = merged.find(c => c.key === caseKey);
    if (!caseObj) return;

    document.getElementById('case-title').innerText = caseObj.title;
    document.getElementById('case-eng-badge').innerText = caseObj.engName;

    document.querySelectorAll('.case-btn').forEach(btn => {
        const hasImg = btn.dataset.hasImg === "true";
        btn.className = "case-btn w-full text-left bg-white hover:bg-[#f4fbfb] border border-slate-200/80 p-3.5 rounded-2xl flex items-center gap-3.5 transition";
        btn.querySelector('.icon-box').className = hasImg
            ? "icon-box w-11 h-11 rounded-xl bg-[#f0f9f9] p-0 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/60"
            : "icon-box w-11 h-11 text-2xl bg-[#f4f8f9] p-2 rounded-xl flex items-center justify-center shrink-0";
        btn.querySelector('.title-text').className = "title-text font-extrabold text-slate-700 text-sm truncate";
        btn.querySelector('.desc-text').className = "desc-text text-xs text-slate-400 font-medium truncate";
    });
    const activeBtn = document.getElementById('btn-' + caseKey);
    if (activeBtn) {
        const hasImg = activeBtn.dataset.hasImg === "true";
        activeBtn.className = "case-btn w-full text-left bg-[#e6f5f4] border-2 border-teal-600 p-3.5 rounded-2xl flex items-center gap-3.5 transition shadow-sm";
        activeBtn.querySelector('.icon-box').className = hasImg
            ? "icon-box w-11 h-11 rounded-xl bg-[#f0f9f9] p-0 overflow-hidden flex items-center justify-center shrink-0 border border-teal-300"
            : "icon-box w-11 h-11 text-2xl bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-inner";
        activeBtn.querySelector('.title-text').className = "title-text font-extrabold text-[#182b49] text-sm truncate";
        activeBtn.querySelector('.desc-text').className = "desc-text text-xs text-teal-700 font-semibold truncate";
    }

    const tabsContainer = document.getElementById('exercise-tabs');
    tabsContainer.innerHTML = '';

    const anatomyTab = document.createElement('button');
    anatomyTab.id = 'tab-anatomy';
    anatomyTab.innerText = '🧬 해부학 분석';
    anatomyTab.onclick = () => selectAnatomyTab();
    anatomyTab.className = "ex-tab-btn px-4 py-2 rounded-xl text-sm font-bold transition";
    tabsContainer.appendChild(anatomyTab);

    caseObj.exercises.forEach((ex, index) => {
        const tabBtn = document.createElement('button');
        tabBtn.id = 'tab-ex-' + index;
        tabBtn.innerText = `동작 ${index + 1}`;
        tabBtn.onclick = () => selectExercise(index);
        tabBtn.className = "ex-tab-btn px-4 py-2 rounded-xl text-sm font-bold transition";
        tabsContainer.appendChild(tabBtn);
    });

    selectAnatomyTab();
}

function setActiveTabButton(targetId) {
    document.querySelectorAll('.ex-tab-btn').forEach(btn => {
        btn.className = "ex-tab-btn px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-[#f0f9f9] transition";
    });
    const activeTab = document.getElementById(targetId);
    if (activeTab) {
        activeTab.className = "ex-tab-btn px-4 py-2 rounded-xl text-sm font-bold bg-[#1b365d] text-white shadow-sm transition";
    }
}

// 유튜브 재생
function toYoutubeEmbedUrl(url) {
    if (!url) return "";
    let videoId = "";
    try {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be")) {
            videoId = u.pathname.replace("/", "");
        } else if (u.searchParams.get("v")) {
            videoId = u.searchParams.get("v");
        } else if (u.pathname.includes("/embed/")) {
            videoId = u.pathname.split("/embed/")[1].split("?")[0];
        } else if (u.pathname.includes("/shorts/")) {
            videoId = u.pathname.split("/shorts/")[1].split("?")[0];
        }
    } catch (e) {
        return url;
    }

    if (!videoId) return url;
    // 자동재생 + 음소거 + 무한반복 + 하단 재생바 숨김으로 유튜브 UI 최소화
    return `https://www.youtube-nocookie.com/embed/${videoId}?loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1`;
}

function isYoutubeUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    return rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be");
}

function isLocalVideoUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return false;
    return /\.(mp4|webm|ogg)$/i.test(rawUrl.trim());
}

// 유튜브 잡다한 아이콘 안보이게
function getYoutubeThumbUrl(url) {
    const embed = toYoutubeEmbedUrl(url);
    const match = embed.match(/\/embed\/([^?]+)/);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : "";
}

// 한 줄에 최대 설명글 및 세로 구분선을 지원하는 공통 함수
function renderMediaRows(mediaInput, imgMaxHeightClass = "max-h-60", maxPerRow = 3, showDivider = false) {
    let rawList = [];
    if (Array.isArray(mediaInput)) {
        rawList = mediaInput;
    } else if (typeof mediaInput === "string" && mediaInput.trim() !== "") {
        rawList = [mediaInput];
    } else if (mediaInput && typeof mediaInput === "object" && mediaInput.src) {
        rawList = [mediaInput];
    }

    const rows = [];
    let currentRow = [];

    rawList.forEach(entry => {
        if (typeof entry === "string") {
            const trimmed = entry.trim();
            if (trimmed === "") return;
            if (trimmed === "\\n" || entry === "\n") {
                if (currentRow.length > 0) {
                    rows.push(currentRow);
                    currentRow = [];
                }
            } else {
                currentRow.push({ src: trimmed, desc: "" });
                if (currentRow.length === maxPerRow) {
                    rows.push(currentRow);
                    currentRow = [];
                }
            }
        } else if (entry && typeof entry === "object" && entry.src && entry.src.trim() !== "") {
            currentRow.push({
                src: entry.src.trim(),
                desc: (entry.desc || "").trim()
            });
            if (currentRow.length === maxPerRow) {
                rows.push(currentRow);
                currentRow = [];
            }
        }
    });
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    if (rows.length === 0) return { html: "", totalCount: 0 };

    let totalCount = 0;
    const rowsHtml = rows.map(rowItems => {
        totalCount += rowItems.length;

        const dividerClass = (showDivider && rowItems.length >= 2)
            ? "divide-y sm:divide-y-0 sm:divide-x divide-slate-200/90"
            : "";

        let gridClass = "grid grid-cols-1 gap-3";
        if (rowItems.length === 2) {
            gridClass = showDivider
                ? `grid grid-cols-1 sm:grid-cols-2 ${dividerClass}`
                : "grid grid-cols-1 sm:grid-cols-2 gap-3";
        } else if (rowItems.length >= 3) {
            gridClass = showDivider
                ? `grid grid-cols-1 sm:grid-cols-3 ${dividerClass}`
                : "grid grid-cols-1 sm:grid-cols-3 gap-3";
        }

        const itemWrapperClass = (showDivider && rowItems.length >= 2)
            ? "flex flex-col py-4 first:pt-0 last:pb-0 sm:py-1 sm:px-5 sm:first:pl-0 sm:last:pr-0"
            : "flex flex-col";

        const itemsHtml = rowItems.map(item => {
            let mediaHtml = "";

            if (showDivider) {
                // 원인 칸
                if (isYoutubeUrl(item.src)) {
                    const baseEmbed = toYoutubeEmbedUrl(item.src);
                    const connector = baseEmbed.includes('?') ? '&' : '?';
                    const cleanEmbedUrl = `${baseEmbed}${connector}rel=0&modestbranding=1&playsinline=1`;
                    mediaHtml = `
                        <div class="w-full h-64 rounded-2xl overflow-hidden bg-slate-900">
                            <iframe class="w-full h-full" src="${cleanEmbedUrl}" title="참고 영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        </div>`;
                } else if (isLocalVideoUrl(item.src)) {
                    // mp4 파일을 직접 넣으면 자동 반복 재생
                    mediaHtml = `
                        <video src="${item.src}" autoplay loop muted playsinline class="w-full h-64 object-contain rounded-2xl mx-auto"></video>`;
                } else {
                    mediaHtml = `
                        <img src="${item.src}" alt="참고 이미지" class="w-full h-auto max-h-64 object-contain rounded-2xl mx-auto">`;
                }
            } else {
                // 기존 근육/자세 카드용 출력
                if (isYoutubeUrl(item.src)) {
                    const embedUrl = toYoutubeEmbedUrl(item.src);
                    mediaHtml = `
                        <div class="w-full rounded-xl overflow-hidden bg-slate-900 aspect-video border border-slate-200">
                            <iframe class="w-full h-full" src="${embedUrl}" title="참고 영상" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                        </div>`;
                } else if (isLocalVideoUrl(item.src)) {
                    mediaHtml = `
                        <div class="w-full bg-slate-900 rounded-xl border border-slate-200/80 flex items-center justify-center overflow-hidden">
                            <video src="${item.src}" controls muted playsinline class="${imgMaxHeightClass} w-full object-contain"></video>
                        </div>`;
                } else {
                    mediaHtml = `
                        <div class="w-full bg-[#f7fbfb] rounded-xl border border-slate-200/80 flex items-center justify-center overflow-hidden p-2">
                            <img src="${item.src}" alt="참고 이미지" class="${imgMaxHeightClass} w-full object-contain rounded-lg">
                        </div>`;
                }
            }

            const descHtml = item.desc
                ? `<p class="text-sm sm:text-[15px] text-slate-700 font-medium mt-3.5 leading-relaxed whitespace-pre-line break-keep text-center">${formatRichText(item.desc)}</p>`
                : "";

            return `
                <div class="${itemWrapperClass}">
                    ${mediaHtml}
                    ${descHtml}
                </div>`;
        }).join('');

        return `<div class="${gridClass}">${itemsHtml}</div>`;
    }).join('');

    return {
        html: `<div class="flex flex-col gap-4">${rowsHtml}</div>`,
        totalCount
    };
}

function selectAnatomyTab() {
    setActiveTabButton('tab-anatomy');
    clearInterval(timerInterval);
    stopAllVideos();

    document.getElementById('case-title').classList.add('hidden');
    document.getElementById('case-eng-badge').classList.add('hidden');
    document.getElementById('exercise-panel').classList.add('hidden');
    document.getElementById('anatomy-panel').classList.remove('hidden');

    const merged = getMergedCases();
    const caseObj = merged.find(c => c.key === currentCaseKey) || {};
    const anatomy = caseObj.anatomy || {};

    const subtitleEl = document.getElementById('anatomy-subtitle');
    if (anatomy.subtitle && anatomy.subtitle.trim() !== "") {
        subtitleEl.innerHTML = formatRichText(anatomy.subtitle);
        subtitleEl.classList.remove('hidden');
    } else {
        subtitleEl.innerHTML = "";
        subtitleEl.classList.add('hidden');
    }

    // 원인 본문
    document.getElementById('anatomy-cause').innerHTML =
        formatRichText(anatomy.cause || `${caseObj.name}의 해부학적 원인 데이터를 준비 중입니다.`);

    // 원인 사진/영상 + 각 항목 설명글 + 세로 구분선
    const causeGrid = document.getElementById('cause-images-grid');
    const causeMediaResult = renderMediaRows(anatomy.causeImages, "max-h-64", 3, true);
    if (causeMediaResult.totalCount > 0) {
        causeGrid.className = "pt-2";
        causeGrid.innerHTML = causeMediaResult.html;
        causeGrid.classList.remove('hidden');
    } else {
        causeGrid.innerHTML = '';
        causeGrid.classList.add('hidden');
    }

    const imbSummaryEl = document.getElementById('imbalance-summary');
    if (anatomy.imbalanceSummary && anatomy.imbalanceSummary.trim() !== "") {
        imbSummaryEl.innerHTML = formatRichText(anatomy.imbalanceSummary);
        imbSummaryEl.classList.remove('hidden');
    } else {
        imbSummaryEl.innerHTML = "";
        imbSummaryEl.classList.add('hidden');
    }

    const imbalanceGrid = document.getElementById('imbalance-cards-grid');
    imbalanceGrid.innerHTML = '';
    const imbalanceList = anatomy.muscleImbalance || [];

    if (imbalanceList.length > 0) {
        imbalanceList.forEach(item => {
            if (item === "\n" || item === "\\n") {
                const lineBreak = document.createElement('div');
                lineBreak.className = "hidden md:block md:col-span-2 h-0";
                imbalanceGrid.appendChild(lineBreak);
                return;
            }

            const rawType = (item.type || "").trim();
            const isShortened = rawType.includes("수축") || rawType.includes("단축");

            const displayBadge = isShortened ? "🔴 단축근육" : "🔵 약화근육";

            const badgeStyle = isShortened
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-sky-50 text-sky-700 border border-sky-200";

            const mediaInput = item.media || item.video || item.image || [];
            const mediaResult = renderMediaRows(mediaInput, "max-h-56", 3, false);
            const spanClass = mediaResult.totalCount >= 2 ? "md:col-span-2" : "";

            const card = document.createElement('div');
            card.className = `${spanClass} border border-slate-200/80 rounded-2xl p-5 bg-white flex flex-col gap-3 shadow-sm`;
            card.innerHTML = `
                <div class="flex items-center justify-between gap-2">
                    <span class="${badgeStyle} text-xs font-extrabold px-3 py-1 rounded-lg">${displayBadge}</span>
                </div>
                <h4 class="font-extrabold text-base text-[#182b49]">${item.title || ''}</h4>
                ${mediaResult.html}
                <p class="text-sm sm:text-[15px] text-slate-700 font-medium leading-relaxed whitespace-pre-line">${formatRichText(item.desc || '')}</p>
            `;
            imbalanceGrid.appendChild(card);
        });
    } else {
        imbalanceGrid.innerHTML = `<p class="text-sm text-slate-400 col-span-2">단축근육(🔴) 및 약화근육(🔵) 데이터가 이곳에 표시됩니다.</p>`;
    }
}

function selectExercise(exIndex) {
    const merged = getMergedCases();
    const caseObj = merged.find(c => c.key === currentCaseKey);
    if (!caseObj || !caseObj.exercises[exIndex]) return;

    setActiveTabButton('tab-ex-' + exIndex);
    stopAllVideos();
    document.getElementById('case-title').classList.remove('hidden'); 
    document.getElementById('anatomy-panel').classList.add('hidden');
    document.getElementById('exercise-panel').classList.remove('hidden');

    const ex = caseObj.exercises[exIndex];

    document.getElementById('step-badge').innerText = `동작 ${exIndex + 1} / ${caseObj.exercises.length}`;

    const targetBadge = document.getElementById('target-muscle');
    if (ex.targetMuscle && ex.targetMuscle.trim() !== "") {
        targetBadge.innerText = `타겟 근육: ${ex.targetMuscle}`;
        targetBadge.classList.remove('hidden');
    } else {
        targetBadge.classList.add('hidden');
    }

    document.getElementById('exercise-name').innerText = ex.exerciseName;
    document.getElementById('exercise-duration').innerText = `⏰ 권장 강도: ${ex.duration}`;

    // 동작 순서 설명 (볼드/큰글씨 지원)
    const guideContainer = document.getElementById('exercise-guide');
    guideContainer.innerHTML = '';
    (ex.guide || '').split('\n').filter(line => line.trim() !== '').forEach(line => {
        const trimmed = line.trim();
        const lineEl = document.createElement('p');
        if (/^(\d+\.|•|-)\s/.test(trimmed)) {
            lineEl.className = "pl-5 -indent-5";
        }
        lineEl.innerHTML = formatRichText(trimmed);
        guideContainer.appendChild(lineEl);
    });

    // 자극부위 상세 카드 렌더링
    const targetCard = document.getElementById('target-muscle-card');
    const targetListEl = document.getElementById('target-muscles-list');
    targetListEl.innerHTML = '';

    const muscleItems = Array.isArray(ex.targetMuscles)
        ? ex.targetMuscles.filter(m => (m.name && m.name.trim() !== "") || (m.desc && m.desc.trim() !== "") || (m.images && m.images.length > 0))
        : [];

    if (muscleItems.length > 0) {
        muscleItems.forEach((m, idx) => {
            const block = document.createElement('div');
            block.className = idx > 0
                ? "pt-5 border-t border-slate-100 flex flex-col gap-3.5"
                : "flex flex-col gap-3.5";

            const photosResult = renderMediaRows(m.images || m.image || [], "max-h-64", 2, false);

            const nameHtml = (m.name && m.name.trim() !== "")
                ? `<h5 class="text-lg font-black text-[#182b49]">${m.name}</h5>`
                : "";

            const descHtml = (m.desc && m.desc.trim() !== "")
                ? `<p class="text-sm text-slate-700 bg-[#f7fbfb] p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line">${formatRichText(m.desc)}</p>`
                : "";

            block.innerHTML = `
                ${nameHtml}
                ${photosResult.html}
                ${descHtml}
            `;
            targetListEl.appendChild(block);
        });
        targetCard.classList.remove('hidden');
    } else {
        targetCard.classList.add('hidden');
    }

    // 주의사항
    document.getElementById('exercise-caution').innerHTML = formatRichText(ex.caution || '');

    // 상단 임상 개요 배너
    const overviewBox = document.getElementById('case-overview-box');
    const overviewEl = document.getElementById('case-overview');
    const overviewImgBox = document.getElementById('overview-image-box');
    const overviewImgEl = document.getElementById('overview-image');

    const currentOverview = ex.overview || caseObj.overview || "";
    const currentOverviewImg = ex.overviewImage || caseObj.overviewImage || "";

    if (currentOverview.trim() !== "" || currentOverviewImg.trim() !== "") {
        overviewEl.innerHTML = formatRichText(currentOverview);
        overviewBox.classList.remove('hidden');
        if (currentOverviewImg.trim() !== "") {
            overviewImgEl.src = currentOverviewImg;
            overviewImgBox.classList.remove('hidden');
        } else {
            overviewImgEl.src = "";
            overviewImgBox.classList.add('hidden');
        }
    } else {
        overviewBox.classList.add('hidden');
    }

    // 일상생활 자세 교정 팁
    const adlEl = document.getElementById('adl-guide');
    const adlText = ex.adlGuide || caseObj.adlGuide || "";
    if (adlText.trim() !== "") {
        adlEl.innerHTML = formatRichText(adlText);
    } else {
        adlEl.innerHTML = formatRichText("• 스마트폰 및 모니터 화면을 눈높이에 맞춰 고개가 앞으로 빠지지 않게 유지하세요.\n• 의자에 앉을 때는 양쪽 좌골(엉덩이 뼈)에 체중을 균등하게 싣고 다리를 꼬지 않습니다.\n• 한 시간마다 일어나 가볍게 기지개를 켜며 흉곽과 목 주변 근육의 긴장을 풀어주세요.");
    }

    // 메인 유튜브 영상
    document.getElementById('case-video').src = toYoutubeEmbedUrl(ex.video);

    // 올바른 자세 / 잘못된 자세 비교
    const imageCard = document.getElementById('image-card');
    function renderPostureSection(boxId, gridId, descId, imagesData, descText) {
        const box = document.getElementById(boxId);
        const grid = document.getElementById(gridId);
        const descEl = document.getElementById(descId);

        const imgList = Array.isArray(imagesData)
            ? imagesData.filter(src => src && src.trim() !== "")
            : (imagesData && imagesData.trim() !== "" ? [imagesData] : []);
        const hasDesc = descText && descText.trim() !== "";

        if (imgList.length === 0 && !hasDesc) {
            box.classList.add('hidden');
            return false;
        }

        grid.innerHTML = '';
        if (imgList.length > 0) {
            grid.className = imgList.length >= 2 ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3";
            imgList.forEach(src => {
                const wrapper = document.createElement('div');
                wrapper.className = "rounded-xl overflow-hidden bg-white border border-slate-100 flex justify-center items-center p-1";
                wrapper.innerHTML = `<img src="${src}" alt="자세 참고 사진" class="max-h-64 w-full object-contain rounded-lg">`;
                grid.appendChild(wrapper);
            });
            grid.classList.remove('hidden');
        } else {
            grid.classList.add('hidden');
        }

        if (hasDesc) {
            descEl.innerHTML = formatRichText(descText);
            descEl.classList.remove('hidden');
        } else {
            descEl.innerHTML = "";
            descEl.classList.add('hidden');
        }

        box.classList.remove('hidden');
        return true;
    }

    const hasGood = renderPostureSection('good-posture-box', 'good-images-grid', 'good-desc', ex.goodImages, ex.goodDesc);
    const hasBad = renderPostureSection('bad-posture-box', 'bad-images-grid', 'bad-desc', ex.badImages, ex.badDesc);
    imageCard.classList.toggle('hidden', !(hasGood || hasBad));

    // 강화동작 영상 및 설명글
    const advVideoCard = document.getElementById('adv-video-card');
    const advVideoWrapper = document.getElementById('adv-video-wrapper');
    const advVideoEl = document.getElementById('adv-video');
    const advDescEl = document.getElementById('adv-desc');

    const advEmbedUrl = toYoutubeEmbedUrl(ex.advVideo);
    const hasAdvDesc = ex.advDesc && ex.advDesc.trim() !== "";

    if (advEmbedUrl !== "" || hasAdvDesc) {
        if (advEmbedUrl !== "") {
            advVideoEl.src = advEmbedUrl;
            advVideoWrapper.classList.remove('hidden');
        } else {
            advVideoEl.src = "";
            advVideoWrapper.classList.add('hidden');
        }

        if (hasAdvDesc) {
            advDescEl.innerHTML = formatRichText(ex.advDesc);
            advDescEl.classList.remove('hidden');
        } else {
            advDescEl.innerHTML = "";
            advDescEl.classList.add('hidden');
        }
        advVideoCard.classList.remove('hidden');
    } else {
        advVideoEl.src = "";
        advDescEl.innerHTML = "";
        advVideoWrapper.classList.add('hidden');
        advDescEl.classList.add('hidden');
        advVideoCard.classList.add('hidden');
    }

    currentTargetSeconds = ex.timerSeconds || caseObj.timerSeconds || 15;
    resetTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = currentTargetSeconds;
    const display = document.getElementById('timer-display');
    display.innerText = timeLeft + "초";

    timerInterval = setInterval(() => {
        timeLeft--;
        display.innerText = timeLeft + "초";
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            display.innerText = "완료! 🎉";
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    document.getElementById('timer-display').innerText = currentTargetSeconds + "초";
    document.getElementById('timer-start-btn').innerText = currentTargetSeconds + "초 시작";
}

window.addEventListener('DOMContentLoaded', initApp);