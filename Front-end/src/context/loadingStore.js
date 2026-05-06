const MIN_VISIBLE_MS = 1000;

let pendingRequests = 0;
let loadingStartedAt = 0;
let hideTimer = null;
const listeners = new Set();

const emit = () => {
  const loadingState = pendingRequests > 0;
  listeners.forEach((listener) => listener(loadingState));
};

const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
};

export const getLoadingState = () => pendingRequests > 0;

export const startLoading = () => {
  pendingRequests += 1;
  if (pendingRequests === 1) {
    loadingStartedAt = Date.now();
    clearHideTimer();
  }
  emit();
};

export const stopLoading = () => {
  pendingRequests = Math.max(0, pendingRequests - 1);

  if (pendingRequests > 0) {
    emit();
    return;
  }

  const elapsed = Date.now() - loadingStartedAt;
  const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

  clearHideTimer();
  if (remaining > 0) {
    pendingRequests = 1;
    emit();
    hideTimer = setTimeout(() => {
      pendingRequests = 0;
      hideTimer = null;
      emit();
    }, remaining);
    return;
  }

  emit();
};

export const setLoadingState = (nextValue) => {
  clearHideTimer();
  pendingRequests = nextValue ? Math.max(pendingRequests, 1) : 0;
  if (pendingRequests === 0) {
    loadingStartedAt = 0;
  } else if (loadingStartedAt === 0) {
    loadingStartedAt = Date.now();
  }
  emit();
};

export const subscribeLoadingState = (listener) => {
  listeners.add(listener);
  listener(getLoadingState());
  return () => listeners.delete(listener);
};
