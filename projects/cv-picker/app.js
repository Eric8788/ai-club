const STORAGE_KEY = "ai-club-face-profiles-v1";
const FAST_DETECTION_INTERVAL = 120;
const RECOGNITION_INTERVAL = 700;
const UI_REFRESH_INTERVAL = 360;
const FAST_DETECTOR_INPUT_SIZE = 224;
const RECOGNITION_INPUT_SIZE = 320;
const BOX_LERP = 0.35;
const MATCH_THRESHOLD = 0.52;
const TRACK_TTL = 1500;

const bgVideo = document.getElementById("bgVideo");
const previewVideo = document.getElementById("previewVideo");
const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");

const cameraStatus = document.getElementById("cameraStatus");
const modelStatus = document.getElementById("modelStatus");
const modelDot = document.getElementById("modelDot");
const statusDot = document.getElementById("statusDot");
const scanHint = document.getElementById("scanHint");
const modeText = document.getElementById("modeText");
const recognizedCount = document.getElementById("recognizedCount");
const instructionText = document.getElementById("instructionText");
const winnerBanner = document.getElementById("winnerBanner");

const clearProfilesButton = document.getElementById("clearProfilesButton");
const studentList = document.getElementById("studentList");
const enrolledCount = document.getElementById("enrolledCount");
const enrollStatus = document.getElementById("enrollStatus");
const resultText = document.getElementById("resultText");
const visibleFaceCount = document.getElementById("visibleFaceCount");
const drawableFaceCount = document.getElementById("drawableFaceCount");

const cameraButton = document.getElementById("cameraButton");
const drawButton = document.getElementById("drawButton");
const resetButton = document.getElementById("resetButton");

function redirectFilePageToLocalServer() {
  if (window.location.protocol !== "file:") {
    return false;
  }

  const marker = "/AI-CLUB/";
  const decodedPath = decodeURIComponent(window.location.pathname);
  const markerIndex = decodedPath.indexOf(marker);
  const projectPath =
    markerIndex >= 0
      ? decodedPath.slice(markerIndex + marker.length).replace(/index\.html$/i, "")
      : "2_学生项目_Student_Projects/codex-p1/";

  window.location.href = `http://localhost:5190/${encodeURI(projectPath)}`;
  return true;
}

const shouldBootApp = !redirectFilePageToLocalServer();

const state = {
  modelsReady: false,
  cameraReady: false,
  cameraRequesting: false,
  fastDetecting: false,
  recognizing: false,
  lastRecognitionAt: 0,
  lastUiRefreshAt: 0,
  lastHintAt: 0,
  renderFrameId: null,
  mode: "idle",
  videoSize: { width: 1280, height: 720 },
  faceProfiles: loadProfiles(),
  tracks: [],
  nextTrackId: 1,
  liveRecognizedIds: [],
  selectedStudentId: null,
  highlightedStudentId: null,
  enrollment: { running: false },
  draw: {
    running: false,
    candidateIds: [],
    timerId: null,
  },
};

function loadProfiles() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return normalizeStoredProfiles(parsed);
  } catch (error) {
    console.error("Failed to load profiles", error);
    return {};
  }
}

function saveProfiles() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.faceProfiles));
}

function normalizeLabel(label) {
  return String(label || "").trim().replace(/\s+/g, " ");
}

function labelKey(label) {
  return normalizeLabel(label).toLocaleLowerCase();
}

function displayNameFromKey(key) {
  return key ? key.charAt(0).toLocaleUpperCase() + key.slice(1) : "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeStoredProfiles(parsed) {
  const profiles = {};

  Object.entries(parsed).forEach(([rawId, value]) => {
    if (Array.isArray(value)) {
      const name = displayNameFromKey(rawId);
      if (name && value.length) {
        profiles[labelKey(name)] = { name, descriptors: value };
      }
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    const name = normalizeLabel(value.name || rawId);
    const descriptors = Array.isArray(value.descriptors) ? value.descriptors : [];
    if (name && descriptors.length) {
      profiles[labelKey(name)] = { name, descriptors };
    }
  });

  return profiles;
}

function labelNameById(labelId) {
  return state.faceProfiles[labelId]?.name || labelId;
}

function knownLabels() {
  return Object.entries(state.faceProfiles)
    .filter(([, profile]) => profile?.descriptors?.length)
    .map(([id, profile]) => ({ id, name: profile.name || id }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function setMode(mode, message) {
  state.mode = mode;
  const modeMap = {
    idle: "待机",
    enrolling: "录入中",
    drawing: "抽签中",
    selected: "已选中",
  };

  modeText.textContent = modeMap[mode] || mode;
  if (message) {
    instructionText.textContent = message;
  }
}

function setCameraStatus(text, ok) {
  cameraStatus.textContent = text;
  statusDot.style.background = ok ? "var(--teal)" : "var(--danger)";
  statusDot.style.boxShadow = ok
    ? "0 0 12px rgba(111, 242, 221, 0.72)"
    : "0 0 12px rgba(255, 110, 124, 0.72)";
}

function setModelStatus(text, ok) {
  modelStatus.textContent = text;
  modelDot.style.background = ok ? "var(--accent)" : "var(--danger)";
  modelDot.style.boxShadow = ok
    ? "0 0 12px rgba(244, 195, 93, 0.72)"
    : "0 0 12px rgba(255, 110, 124, 0.72)";
}

function updateCounts() {
  const enrolled = knownLabels().length;
  const visibleTracks = getVisibleTracks();
  const drawableIds = getCurrentRecognizedCandidates();
  enrolledCount.textContent = String(enrolled);
  recognizedCount.textContent = String(drawableIds.length);
  visibleFaceCount.textContent = String(visibleTracks.length);
  drawableFaceCount.textContent = String(drawableIds.length);
}

function getVisibleTracks() {
  const now = Date.now();
  return state.tracks
    .filter((track) => now - track.lastSeenAt < TRACK_TTL)
    .sort((left, right) => {
      const leftBox = trackReferenceBox(left);
      const rightBox = trackReferenceBox(right);
      return (leftBox?.x || 0) - (rightBox?.x || 0);
    });
}

function assignVisibleTrackNumbers(visibleTracks = getVisibleTracks()) {
  visibleTracks.forEach((track, index) => {
    track.displayIndex = index + 1;
  });
  return visibleTracks;
}

function renderStudentList() {
  const visibleTracks = assignVisibleTrackNumbers();

  if (!visibleTracks.length) {
    studentList.innerHTML = `
      <div class="empty-state">
        摄像头打开后，系统会在这里显示当前画面中的每一张脸。
      </div>
    `;
    updateCounts();
    return;
  }

  studentList.innerHTML = visibleTracks
    .map((track, index) => {
      const labelId = track.matchedStudentId || "";
      const isTagged = Boolean(labelId);
      const displayIndex = track.displayIndex || index + 1;
      const label = isTagged ? labelNameById(labelId) : `人物 ${displayIndex}`;
      const hasDescriptor = Boolean(track.descriptor);
      const isHighlighted = labelId && state.highlightedStudentId === labelId;
      const isSelected = labelId && state.selectedStudentId === labelId;
      const classes = [
        "student-card",
        "is-live",
        isHighlighted ? "is-active" : "",
        isSelected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const statusText = isTagged
        ? `<span class="badge ready">已标记</span>`
        : `<span class="badge empty">未标记</span>`;
      const note = isSelected
        ? "刚刚被选中"
        : isHighlighted
          ? "抽签高亮中"
          : isTagged
            ? "可以参与抽签"
            : hasDescriptor
              ? "选择名字后点击标记"
              : "正在获取人脸特征";

      return `
        <div class="${classes}">
          <div class="student-head">
            <div class="student-name"><span class="face-index">#${displayIndex}</span>${escapeHtml(label)}</div>
            ${statusText}
          </div>
          <div class="student-meta">
            <span class="badge live">镜头中</span>
            <span class="badge ${hasDescriptor ? "ready" : "empty"}">${hasDescriptor ? "可标记" : "等待特征"}</span>
          </div>
          <div class="tag-row">
            <input data-track-label="${track.trackId}" list="knownLabels" value="${isTagged ? escapeHtml(labelNameById(labelId)) : ""}" placeholder="给 #${displayIndex} 输入名字" />
            <button class="accent" data-tag-track="${track.trackId}" ${hasDescriptor ? "" : "disabled"}>标记</button>
          </div>
          <div class="student-note">${note}</div>
        </div>
      `;
    })
    .join("");

  const datalist = document.getElementById("knownLabels");
  if (datalist) {
    datalist.innerHTML = knownLabels().map((item) => `<option value="${escapeHtml(item.name)}"></option>`).join("");
  }

  updateCounts();
}

function getCurrentRecognizedCandidates() {
  const unique = new Set();
  const now = Date.now();

  state.tracks.forEach((track) => {
    if (track.matchedStudentId && now - track.lastSeenAt < TRACK_TTL) {
      unique.add(track.matchedStudentId);
    }
  });

  return knownLabels().map((label) => label.id).filter((id) => unique.has(id));
}

function updateActionState() {
  const canDraw = state.modelsReady && state.cameraReady && getCurrentRecognizedCandidates().length > 0 && !state.draw.running && !state.enrollment.running;
  drawButton.disabled = !canDraw;
  cameraButton.disabled = state.cameraReady || state.cameraRequesting;
  cameraButton.textContent = state.cameraReady ? "摄像头已连接" : state.cameraRequesting ? "正在打开..." : "打开摄像头";
}

function isEditingLabel() {
  const activeElement = document.activeElement;
  return Boolean(activeElement && studentList.contains(activeElement) && activeElement.matches("[data-track-label]"));
}

function hasEnrolledProfiles() {
  return knownLabels().length > 0;
}

function refreshPresenceUi(force = false) {
  const now = Date.now();
  if (!force && now - state.lastUiRefreshAt < UI_REFRESH_INTERVAL) {
    return;
  }

  state.lastUiRefreshAt = now;
  state.liveRecognizedIds = getCurrentRecognizedCandidates();
  if (isEditingLabel() && !force) {
    updateCounts();
    updateActionState();
    return;
  }

  renderStudentList();
  updateActionState();
}

function resizeCanvas() {
  const width = previewVideo.videoWidth || state.videoSize.width;
  const height = previewVideo.videoHeight || state.videoSize.height;

  state.videoSize = { width, height };
  overlayCanvas.width = width;
  overlayCanvas.height = height;
}

function averageDescriptors(descriptors) {
  const length = descriptors[0].length;
  const accumulator = new Array(length).fill(0);

  descriptors.forEach((descriptor) => {
    descriptor.forEach((value, index) => {
      accumulator[index] += value;
    });
  });

  return accumulator.map((value) => value / descriptors.length);
}

function descriptorDistance(left, right) {
  if (!left || !right || left.length !== right.length) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    const diff = left[index] - right[index];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

function matchDescriptor(descriptor) {
  let bestMatch = { studentId: null, distance: Number.POSITIVE_INFINITY };

  knownLabels().forEach((label) => {
    const samples = state.faceProfiles[label.id]?.descriptors || [];
    samples.forEach((sample) => {
      const distance = descriptorDistance(descriptor, sample);
      if (distance < bestMatch.distance) {
        bestMatch = { studentId: label.id, distance };
      }
    });
  });

  if (bestMatch.studentId && bestMatch.distance <= MATCH_THRESHOLD) {
    return {
      studentId: bestMatch.studentId,
      confidence: Math.max(0, 1 - bestMatch.distance / MATCH_THRESHOLD),
      distance: bestMatch.distance,
    };
  }

  return {
    studentId: null,
    confidence: 0,
    distance: bestMatch.distance,
  };
}

function centerOf(box) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function boxDistance(left, right) {
  const a = centerOf(left);
  const b = centerOf(right);
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeBox(box) {
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

function copyBox(box) {
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

function lerpBox(current, target, amount) {
  current.x += (target.x - current.x) * amount;
  current.y += (target.y - current.y) * amount;
  current.width += (target.width - current.width) * amount;
  current.height += (target.height - current.height) * amount;
  return current;
}

function trackReferenceBox(track) {
  return track.targetBox || track.box || track.displayBox;
}

function mapFastDetection(faceDetection) {
  return {
    box: normalizeBox(faceDetection.box),
  };
}

function mapRecognitionDetection(detectionResult) {
  const { detection, descriptor } = detectionResult;
  const box = detection.box;
  const match = matchDescriptor(Array.from(descriptor));
  return {
    box: normalizeBox(box),
    descriptor: Array.from(descriptor),
    matchedStudentId: match.studentId,
    confidence: match.confidence,
  };
}

function findNearestTrack(box, tracks, maxDistance, withIdentityPenalty = false, studentId = null) {
  let bestTrack = null;
  let bestScore = Number.POSITIVE_INFINITY;

  tracks.forEach((track) => {
    if (track._used) {
      return;
    }

    const referenceBox = trackReferenceBox(track);
    if (!referenceBox) {
      return;
    }

    const identityPenalty =
      withIdentityPenalty && track.matchedStudentId && studentId && track.matchedStudentId !== studentId ? 70 : 0;
    const score = boxDistance(referenceBox, box) + identityPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  });

  if (!bestTrack || bestScore > maxDistance) {
    return null;
  }

  return bestTrack;
}

function updateTracksFromFastDetections(detections) {
  const now = Date.now();
  const nextTracks = [];
  const availableTracks = state.tracks.filter((track) => now - track.lastSeenAt < TRACK_TTL);

  detections.forEach((detection) => {
    const maxDistance = Math.max(detection.box.width, detection.box.height) * 1.2 + 90;
    const bestTrack = findNearestTrack(detection.box, availableTracks, maxDistance);

    if (bestTrack) {
      bestTrack._used = true;
      const { _used, ...trackData } = bestTrack;
      nextTracks.push({
        ...trackData,
        box: detection.box,
        targetBox: detection.box,
        displayBox: bestTrack.displayBox || copyBox(detection.box),
        lastSeenAt: now,
      });
    } else {
      nextTracks.push({
        trackId: state.nextTrackId++,
        box: detection.box,
        targetBox: detection.box,
        displayBox: copyBox(detection.box),
        matchedStudentId: null,
        confidence: 0,
        lastIdentityCheckAt: 0,
        lastSeenAt: now,
      });
    }
  });

  availableTracks.forEach((track) => {
    if (!track._used && now - track.lastSeenAt < TRACK_TTL) {
      nextTracks.push(track);
    }
    delete track._used;
  });

  state.tracks = nextTracks;
  refreshPresenceUi();
}

function updateTrackIdentities(detections) {
  const now = Date.now();
  const availableTracks = state.tracks.filter((track) => now - track.lastSeenAt < TRACK_TTL);
  let identityChanged = false;

  detections.forEach((detection) => {
    const maxDistance = Math.max(detection.box.width, detection.box.height) * 1.4 + 110;
    const track = findNearestTrack(detection.box, availableTracks, maxDistance, true, detection.matchedStudentId);

    if (track) {
      track._used = true;
      const nextStudentId = detection.matchedStudentId || track.matchedStudentId || null;
      const nextConfidence = detection.matchedStudentId ? detection.confidence : Math.max(0, (track.confidence || 0) * 0.9);

      if (track.matchedStudentId !== nextStudentId) {
        identityChanged = true;
      }
      track.box = detection.box;
      track.targetBox = detection.box;
      track.displayBox = track.displayBox || copyBox(detection.box);
      track.descriptor = detection.descriptor;
      track.matchedStudentId = nextStudentId;
      track.confidence = nextConfidence;
      track.lastIdentityCheckAt = now;
      track.lastSeenAt = now;
    } else {
      state.tracks.push({
        trackId: state.nextTrackId++,
        box: detection.box,
        targetBox: detection.box,
        displayBox: copyBox(detection.box),
        descriptor: detection.descriptor,
        matchedStudentId: detection.matchedStudentId,
        confidence: detection.confidence,
        lastIdentityCheckAt: now,
        lastSeenAt: now,
      });
      identityChanged = true;
    }
  });

  availableTracks.forEach((track) => {
    delete track._used;
  });

  refreshPresenceUi(identityChanged);
}

function drawOverlay() {
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  overlayCtx.textBaseline = "top";

  const now = Date.now();
  const visibleTracks = assignVisibleTrackNumbers();
  visibleTracks.forEach((track) => {
    if (!track.displayBox) {
      track.displayBox = copyBox(track.targetBox || track.box);
    }

    if (track.targetBox) {
      lerpBox(track.displayBox, track.targetBox, BOX_LERP);
    }

    const box = track.displayBox;
    const staleAge = now - track.lastSeenAt;
    const fade = staleAge < 360 ? 1 : Math.max(0.25, 1 - (staleAge - 360) / (TRACK_TTL - 360));
    const mirroredX = overlayCanvas.width - box.x - box.width;
    const isHighlighted = track.matchedStudentId && track.matchedStudentId === state.highlightedStudentId;
    const isSelected = track.matchedStudentId && track.matchedStudentId === state.selectedStudentId;
    const stroke = isSelected ? "#171717" : isHighlighted ? "#1a73e8" : track.matchedStudentId ? "#1a73e8" : "rgba(255,255,255,0.92)";
    const lineWidth = isSelected ? 5 : isHighlighted ? 4 : 2.5;
    const facePrefix = `#${track.displayIndex || "?"}`;
    const label = track.matchedStudentId ? `${facePrefix} ${labelNameById(track.matchedStudentId)}` : `${facePrefix} 未标记`;

    overlayCtx.save();
    overlayCtx.globalAlpha = fade;
    overlayCtx.strokeStyle = stroke;
    overlayCtx.lineWidth = lineWidth;
    overlayCtx.shadowColor = stroke;
    overlayCtx.shadowBlur = isSelected || isHighlighted ? 8 : 0;
    overlayCtx.strokeRect(mirroredX, box.y, box.width, box.height);

    overlayCtx.fillStyle = isSelected
      ? "rgba(23, 23, 23, 0.10)"
      : isHighlighted
        ? "rgba(26, 115, 232, 0.12)"
        : track.matchedStudentId
          ? "rgba(26, 115, 232, 0.08)"
          : "rgba(255,255,255,0.08)";
    overlayCtx.fillRect(mirroredX, box.y, box.width, box.height);

    const labelWidth = Math.max(94, overlayCtx.measureText(label).width + 48);
    const labelX = Math.max(10, Math.min(mirroredX, overlayCanvas.width - labelWidth - 10));
    const labelY = Math.max(10, box.y - 34);
    overlayCtx.fillStyle = "rgba(255, 255, 255, 0.92)";
    overlayCtx.beginPath();
    overlayCtx.roundRect(labelX, labelY, labelWidth, 28, 14);
    overlayCtx.fill();
    overlayCtx.strokeStyle = "rgba(23, 23, 23, 0.16)";
    overlayCtx.lineWidth = 1;
    overlayCtx.stroke();
    overlayCtx.fillStyle = isSelected || isHighlighted || track.matchedStudentId ? "#1a73e8" : "#171717";
    overlayCtx.font = isSelected ? "700 15px Inter" : "600 14px Inter";
    overlayCtx.fillText(label, labelX + 12, labelY + 7);
    overlayCtx.restore();
  });
}

async function loadModels() {
  try {
    setModelStatus("模型加载中...", false);
    const modelPath = "./models";
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
    ]);
    state.modelsReady = true;
    setModelStatus("模型已就绪", true);
    scanHint.textContent = "模型已加载，等待镜头识别人脸。";
    updateActionState();
  } catch (error) {
    console.error(error);
    setModelStatus("模型加载失败", false);
    scanHint.textContent = "模型加载失败，请检查 models 目录。";
  }
}

async function startCamera() {
  if (state.cameraReady || state.cameraRequesting) {
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraStatus("浏览器不支持摄像头", false);
    scanHint.textContent = "当前浏览器不支持摄像头接口，请换 Chrome 或 Safari 打开本页。";
    instructionText.textContent = "浏览器没有提供摄像头能力，无法进入识别流程。";
    updateActionState();
    return;
  }

  state.cameraRequesting = true;
  setCameraStatus("请求摄像头...", false);
  scanHint.textContent = "正在请求摄像头权限，如果浏览器弹窗出现，请选择允许。";
  instructionText.textContent = "页面会自动请求摄像头；如果没有弹窗，请点击“打开摄像头”重试，或检查地址栏摄像头权限。";
  updateActionState();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });

    bgVideo.srcObject = stream;
    previewVideo.srcObject = stream;

    await Promise.allSettled([bgVideo.play(), previewVideo.play()]);

    const markCameraReady = () => {
      state.cameraReady = true;
      state.cameraRequesting = false;
      resizeCanvas();
      setCameraStatus("相机已连接", true);
      scanHint.textContent = state.modelsReady ? "镜头在线，等待识别..." : "相机已连接，等待模型...";
      instructionText.textContent = "摄像头已接入。让同学进入镜头后，在右侧给每张脸打标签，再选择是否抽签。";
      updateActionState();
    };

    if (previewVideo.videoWidth > 0) {
      markCameraReady();
    } else {
      previewVideo.addEventListener("loadedmetadata", markCameraReady, { once: true });
    }
  } catch (error) {
    console.error(error);
    state.cameraRequesting = false;
    state.cameraReady = false;
    setCameraStatus("相机未接入", false);
    const message = getCameraErrorMessage(error);
    scanHint.textContent = message.short;
    instructionText.textContent = message.long;
    updateActionState();
  }
}

function getCameraErrorMessage(error) {
  const name = error?.name || "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      short: "摄像头权限被拒绝，请点击“打开摄像头”或检查地址栏权限。",
      long: "浏览器已经拒绝摄像头权限。请点击地址栏左侧的站点权限/摄像头图标，把摄像头改为允许，然后再点“打开摄像头”。",
    };
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      short: "没有找到可用摄像头。",
      long: "当前设备没有检测到摄像头，或摄像头没有被系统识别。请接入摄像头后再重试。",
    };
  }

  if (name === "NotReadableError" || name === "TrackStartError") {
    return {
      short: "摄像头被其他应用占用。",
      long: "摄像头可能正在被会议软件或其他浏览器占用。关闭占用摄像头的应用后，再点“打开摄像头”。",
    };
  }

  if (name === "SecurityError") {
    return {
      short: "当前页面环境不允许访问摄像头。",
      long: "请通过 http://localhost:5190 或同一局域网地址打开页面，不要用 file:// 直接打开。",
    };
  }

  return {
    short: "摄像头打开失败，请点“打开摄像头”重试。",
    long: "摄像头没有成功接入。请确认浏览器允许摄像头权限，然后点“打开摄像头”再试一次。",
  };
}

function canRunVision() {
  return state.modelsReady && state.cameraReady && previewVideo.readyState >= 2 && !state.enrollment.running;
}

function updateScanHintFromPresence(detectedCount, force = false) {
  if (state.draw.running || state.enrollment.running) {
    return;
  }

  const now = Date.now();
  if (!force && now - state.lastHintAt < UI_REFRESH_INTERVAL) {
    return;
  }

  state.lastHintAt = now;

  if (detectedCount === 0) {
    scanHint.textContent = "没有检测到人脸，往镜头中央站一点会更稳。";
  } else if (!hasEnrolledProfiles()) {
    scanHint.textContent = `检测到 ${detectedCount} 张脸。请先在右侧给人脸打标签。`;
  } else if (state.liveRecognizedIds.length > 0) {
    scanHint.textContent = `已识别 ${state.liveRecognizedIds.length} 位同学，可开始抽签。`;
  } else {
    scanHint.textContent = `检测到 ${detectedCount} 张脸，正在匹配已有标签。`;
  }
}

async function detectFastFaces() {
  if (!canRunVision() || state.fastDetecting) {
    return;
  }

  state.fastDetecting = true;

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: FAST_DETECTOR_INPUT_SIZE,
    scoreThreshold: 0.45,
  });

  try {
    const detections = await faceapi.detectAllFaces(previewVideo, options);
    updateTracksFromFastDetections(detections.map(mapFastDetection));
    updateScanHintFromPresence(detections.length);
  } catch (error) {
    console.error(error);
    scanHint.textContent = "快速检测遇到问题，正在保持画面。";
  } finally {
    state.fastDetecting = false;
  }
}

async function recognizeVisibleFaces(force = false) {
  if (!canRunVision() || state.recognizing || getVisibleTracks().length === 0) {
    return;
  }

  const now = Date.now();
  if (!force && now - state.lastRecognitionAt < RECOGNITION_INTERVAL) {
    return;
  }

  state.recognizing = true;
  state.lastRecognitionAt = now;

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: RECOGNITION_INPUT_SIZE,
    scoreThreshold: 0.45,
  });

  try {
    const detections = await faceapi
      .detectAllFaces(previewVideo, options)
      .withFaceLandmarks(true)
      .withFaceDescriptors();

    updateTrackIdentities(detections.map(mapRecognitionDetection));
    updateScanHintFromPresence(detections.length, true);
  } catch (error) {
    console.error(error);
    scanHint.textContent = "身份识别遇到问题，快速跟踪仍会继续。";
  } finally {
    state.recognizing = false;
  }
}

function startDetectionLoop() {
  void detectFastFaces();
  void recognizeVisibleFaces();

  window.setInterval(() => {
    void detectFastFaces();
  }, FAST_DETECTION_INTERVAL);

  window.setInterval(() => {
    void recognizeVisibleFaces();
  }, RECOGNITION_INTERVAL);
}

function startRenderLoop() {
  if (state.renderFrameId) {
    return;
  }

  const render = () => {
    drawOverlay();
    state.renderFrameId = window.requestAnimationFrame(render);
  };

  state.renderFrameId = window.requestAnimationFrame(render);
}

async function tagTrack(trackId, labelText) {
  const labelName = normalizeLabel(labelText);
  const labelId = labelKey(labelName);

  if (!labelId || state.draw.running) {
    return;
  }

  let track = state.tracks.find((item) => item.trackId === trackId);
  if (!track?.descriptor) {
    enrollStatus.textContent = "正在为这张脸获取特征，请保持正脸 1 秒。";
    await recognizeVisibleFaces(true);
    track = state.tracks.find((item) => item.trackId === trackId);
  }

  if (!track?.descriptor) {
    enrollStatus.textContent = "暂时还没有拿到这张脸的特征，请让同学面向镜头后再点标记。";
    return;
  }

  const samples = state.faceProfiles[labelId]?.descriptors || [];
  state.faceProfiles[labelId] = {
    name: labelName,
    descriptors: [track.descriptor, ...samples].slice(0, 8),
  };
  track.matchedStudentId = labelId;
  track.confidence = 1;
  track.lastIdentityCheckAt = Date.now();
  saveProfiles();

  enrollStatus.textContent = `已把当前人脸标记为 ${labelName}，之后系统会自动匹配这个标签。`;
  scanHint.textContent = `${labelName} 已进入可抽签名单。`;
  refreshPresenceUi(true);
  drawOverlay();
}

function clearProfiles() {
  state.faceProfiles = {};
  saveProfiles();
  state.tracks = state.tracks.map((track) => ({
    ...track,
    matchedStudentId: null,
    confidence: 0,
  }));
  state.selectedStudentId = null;
  state.highlightedStudentId = null;
  winnerBanner.classList.remove("is-visible");
  resultText.textContent = "尚未抽签";
  enrollStatus.textContent = "所有本地标签模板已清空，可以重新给镜头中的人打标签。";
  scanHint.textContent = "标签库已清空，等待重新标记。";
  refreshPresenceUi(true);
  updateActionState();
}

function stopDrawTimer() {
  if (state.draw.timerId) {
    window.clearTimeout(state.draw.timerId);
    state.draw.timerId = null;
  }
}

function finishDraw(studentId) {
  state.draw.running = false;
  state.selectedStudentId = studentId;
  state.highlightedStudentId = studentId;
  const winnerName = labelNameById(studentId);
  winnerBanner.textContent = `${winnerName}，你被选中了`;
  winnerBanner.classList.add("is-visible");
  resultText.textContent = winnerName;
  scanHint.textContent = `抽签结束：${winnerName} 被选中。`;
  setMode("selected", `抽签结果：${winnerName}。`);
  renderStudentList();
  updateActionState();
  drawOverlay();
}

function startDraw() {
  const candidateIds = getCurrentRecognizedCandidates();
  if (!candidateIds.length || state.draw.running || state.enrollment.running) {
    return;
  }

  state.draw.running = true;
  state.selectedStudentId = null;
  winnerBanner.classList.remove("is-visible");
  state.draw.candidateIds = candidateIds.slice();

  const finalIndex = Math.floor(Math.random() * candidateIds.length);
  const totalSteps = candidateIds.length * 4 + finalIndex + 1;
  let step = 0;
  let delay = 90;

  setMode("drawing", "命运滚轮启动中，镜头里的人脸框会轮流高亮并逐渐减速。");
  resultText.textContent = "抽签中...";
  drawButton.disabled = true;

  const tick = () => {
    const studentId = candidateIds[step % candidateIds.length];
    state.highlightedStudentId = studentId;
    scanHint.textContent = `抽签锁定候选池：${candidateIds.map(labelNameById).join(" / ")}`;
    renderStudentList();
    drawOverlay();
    step += 1;

    if (step >= totalSteps) {
      finishDraw(studentId);
      return;
    }

    delay = Math.min(delay + 18 + step * 1.2, 320);
    state.draw.timerId = window.setTimeout(tick, delay);
  };

  tick();
}

function resetSelection() {
  stopDrawTimer();
  state.draw.running = false;
  state.selectedStudentId = null;
  state.highlightedStudentId = null;
  winnerBanner.classList.remove("is-visible");
  resultText.textContent = "尚未抽签";
  setMode("idle", "结果已清除，镜头中识别到的同学可以重新参与抽签。");
  renderStudentList();
  updateActionState();
  drawOverlay();
}

function bindEvents() {
  previewVideo.addEventListener("loadedmetadata", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);

  cameraButton.addEventListener("click", () => {
    void startCamera();
  });

  studentList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag-track]");
    if (!button) {
      return;
    }

    const trackId = Number(button.dataset.tagTrack);
    const input = studentList.querySelector(`[data-track-label="${trackId}"]`);
    void tagTrack(trackId, input?.value || "");
  });

  studentList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !event.target.matches("[data-track-label]")) {
      return;
    }

    const trackId = Number(event.target.dataset.trackLabel);
    event.preventDefault();
    void tagTrack(trackId, event.target.value || "");
  });

  clearProfilesButton.addEventListener("click", clearProfiles);
  drawButton.addEventListener("click", startDraw);
  resetButton.addEventListener("click", resetSelection);
}

function init() {
  renderStudentList();
  bindEvents();
  setMode("idle", "打开摄像头后，系统会自动检测画面中的人脸。右侧给对应的人打标签后即可抽签。");
  setCameraStatus("相机准备中...", false);
  setModelStatus("模型加载中...", false);
  void loadModels();
  void startCamera();
  startDetectionLoop();
  startRenderLoop();
}

if (shouldBootApp) {
  init();
}
