(function () {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    if (params.get('desktop') !== '1' && !window.desktopWidget?.isDesktop) return;

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function button(label, className) {
        const node = element('button', `desktop-widget-control ${className}`, label);
        node.type = 'button';
        return node;
    }

    function formatClock() {
        return new Intl.DateTimeFormat('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(new Date());
    }

    function relabelNavigation() {
        const labels = new Map([
            ['list-tab-btn', '任务'],
            ['quadrant-tab-btn', '象限'],
            ['dashboard-tab-btn', '看板'],
            ['review-tab-btn', '复盘'],
            ['templates-tab-btn', '模板'],
            ['more-features-tab-btn', '更多']
        ]);
        labels.forEach((label, id) => {
            const tab = document.getElementById(id);
            const text = tab?.querySelector('.tab-label');
            if (text) text.textContent = label;
            if (tab) tab.title = label;
        });
    }

    const pageMeta = {
        list: { title: '任务', subtitle: '收集今天要完成的事', action: ['+', '新建任务', 'initial-add-btn'] },
        quadrant: { title: '四象限', subtitle: '判断轻重缓急', action: ['+', '新建任务', 'initial-add-btn'] },
        dashboard: { title: '看板', subtitle: '看见进度与节奏' },
        review: { title: '复盘', subtitle: '回看并收束一天', action: ['保存', '保存复盘', 'save-review-btn'] },
        templates: { title: '模板', subtitle: '重复工作，一次设置', action: ['+', '创建模板', 'create-template-btn'] },
        'more-features': { title: '工具', subtitle: '专注、习惯与日程' },
        fortune: { title: '每日一签', subtitle: '为今天留一句提醒', child: true },
        pomodoro: { title: '番茄专注', subtitle: '把注意力留在当下', child: true },
        'habit-tracker': { title: '习惯打卡', subtitle: '让行动留下连续记录', child: true, action: ['+', '添加习惯', 'ht-addHabitBtn'] },
        countdown: { title: '倒数日', subtitle: '记住值得等待的日子', child: true, action: ['+', '添加纪念日', 'add-countdown-btn'] },
        'time-tracker': { title: '时间记录', subtitle: '看见时间去了哪里', child: true, action: ['+', '添加时间记录', 'add-time-record-btn'] },
        calendar: { title: '日历', subtitle: '安排接下来的时间', child: true, action: ['+', '创建日程', 'calendar-sidebar-create'] }
    };

    function createViewHeader() {
        const header = document.querySelector('.logo-section');
        if (!header || header.querySelector('.widget-view-header')) return;

        const shell = element('div', 'widget-view-header');
        const back = button('‹', 'widget-view-back');
        back.setAttribute('aria-label', '返回工具');
        back.hidden = true;
        back.addEventListener('click', () => window.switchView?.('more-features'));

        const copy = element('div', 'widget-view-copy');
        const title = element('strong', 'widget-view-title', '四象限');
        const subtitle = element('span', 'widget-view-subtitle', '判断轻重缓急');
        copy.append(title, subtitle);

        const action = button('+', 'widget-view-action');
        action.hidden = true;
        action.addEventListener('click', () => {
            const target = action.dataset.target;
            if (target === 'initial-add-btn') window.switchView?.('list');
            window.setTimeout(() => document.getElementById(target)?.click(), 0);
        });

        shell.append(back, copy, action);
        header.appendChild(shell);
    }

    function normalizeViewHierarchy() {
        const main = document.querySelector('.container > main');
        if (!main) return;

        [
            'fortune-view',
            'habit-tracker-view',
            'countdown-view',
            'dashboard-view',
            'review-view',
            'templates-view'
        ].forEach(id => {
            const view = document.getElementById(id);
            if (view && view.parentElement !== main) main.appendChild(view);
        });
    }

    function updateViewHeader(view) {
        const meta = pageMeta[view] || pageMeta['more-features'];
        document.body.dataset.widgetView = view;
        const back = document.querySelector('.widget-view-back');
        const title = document.querySelector('.widget-view-title');
        const subtitle = document.querySelector('.widget-view-subtitle');
        const action = document.querySelector('.widget-view-action');
        if (back) back.hidden = !meta.child;
        if (title) title.textContent = meta.title;
        if (subtitle) subtitle.textContent = meta.subtitle;
        if (action) {
            action.hidden = !meta.action;
            if (meta.action) {
                action.textContent = meta.action[0];
                action.title = meta.action[1];
                action.setAttribute('aria-label', meta.action[1]);
                action.dataset.target = meta.action[2];
            } else {
                action.removeAttribute('data-target');
            }
        }

        if (view === 'calendar' && !document.body.dataset.widgetCalendarPrepared) {
            document.body.dataset.widgetCalendarPrepared = 'true';
            window.setTimeout(() => document.querySelector('[data-calendar-view="month"]')?.click(), 120);
        }

        document.querySelector('.container > main')?.scrollTo({ top: 0, behavior: 'instant' });
    }

    function init() {
        normalizeViewHierarchy();
        document.documentElement.classList.add('desktop-widget-shell');
        document.body.classList.add('desktop-widget');
        document.title = 'Productivity Widget';

        const bar = element('header', 'desktop-widget-bar');
        bar.setAttribute('aria-label', '桌面小组件控制栏');
        const dragArea = element('div', 'desktop-widget-drag');
        const mark = element('span', 'desktop-widget-mark', 'P');
        const identity = element('div', 'desktop-widget-identity');
        identity.append(element('strong', '', '今日工作台'), element('span', 'desktop-widget-clock', formatClock()));
        dragArea.append(mark, identity);

        const controls = element('div', 'desktop-widget-controls');
        const ai = button('AI', 'desktop-widget-ai');
        ai.title = '配置 AI';
        ai.addEventListener('click', () => document.getElementById('header-ai-settings')?.click());

        const pin = button('已固定', 'desktop-widget-pin');
        pin.title = '切换是否固定在其他窗口前面';
        pin.setAttribute('aria-pressed', 'true');
        pin.addEventListener('click', async () => {
            if (!window.desktopWidget?.togglePin) return;
            const pinned = await window.desktopWidget.togglePin();
            pin.textContent = pinned ? '已固定' : '固定';
            pin.setAttribute('aria-pressed', String(pinned));
        });

        const hide = button('—', 'desktop-widget-hide');
        hide.title = '收起到菜单栏';
        hide.setAttribute('aria-label', '收起到菜单栏');
        hide.addEventListener('click', () => window.desktopWidget?.hide?.());
        controls.append(ai, pin, hide);
        bar.append(dragArea, controls);
        document.body.prepend(bar);

        window.desktopWidget?.getState?.().then(state => {
            pin.textContent = state.pinned ? '已固定' : '固定';
            pin.setAttribute('aria-pressed', String(state.pinned));
        });

        relabelNavigation();
        createViewHeader();
        window.addEventListener('productivity:viewchange', event => updateViewHeader(event.detail?.view));
        setInterval(() => {
            const clock = document.querySelector('.desktop-widget-clock');
            if (clock) clock.textContent = formatClock();
        }, 30_000);

        const preferredView = params.get('view') || 'quadrant';
        const showPreferredView = () => window.switchView?.(preferredView);
        updateViewHeader(preferredView);
        requestAnimationFrame(showPreferredView);
        window.addEventListener('load', () => setTimeout(showPreferredView, 120), { once: true });
        setTimeout(showPreferredView, 700);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
