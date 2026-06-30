import { NAVBAR_HEIGHT, NAVBAR_GAP } from "@constants/constants";
import { widgetManager } from "@utils/widget";


export class TableOfContents extends HTMLElement {
    tocEl: HTMLElement | null = null;
    visibleClass = "visible";
    observer: IntersectionObserver;
    anchorNavTarget: HTMLElement | null = null;
    headingIdxMap = new Map<string, number>();
    headings: HTMLElement[] = [];
    tocEntries: HTMLAnchorElement[] = [];
    active: boolean[] = [];
    activeIndicator: HTMLElement | null = null;
    _retryCount = 0;
    _backToTopObserver: MutationObserver | null = null;
    _scrollRaf = 0;

    _handleBtnClick = (e: Event) => {
        e.stopPropagation();
        const panel = this.querySelector('.toc-floating-panel');
        const isHidden = panel?.classList.contains('hidden') || panel?.classList.contains('opacity-0');
        this.toggleFloatingPanel(!!isHidden);
    };

    _handleDocClick = (e: Event) => {
        const panel = this.querySelector('.toc-floating-panel');
        if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target as Node)) {
            this.toggleFloatingPanel(false);
        }
    };

    constructor() {
        super();
        this.observer = new IntersectionObserver(this.markVisibleSection);
    };

    markActiveHeading = (idx: number)=> {
        this.active = new Array(this.headings.length).fill(false);
        this.active[idx] = true;
    };

    getVisibleTocEntry(entry: HTMLAnchorElement) {
        let node = entry.closest<HTMLElement>(".toc-node");
        while (node) {
            const parent = node.parentElement?.closest<HTMLElement>(".toc-node");
            if (parent?.classList.contains("toc-collapsed")) {
                return parent.querySelector<HTMLAnchorElement>(":scope > .toc-row .toc-link") || entry;
            }
            node = parent || null;
        }
        return entry;
    }

    isInRange(value: number, min: number, max: number) {
        return min < value && value < max;
    };

    fallback = () => {
        if (!this.headings.length) return;

        let activeIdx = -1;
        for (let i = 0; i < this.headings.length; i++) {
            const heading = this.headings[i];
            const rect = heading.getBoundingClientRect();
            if (rect.top < 100) {
                activeIdx = i;
            } else {
                break;
            }
        }
        if (activeIdx === -1) {
            activeIdx = 0;
        }
        this.markActiveHeading(activeIdx);
    };

    toggleActiveHeading = () => {
        const visibleEntries = new Set<HTMLAnchorElement>();

        for (let i = 0; i < this.active.length; i++) {
            if (this.active[i]) {
                visibleEntries.add(this.getVisibleTocEntry(this.tocEntries[i]));
            }
        }

        this.tocEntries.forEach((entry) => {
            entry.classList.toggle(this.visibleClass, visibleEntries.has(entry));
        });

        const visibleActiveEntries = Array.from(visibleEntries)
            .filter((entry) => entry.offsetParent !== null)
            .sort((a, b) => a.offsetTop - b.offsetTop);

        if (!visibleActiveEntries.length) {
            this.activeIndicator?.setAttribute("style", `opacity: 0`);
        } else {
            const top = visibleActiveEntries[0].offsetTop;
            const last = visibleActiveEntries[visibleActiveEntries.length - 1];
            const bottom = last.offsetTop + last.offsetHeight;
            this.activeIndicator?.setAttribute("style", `top: ${top}px; height: ${bottom - top}px; opacity: 1`);
        }
    };

    scrollToActiveHeading = () => {
        if (this.anchorNavTarget || !this.tocEl) return;
        const activeHeading = this.querySelectorAll<HTMLDivElement>(`.${this.visibleClass}`);
        if (!activeHeading.length) return;

        const topmost = activeHeading[0];
        const bottommost = activeHeading[activeHeading.length - 1];
        const tocHeight = this.tocEl.clientHeight;

        let top;
        if (bottommost.getBoundingClientRect().bottom -
            topmost.getBoundingClientRect().top < 0.9 * tocHeight)
            top = topmost.offsetTop - 32;
        else
            top = bottommost.offsetTop - tocHeight * 0.8;

        this.tocEl.scrollTo({
            top,
            left: 0,
            behavior: "smooth",
        });
    };

    update = () => {
        requestAnimationFrame(() => {
            this.toggleActiveHeading();
            this.scrollToActiveHeading();
        });
    };

    updateActiveFromScroll = () => {
        if (!this.headings.length) return;

        const navbarHeight = parseInt(this.dataset.navbarHeight || NAVBAR_HEIGHT.toString());
        const threshold = navbarHeight + NAVBAR_GAP * 16 + 80;
        let activeIdx = 0;

        for (let i = 0; i < this.headings.length; i++) {
            if (this.headings[i].getBoundingClientRect().top <= threshold) {
                activeIdx = i;
            } else {
                break;
            }
        }

        this.markActiveHeading(activeIdx);
        this.update();
    };

    _handleScroll = () => {
        if (this._scrollRaf) return;
        this._scrollRaf = requestAnimationFrame(() => {
            this._scrollRaf = 0;
            this.updateActiveFromScroll();
        });
    };

    markVisibleSection = (entries: IntersectionObserverEntry[]) => {
        if (entries.some((entry) => entry.isIntersecting && this.anchorNavTarget == entry.target)) {
            this.anchorNavTarget = null;
        }
        this.updateActiveFromScroll();
    };

    handleAnchorClick = (event: Event) => {
        const toggle = event
            .composedPath()
            .find((element) => element instanceof HTMLButtonElement && element.dataset.tocToggle !== undefined) as HTMLButtonElement | undefined;

        if (toggle) {
            event.preventDefault();
            event.stopPropagation();
            const node = toggle.closest<HTMLElement>(".toc-node");
            if (!node) return;
            const collapsed = node.classList.toggle("toc-collapsed");
            toggle.setAttribute("aria-expanded", String(!collapsed));
            return;
        }

        const anchor = event
            .composedPath()
            .find((element) => element instanceof HTMLAnchorElement);

        if (anchor) {
            event.preventDefault();
            const id = decodeURIComponent(anchor.hash?.substring(1));
            const targetElement = document.getElementById(id);
            if (targetElement) {
                const navbarHeight = parseInt(this.dataset.navbarHeight || NAVBAR_HEIGHT.toString());
                const gap = NAVBAR_GAP * 16; // Convert rem to px
                const targetTop = targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight - gap;
                window.scrollTo({
                    top: targetTop,
                    behavior: "smooth"
                });
            }
            const idx = this.headingIdxMap.get(id);
            if (idx !== undefined) {
                this.anchorNavTarget = this.headings[idx];
            } else {
                this.anchorNavTarget = null;
            }
            // If floating, close the panel after click
            if (this.dataset.isFloating === "true") {
                this.toggleFloatingPanel(false);
            }
        }
    };

    isPostPage() {
        return window.location.pathname.includes('/posts/') ||
               document.querySelector('.custom-md, .markdown-content') !== null;
    }

    escapeHtml(value: string) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    buildHeadingTree(headings: any[]) {
        const roots: any[] = [];
        const stack: any[] = [];

        headings.forEach((heading, index) => {
            const node = { ...heading, index, children: [] as any[] };
            while (stack.length && stack[stack.length - 1].depth >= node.depth) {
                stack.pop();
            }

            if (stack.length) {
                stack[stack.length - 1].children.push(node);
            } else {
                roots.push(node);
            }
            stack.push(node);
        });

        return roots;
    }

    renderHeadingTree(nodes: any[], minDepth: number, heading1Counter: { value: number }) {
        return `<div class="toc-tree">${nodes.map(node => {
            const relativeDepth = Math.max(0, node.depth - minDepth);
            const hasChildren = node.children.length > 0;
            const depthClass = relativeDepth === 0 ? "" : relativeDepth === 1 ? "ml-1" : "ml-2";
            const textToneClass = relativeDepth <= 1 ? "text-50" : "text-30";
            const badgeContent = relativeDepth === 0 ? (heading1Counter.value++) :
                relativeDepth === 1 ? '<div class="transition w-2 h-2 rounded-[0.1875rem] bg-(--toc-badge-bg)"></div>' :
                '<div class="transition w-1.5 h-1.5 rounded-xs bg-black/5 dark:bg-white/10"></div>';
            const badgeClass = relativeDepth === 0 ? "bg-(--toc-badge-bg) text-(--btn-content)" : "";
            const collapsedClass = hasChildren ? " toc-collapsed" : "";
            const escapedText = this.escapeHtml(node.text);

            return `<div class="toc-node ${hasChildren ? "toc-has-children" : ""}${collapsedClass}" data-toc-index="${node.index}">
                <div class="toc-row">
                    <button type="button" class="toc-toggle btn-plain" data-toc-toggle aria-label="折叠或展开 ${escapedText}" aria-expanded="${collapsedClass ? "false" : "true"}">
                        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <a href="#${this.escapeHtml(node.slug)}" class="toc-link px-2 flex gap-2 relative transition w-full min-h-9 rounded-xl hover:bg-(--toc-btn-hover) active:bg-(--toc-btn-active) py-2">
                        <div class="transition w-5 h-5 shrink-0 rounded-lg text-xs flex items-center justify-center font-bold ${depthClass} ${badgeClass}">
                            ${badgeContent}
                        </div>
                        <div class="transition text-sm ${textToneClass} truncate">${escapedText}</div>
                    </a>
                </div>
                ${hasChildren ? `<div class="toc-children">${this.renderHeadingTree(node.children, minDepth, heading1Counter)}</div>` : ""}
            </div>`;
        }).join("")}</div>`;
    }

    updateFloatingPosition = () => {
        if (this.dataset.isFloating !== "true") return;
        const container = this.querySelector('.toc-floating-container') as HTMLElement;
        const backToTopBtn = document.getElementById('back-to-top-btn');
        if (!container || !backToTopBtn) return;

        if (backToTopBtn.classList.contains('hide')) {
            container.classList.remove('move-up');
        } else {
            container.classList.add('move-up');
        }
    }

    toggleFloatingPanel(show: boolean) {
        const panel = this.querySelector('.toc-floating-panel');
        if (!panel) return;
        if (show) {
            panel.classList.remove('hidden');
            requestAnimationFrame(() => {
                panel.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
            });
        } else {
            panel.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
            setTimeout(() => {
                panel.classList.add('hidden');
            }, 300);
        }
    }

    regenerateTOC() {
        const isFloating = this.dataset.isFloating === "true";
        const tocWrapper = isFloating
            ? this.querySelector('.toc-floating-container') as HTMLElement
            : this.closest('widget-layout') as HTMLElement;

        if (!tocWrapper) return false;

        const headings = widgetManager.getPageHeadings();
        if (headings.length === 0 && this.isPostPage() && this._retryCount < 3) {
            this._retryCount++;
            setTimeout(() => this.init(), 120);
            return false;
        }
        this._retryCount = 0;

        const isPost = this.isPostPage();

        if (headings.length === 0 && !isPost) {
            if (!tocWrapper.classList.contains('toc-hide')) {
                if (!isFloating) {
                    tocWrapper.style.maxHeight = tocWrapper.offsetHeight + 'px';
                    tocWrapper.offsetHeight;
                    tocWrapper.classList.add('toc-hide');
                    tocWrapper.style.maxHeight = '';
                } else {
                    tocWrapper.classList.add('toc-hide');
                }
            }
            return true;
        }

        if (tocWrapper.classList.contains('toc-hide')) {
            tocWrapper.classList.remove('toc-hide');
            if (!isFloating) {
                const targetHeight = tocWrapper.scrollHeight;
                tocWrapper.style.maxHeight = '0px';
                tocWrapper.offsetHeight;
                tocWrapper.style.maxHeight = targetHeight + 'px';
                setTimeout(() => {
                    if (!tocWrapper.classList.contains('toc-hide')) {
                        tocWrapper.style.maxHeight = '';
                    }
                }, 300);
            }
        }

        const minDepth = Math.min(...headings.map(h => h.depth));
        const maxLevel = parseInt(this.dataset.depth || '3');
        const filteredHeadings = headings.filter(heading => heading.depth < minDepth + maxLevel);
        const tocHTML = this.renderHeadingTree(
            this.buildHeadingTree(filteredHeadings),
            minDepth,
            { value: 1 },
        );

        const innerContent = this.querySelector('.toc-inner-content');
        if (innerContent) {
            innerContent.innerHTML = tocHTML + '<div class="active-indicator -z-10 absolute left-0 right-0 rounded-xl transition-all pointer-events-none bg-(--toc-btn-hover)" style="opacity: 0"></div>';
        }
        return true;
    }

    init() {
        this.observer.disconnect();
        this.headingIdxMap.clear();
        this.headings = [];
        this.active = [];

        if (!this.regenerateTOC()) return;

        this.tocEl?.removeEventListener("click", this.handleAnchorClick, true);
        this.tocEl =
            this.closest<HTMLElement>('.toc-scroll-container') ||
            this.querySelector<HTMLElement>('.toc-floating-panel') ||
            this;
        this.tocEl?.addEventListener("click", this.handleAnchorClick, { capture: true });

        this.activeIndicator = this.querySelector(".active-indicator");

        if (this.dataset.isFloating === "true") {
            const btn = this.querySelector('.toc-floating-btn');
            btn?.removeEventListener('click', this._handleBtnClick);
            btn?.addEventListener('click', this._handleBtnClick);

            document.removeEventListener('click', this._handleDocClick);
            document.addEventListener('click', this._handleDocClick);

            // 监听 backToTop 按钮的状态
            const backToTopBtn = document.getElementById('back-to-top-btn');
            if (backToTopBtn) {
                this._backToTopObserver?.disconnect();
                this._backToTopObserver = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            this.updateFloatingPosition();
                        }
                    });
                });
                this._backToTopObserver.observe(backToTopBtn, { attributes: true });
                this.updateFloatingPosition(); // 初始状态检查
            }
        }

        const allEntries = Array.from(this.querySelectorAll<HTMLAnchorElement>("a[href^='#']"));
        const validHeadings: HTMLElement[] = [];
        const validEntries: HTMLAnchorElement[] = [];

        for (let i = 0; i < allEntries.length; i++) {
            const entry = allEntries[i];
            const id = decodeURIComponent(entry.hash?.substring(1));
            const heading = document.getElementById(id);
            if (heading instanceof HTMLElement) {
                validHeadings.push(heading);
                validEntries.push(entry);
                this.headingIdxMap.set(id, validEntries.length - 1);
            }
        }

        this.headings = validHeadings;
        this.tocEntries = validEntries;
        this.active = new Array(this.tocEntries.length).fill(false);

        if (this.tocEntries.length === 0) return;

        this.headings.forEach((heading) => this.observer.observe(heading));
        window.removeEventListener("scroll", this._handleScroll);
        window.removeEventListener("resize", this._handleScroll);
        window.addEventListener("scroll", this._handleScroll, { passive: true });
        window.addEventListener("resize", this._handleScroll, { passive: true });
        this.updateActiveFromScroll();
    };

    connectedCallback() {
        const element = document.querySelector('.custom-md') || document.querySelector('.prose') || document.querySelector('.markdown-content');
        let initialized = false;
        const tryInit = () => {
            if (!initialized) {
                initialized = true;
                this.init();
            }
        };
        if (element) {
            element.addEventListener('animationend', tryInit, { once: true });
            setTimeout(tryInit, 300);
        } else {
            tryInit();
            setTimeout(tryInit, 300);
        }

        const setupSwup = () => {
            if (window.swup && window.swup.hooks) {
                if ((this as any)._swupListenersAdded) return;
                window.swup.hooks.on('visit:start', () => {
                    if (this.isPostPage()) {
                        const isFloating = this.dataset.isFloating === "true";
                        const tocWrapper = isFloating
                            ? this.querySelector('.toc-floating-container') as HTMLElement
                            : this.closest('widget-layout') as HTMLElement;
                        if (tocWrapper && !tocWrapper.classList.contains('toc-hide')) {
                            if (!isFloating) {
                                tocWrapper.style.maxHeight = tocWrapper.offsetHeight + 'px';
                                tocWrapper.offsetHeight;
                                tocWrapper.classList.add('toc-hide');
                                tocWrapper.style.maxHeight = '';
                            } else {
                                tocWrapper.classList.add('toc-hide');
                            }
                        }
                    }
                });
                window.swup.hooks.on('content:replace', () => {
                    const isFloating = this.dataset.isFloating === "true";
                    const tocWrapper = isFloating
                        ? this.querySelector('.toc-floating-container') as HTMLElement
                        : this.closest('widget-layout') as HTMLElement;
                    if (tocWrapper && !this.isPostPage()) {
                        tocWrapper.classList.add('toc-hide');
                        if (!isFloating) tocWrapper.style.maxHeight = '';
                    }
                    setTimeout(() => this.init(), 100);
                });
                (this as any)._swupListenersAdded = true;
            }
        };

        if (window.swup) setupSwup();
        else document.addEventListener('swup:enable', setupSwup);
        window.addEventListener('content-decrypted', () => this.init());
    };

    disconnectedCallback() {
        this.headings.forEach((heading) => this.observer.unobserve(heading));
        this.observer.disconnect();
        this._backToTopObserver?.disconnect();
        window.removeEventListener("scroll", this._handleScroll);
        window.removeEventListener("resize", this._handleScroll);
        if (this._scrollRaf) {
            cancelAnimationFrame(this._scrollRaf);
            this._scrollRaf = 0;
        }
        this.tocEl?.removeEventListener("click", this.handleAnchorClick);
        
        const btn = this.querySelector('.toc-floating-btn');
        btn?.removeEventListener('click', this._handleBtnClick);
        document.removeEventListener('click', this._handleDocClick);
    };
}

if (!customElements.get("table-of-contents")) {
    customElements.define("table-of-contents", TableOfContents);
}
