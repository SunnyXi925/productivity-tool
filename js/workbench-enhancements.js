(function () {
    'use strict';

    const AI_ENDPOINT = 'https://uni-api.cstcloud.cn/v1';
    const AI_SERVICE_ID = 'cstcloud';

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function icon(name) {
        const node = element('span', 'material-icons', name);
        node.setAttribute('aria-hidden', 'true');
        return node;
    }

    function actionButton(label, iconName, className) {
        const button = element('button', `workbench-action ${className || ''}`.trim());
        button.type = 'button';
        button.append(icon(iconName), element('span', '', label));
        return button;
    }

    function getTasks() {
        return Array.isArray(window.XXSGAppRuntime?.tasks) ? window.XXSGAppRuntime.tasks : [];
    }

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 6) return '夜深了，只留下一件必须完成的事。';
        if (hour < 12) return '早上好，先完成一件真正重要的事。';
        if (hour < 18) return '下午好，把注意力带回最重要的事。';
        return '晚上好，收好今天，也为明天留出余地。';
    }

    function createCompass() {
        const compass = element('div', 'action-compass');
        compass.setAttribute('aria-label', '四象限任务概览');
        const definitions = [
            ['q1', '立即行动', '重要且紧急'],
            ['q2', '安排时间', '重要不紧急'],
            ['q3', '减少干扰', '紧急不重要'],
            ['q4', '有意放下', '不重要不紧急']
        ];
        definitions.forEach(([id, verb, title]) => {
            const cell = element('button', `compass-sector compass-${id}`);
            cell.type = 'button';
            cell.dataset.priority = id.slice(1);
            cell.setAttribute('aria-label', `${title}，查看四象限`);
            const count = element('strong', 'compass-count', '0');
            count.id = `workbench-${id}-count`;
            cell.append(element('small', '', verb), count, element('span', '', title));
            cell.addEventListener('click', () => window.switchView?.('quadrant'));
            compass.appendChild(cell);
        });
        const center = element('div', 'compass-center', '今');
        center.setAttribute('aria-hidden', 'true');
        compass.appendChild(center);
        return compass;
    }

    function createOverview() {
        const section = element('section', 'workbench-overview');
        section.setAttribute('aria-labelledby', 'workbench-greeting');

        const intro = element('div', 'workbench-intro');
        const kicker = element('div', 'workbench-kicker');
        kicker.append(element('span', 'status-pulse'), document.createTextNode(' 本机行动台'));
        const heading = element('h1', '', getGreeting());
        heading.id = 'workbench-greeting';
        const description = element('p', '', '所有任务保存在当前浏览器。判断轻重缓急，然后开始。');
        const actions = element('div', 'workbench-actions');
        const add = actionButton('新建任务', 'add', 'primary');
        const search = actionButton('搜索', 'search');
        const ai = actionButton('AI 设置', 'auto_awesome');
        add.id = 'workbench-add-task';
        search.id = 'workbench-search';
        ai.id = 'workbench-ai-settings';
        actions.append(add, search, ai);
        intro.append(kicker, heading, description, actions);

        const decision = element('div', 'workbench-decision');
        const decisionLabel = element('div', 'decision-label', '建议下一步');
        const nextTask = element('strong', 'decision-task', '先添加一项任务');
        nextTask.id = 'workbench-next-task';
        const meta = element('div', 'decision-meta');
        const openCount = element('span', '', '0 项待处理');
        openCount.id = 'workbench-open-count';
        const completion = element('span', '', '完成率 0%');
        completion.id = 'workbench-completion';
        meta.append(openCount, completion);
        decision.append(decisionLabel, nextTask, meta);

        const visual = element('div', 'workbench-visual');
        visual.append(createCompass(), decision);
        section.append(intro, visual);
        return section;
    }

    function createField(labelText, input) {
        const label = element('label', 'local-ai-field');
        label.append(element('span', '', labelText), input);
        return label;
    }

    function createAISettings() {
        const overlay = element('div', 'local-ai-overlay');
        overlay.id = 'local-ai-overlay';
        overlay.hidden = true;

        const dialog = element('section', 'local-ai-dialog');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'local-ai-title');

        const header = element('header', 'local-ai-header');
        const titleWrap = element('div');
        titleWrap.append(element('div', 'workbench-kicker', '本机 AI 配置'));
        const title = element('h2', '', '连接 CSTCloud Uni-API');
        title.id = 'local-ai-title';
        titleWrap.appendChild(title);
        const close = actionButton('关闭', 'close', 'icon-only');
        close.id = 'local-ai-close';
        close.setAttribute('aria-label', '关闭 AI 设置');
        header.append(titleWrap, close);

        const note = element('p', 'local-ai-note', 'API Key 仅加密保存在当前浏览器。调用 AI 时，请求会直接发送到 CSTCloud。');
        const endpoint = document.createElement('input');
        endpoint.type = 'url';
        endpoint.value = AI_ENDPOINT;
        endpoint.readOnly = true;
        endpoint.id = 'local-ai-endpoint';
        const model = document.createElement('input');
        model.type = 'text';
        model.value = 'deepseek-v3';
        model.placeholder = '例如 deepseek-v3';
        model.id = 'local-ai-model';
        model.autocomplete = 'off';
        const apiKey = document.createElement('input');
        apiKey.type = 'password';
        apiKey.placeholder = '输入 API Key';
        apiKey.id = 'local-ai-key';
        apiKey.autocomplete = 'new-password';

        const status = element('div', 'local-ai-status', '尚未配置');
        status.id = 'local-ai-status';
        status.setAttribute('role', 'status');
        const footer = element('footer', 'local-ai-footer');
        const save = actionButton('保存设置', 'check', 'primary');
        save.id = 'local-ai-save';
        footer.append(status, save);

        dialog.append(
            header,
            note,
            createField('接口地址', endpoint),
            createField('模型名称', model),
            createField('API Key', apiKey),
            footer
        );
        overlay.appendChild(dialog);
        return overlay;
    }

    function updateOverview() {
        const tasks = getTasks();
        const incomplete = tasks.filter(task => !task.completed);
        const completed = tasks.length - incomplete.length;
        const priorityCounts = [1, 2, 3, 4].map(priority =>
            incomplete.filter(task => Number(task.priority) === priority).length
        );

        priorityCounts.forEach((count, index) => {
            const target = document.getElementById(`workbench-q${index + 1}-count`);
            if (target) target.textContent = String(count);
        });

        const next = incomplete.find(task => Number(task.priority) === 1)
            || incomplete.find(task => Number(task.priority) === 2)
            || incomplete[0];
        const nextTarget = document.getElementById('workbench-next-task');
        const openTarget = document.getElementById('workbench-open-count');
        const completionTarget = document.getElementById('workbench-completion');
        if (nextTarget) nextTarget.textContent = next?.title || '先添加一项任务';
        if (openTarget) openTarget.textContent = `${incomplete.length} 项待处理`;
        if (completionTarget) {
            const rate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
            completionTarget.textContent = `完成率 ${rate}%`;
        }
    }

    async function readAIConfig() {
        let config = null;
        if (window.secureStorage) {
            await window.secureStorage.ready();
            config = await window.secureStorage.getSecure('aiConfig');
        }
        const service = config?.[AI_SERVICE_ID];
        const modelInput = document.getElementById('local-ai-model');
        const keyInput = document.getElementById('local-ai-key');
        const status = document.getElementById('local-ai-status');
        if (modelInput) modelInput.value = service?.model || 'deepseek-v3';
        if (keyInput) {
            keyInput.value = '';
            keyInput.placeholder = service?.apiKey ? '已配置；留空则保持不变' : '输入 API Key';
        }
        if (status) status.textContent = service?.apiKey ? '已配置，可直接使用 AI 功能' : '尚未配置';
    }

    function openAISettings() {
        const overlay = document.getElementById('local-ai-overlay');
        if (!overlay) return;
        overlay.hidden = false;
        document.body.classList.add('modal-open');
        readAIConfig().finally(() => document.getElementById('local-ai-model')?.focus());
    }

    function closeAISettings() {
        const overlay = document.getElementById('local-ai-overlay');
        if (!overlay) return;
        overlay.hidden = true;
        document.body.classList.remove('modal-open');
        document.getElementById('workbench-ai-settings')?.focus();
    }

    async function saveAISettings() {
        const keyInput = document.getElementById('local-ai-key');
        const modelInput = document.getElementById('local-ai-model');
        const status = document.getElementById('local-ai-status');
        const button = document.getElementById('local-ai-save');
        const model = modelInput?.value.trim();
        const newKey = keyInput?.value.trim();
        if (!model) {
            if (status) status.textContent = '请填写模型名称';
            modelInput?.focus();
            return;
        }

        if (button) button.disabled = true;
        if (status) status.textContent = '正在保存…';
        try {
            await window.secureStorage?.ready();
            const existing = await window.secureStorage?.getSecure('aiConfig') || {};
            const existingKey = existing?.[AI_SERVICE_ID]?.apiKey || null;
            const apiKey = newKey || existingKey;
            if (!apiKey) throw new Error('请填写 API Key');
            const config = {
                ...existing,
                currentService: AI_SERVICE_ID,
                [AI_SERVICE_ID]: { enabled: true, apiKey, model }
            };
            await window.secureStorage.setSecure('aiConfig', config);
            window.DataSyncStorage?.setRaw('aiFortuneEnabled', 'true');
            const manager = window.aiServiceManager;
            if (manager?._services?.[AI_SERVICE_ID]) {
                manager._services[AI_SERVICE_ID].apiKey = apiKey;
                manager._services[AI_SERVICE_ID].model = model;
                manager._services[AI_SERVICE_ID].enabled = true;
                manager.currentService = AI_SERVICE_ID;
            }
            if (keyInput) {
                keyInput.value = '';
                keyInput.placeholder = '已配置；留空则保持不变';
            }
            if (status) status.textContent = '已保存到当前浏览器';
            window.fortuneSystem?.loadAISettings?.();
        } catch (error) {
            if (status) status.textContent = error.message || '保存失败，请重试';
        } finally {
            if (button) button.disabled = false;
        }
    }

    function mountHeaderControls() {
        const controls = document.querySelector('.header-controls');
        if (!controls || document.getElementById('local-mode-badge')) return;
        const badge = actionButton('本机数据', 'lock', 'local-mode-badge');
        badge.id = 'local-mode-badge';
        badge.title = '任务数据只保存在当前浏览器';
        const settings = actionButton('AI 设置', 'auto_awesome', 'header-ai-button');
        settings.id = 'header-ai-settings';
        settings.addEventListener('click', openAISettings);
        controls.prepend(badge, settings);
    }

    function bindInteractions() {
        document.getElementById('workbench-add-task')?.addEventListener('click', () => {
            window.switchView?.('list');
            document.getElementById('initial-add-btn')?.click();
        });
        document.getElementById('workbench-search')?.addEventListener('click', () => window.showSearchDialog?.());
        document.getElementById('workbench-ai-settings')?.addEventListener('click', openAISettings);
        document.getElementById('local-ai-close')?.addEventListener('click', closeAISettings);
        document.getElementById('local-ai-save')?.addEventListener('click', saveAISettings);
        document.getElementById('local-ai-overlay')?.addEventListener('click', event => {
            if (event.target.id === 'local-ai-overlay') closeAISettings();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !document.getElementById('local-ai-overlay')?.hidden) closeAISettings();
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                window.showSearchDialog?.();
            }
        });
    }

    function applyLaunchAction() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'add-task') {
            window.switchView?.('list');
            document.getElementById('initial-add-btn')?.click();
        } else if (params.get('view') === 'quadrant') {
            window.switchView?.('quadrant');
        }
    }

    function init() {
        document.body.classList.add('local-workspace');
        const header = document.querySelector('.container > header');
        const main = document.querySelector('.container > main');
        if (header && main && !document.querySelector('.workbench-overview')) {
            main.before(createOverview());
        }
        document.body.appendChild(createAISettings());
        mountHeaderControls();
        bindInteractions();
        updateOverview();
        applyLaunchAction();

        const taskList = document.getElementById('task-list');
        if (taskList) new MutationObserver(updateOverview).observe(taskList, { childList: true, subtree: true });
        window.addEventListener('storage', updateOverview);
        window.addEventListener('dataImported', updateOverview);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
