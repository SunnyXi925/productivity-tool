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
        'more-features': { title: '工具', subtitle: '四种节奏，随取随用' },
        fortune: { title: '每日一签', subtitle: '为今天留一句提醒', child: true },
        pomodoro: { title: '番茄专注', subtitle: '把注意力留在当下', child: true },
        'habit-tracker': { title: '习惯打卡', subtitle: '让行动留下连续记录', child: true, action: ['+', '添加习惯', 'ht-addHabitBtn'] },
        'time-tracker': { title: '时间记录', subtitle: '看见时间去了哪里', child: true, action: ['+', '添加时间记录', 'add-time-record-btn'] }
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
            'dashboard-view',
            'review-view',
            'templates-view'
        ].forEach(id => {
            const view = document.getElementById(id);
            if (view && view.parentElement !== main) main.appendChild(view);
        });
    }

    function refineWidgetTypography(root = document) {
        const emojiPattern = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
        const isElement = root.nodeType === Node.ELEMENT_NODE;
        const targets = isElement && root.closest?.('.view:not(#quadrant-view)')
            ? [root]
            : Array.from(root.querySelectorAll?.('.view:not(#quadrant-view)') || []);

        const materialIcons = [
            ...(root.matches?.('.material-icons') ? [root] : []),
            ...Array.from(root.querySelectorAll?.('.material-icons') || [])
        ];
        materialIcons.forEach(icon => {
            const iconName = icon.textContent.trim();
            if (iconName && !icon.dataset.icon) icon.dataset.icon = iconName;
            if (icon.textContent) icon.replaceChildren();
            icon.setAttribute('aria-hidden', 'true');
        });

        targets.forEach(target => {
            const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
            const textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);
            textNodes.forEach(node => {
                const parent = node.parentElement;
                if (!parent || parent.closest('svg, script, style, .material-icons')) return;
                const refined = node.textContent.replace(emojiPattern, '').replace(/\s{2,}/g, ' ');
                if (refined !== node.textContent) node.textContent = refined;
            });
        });

        document.querySelectorAll('#review-view .mood-btn').forEach((item, index) => {
            const label = String(index + 1);
            if (item.textContent !== label) item.textContent = label;
        });
        document.querySelectorAll('#review-view .rating-stars .star').forEach(item => {
            if (item.textContent !== '·') item.textContent = '·';
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

        document.querySelector('.container > main')?.scrollTo({ top: 0, behavior: 'instant' });
    }

    function init() {
        document.getElementById('calendar-pro-view')?.remove();
        document.querySelectorAll('#countdown-feature-card, #calendar-feature-card').forEach(node => node.remove());
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

        const place = button('桌面', 'desktop-widget-place');
        place.title = '移到主屏幕左侧';
        place.addEventListener('click', async () => {
            await window.desktopWidget?.placeOnDesktop?.();
        });

        const collapse = button('—', 'desktop-widget-collapse');
        collapse.title = '折叠小组件';
        collapse.setAttribute('aria-label', '折叠小组件');
        const updateCollapsedState = collapsed => {
            document.body.classList.toggle('widget-collapsed', collapsed);
            collapse.textContent = collapsed ? '+' : '—';
            collapse.title = collapsed ? '展开小组件' : '折叠小组件';
            collapse.setAttribute('aria-label', collapse.title);
        };
        collapse.addEventListener('click', async () => {
            const collapsed = await window.desktopWidget?.toggleCollapse?.();
            if (typeof collapsed === 'boolean') updateCollapsedState(collapsed);
        });
        controls.append(ai, place, collapse);
        bar.append(dragArea, controls);
        document.body.prepend(bar);

        window.desktopWidget?.getState?.().then(state => {
            updateCollapsedState(Boolean(state.collapsed));
        });
        window.desktopWidget?.onStateChanged?.(state => updateCollapsedState(Boolean(state.collapsed)));

        relabelNavigation();
        createViewHeader();
        refineWidgetTypography();
        if (document.body) {
            new MutationObserver(records => {
                records.forEach(record => {
                    const candidates = record.addedNodes.length
                        ? Array.from(record.addedNodes)
                        : [record.target];
                    candidates.forEach(node => {
                        const target = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
                        if (!target) return;
                        refineWidgetTypography(target);
                    });
                });
            }).observe(document.body, { childList: true, characterData: true, subtree: true });
        }
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
