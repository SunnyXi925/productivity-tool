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

    function init() {
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
        setInterval(() => {
            const clock = document.querySelector('.desktop-widget-clock');
            if (clock) clock.textContent = formatClock();
        }, 30_000);

        const showPreferredView = () => window.switchView?.(params.get('view') || 'quadrant');
        requestAnimationFrame(showPreferredView);
        window.addEventListener('load', () => setTimeout(showPreferredView, 120), { once: true });
        setTimeout(showPreferredView, 700);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
