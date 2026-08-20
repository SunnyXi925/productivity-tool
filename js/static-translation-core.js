// Static page translation helpers for feature views.
// Extracted from script.js and backed by the shared language bridge.

function getStaticLanguage() {
    return window.XXSGAppLanguage?.current || 'zh';
}

function getStaticTranslations() {
    return window.XXSG_TRANSLATIONS || { zh: {}, en: {} };
}

function setTranslatedText(selector, key, root = document) {
    const element = root.querySelector(selector);
    const value = getStaticTranslations()[getStaticLanguage()][key];
    if (element && value) {
        element.textContent = value;
    }
}

function setTranslatedAttribute(selector, attribute, key, root = document) {
    const element = root.querySelector(selector);
    const value = getStaticTranslations()[getStaticLanguage()][key];
    if (element && value) {
        element.setAttribute(attribute, value);
    }
}

function applyKnownStaticTranslations() {
    setTranslatedText('#more-features-tab-btn .tab-label', 'moreFeaturesTab');

    setTranslatedText('#pomodoro-view .header-badge .badge-text', 'productiveFocus');
    setTranslatedText('#pomodoro-view .pomodoro-title .title-gradient', 'pomodoroTitle');
    setTranslatedText('#pomodoro-view .pomodoro-subtitle', 'pomodoroSubtitle');
    setTranslatedText('#countdown-mode .mode-text', 'pomodoroCountdown');
    setTranslatedText('#countup-mode .mode-text', 'countUpTimer');
    setTranslatedText('#start-btn .btn-text', 'start');
    setTranslatedText('#pause-btn .btn-text', 'pause');
    setTranslatedText('#stop-btn .btn-text', 'stop');
    setTranslatedText('#reset-btn .btn-text', 'reset');
    setTranslatedText('#focus-task-display .focus-label', 'focus');
    setTranslatedText('#focus-select-btn', 'selectTask');
    setTranslatedText('#time-settings-btn .btn-text', 'timeSettings');
    setTranslatedText('#sound-settings-btn .btn-text', 'soundSettings');
    setTranslatedText('#pomodoro-view .stats-title', 'focusStats');
    setTranslatedText('#pomodoro-view .stats-grid .stat-card:nth-child(1) .stat-label', 'todayPomodoros');
    setTranslatedText('#pomodoro-view .stats-grid .stat-card:nth-child(2) .stat-label', 'todayFocus');
    setTranslatedText('#pomodoro-view .stats-grid .stat-card:nth-child(3) .stat-label', 'totalPomodoros');
    setTranslatedText('#pomodoro-view .stats-grid .stat-card:nth-child(4) .stat-label', 'totalFocusTime');
    setTranslatedText('#pomodoro-view .trends-title', 'focusTrend');
    setTranslatedText('#pomodoro-view .period-btn[data-period="7"]', 'sevenDays');
    setTranslatedText('#pomodoro-view .period-btn[data-period="30"]', 'thirtyDays');
    setTranslatedText('#pomodoro-view .chart-text', 'focusTrendChart');
    setTranslatedText('#pomodoro-view .records-title', 'focusRecords');
    setTranslatedText('#pomodoro-view .empty-text', 'noFocusRecords');

    setTranslatedText('#time-tracker-view .header-badge .badge-text', 'timeManagement');
    setTranslatedText('#time-tracker-view .time-tracker-title .title-gradient', 'timeTrackerTitle');
    setTranslatedText('#time-tracker-view .time-tracker-subtitle', 'timeTrackerSubtitle');
    setTranslatedText('#add-time-record-btn .btn-text', 'addTimeRecord');
    setTranslatedText('#time-tracker-view .time-record-card .card-title', 'todayTimeRecords');
    setTranslatedText('#time-tracker-view .time-summary .summary-item:nth-child(1) .summary-label', 'todayTotal');
    setTranslatedText('#time-tracker-view .time-summary .summary-item:nth-child(2) .summary-label', 'remainingAwakeTime');
    setTranslatedText('#time-tracker-view .category-manage-card .card-title', 'categoryManagement');
    setTranslatedText('#add-category-btn .btn-text', 'addNewCategory');
    setTranslatedText('#time-tracker-view .chart-card:nth-child(1) .card-title', 'timeDistribution');
    setTranslatedText('#time-tracker-view .chart-tab[data-period="today"]', 'todayPeriod');
    setTranslatedText('#time-tracker-view .chart-tab[data-period="week"]', 'thisWeek');
    setTranslatedText('#time-tracker-view .chart-tab[data-period="month"]', 'thisMonth');
    setTranslatedText('#time-tracker-view .chart-tab[data-trend="week"]', 'thisWeek');
    setTranslatedText('#time-tracker-view .chart-tab[data-trend="month"]', 'thisMonth');
    setTranslatedText('#time-tracker-view .chart-tab[data-trend="all"]', 'allPeriod');
    setTranslatedText('#time-tracker-view .chart-card:nth-child(2) .card-title', 'trendAnalysis');
    setTranslatedText('#time-tracker-view .goal-tracker-card .card-title', 'goalTracking');

    setTranslatedText('#habit-tracker-view .ht-welcome-badge span', 'dailyPersistence');
    setTranslatedText('#habit-tracker-view .ht-page-title', 'habitPageTitle');
    setTranslatedText('#habit-tracker-view .ht-page-subtitle', 'habitPageSubtitle');
    setTranslatedText('#ht-backBtn span', 'back');
    setTranslatedText('#habit-tracker-view .ht-nav-brand span', 'habitCheckIn');
    setTranslatedAttribute('#habit-tracker-view .ht-nav-btn[data-page="main"]', 'title', 'home');
    setTranslatedAttribute('#habit-tracker-view .ht-nav-btn[data-page="calendar"]', 'title', 'calendar');
    setTranslatedAttribute('#habit-tracker-view .ht-nav-btn[data-page="stats"]', 'title', 'stats');
    setTranslatedAttribute('#habit-tracker-view .ht-nav-btn[data-page="settings"]', 'title', 'settings');
    setTranslatedText('#habit-tracker-view .ht-progress-header h2', 'todayProgress');
    setTranslatedText('#habit-tracker-view .ht-stat-box:nth-child(1) .ht-stat-label', 'completed');
    setTranslatedText('#habit-tracker-view .ht-stat-box:nth-child(3) .ht-stat-label', 'total');
    setTranslatedText('#ht-addHabitBtn span', 'addHabit');
    setTranslatedText('#ht-filterBtn span', 'filter');
    setTranslatedText('#habit-tracker-view .ht-filter-option[data-filter="all"] span', 'all');
}
// 更新页面语言
