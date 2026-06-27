(() => {
	const storage = {
		lang: 'keylun.lang',
		theme: 'keylun.theme',
		hue: 'keylun.hue',
		wallpaper: 'keylun.wallpaper',
		musicOpen: 'keylun.music.open',
	};

	const i18n = {
		zh: {
			'nav.home': '首页',
			'nav.archive': '归档',
			'nav.exhibition': '展示',
			'nav.tags': '标签',
			'nav.about': '关于',
			'nav.admin': '管理',
			'settings.language': '选择语言 / Select Language',
			'settings.color': '主题色',
			'settings.theme': '主题',
			'settings.light': '浅色',
			'settings.dark': '深色',
			'settings.system': '系统',
			'settings.banner': '横幅',
			'home.eyebrow': 'Keylun 的个人博客',
			'home.title': '算法的世界是美丽的',
			'home.description': '你好哇，欢迎来到我的博客。这里记录我的点点滴滴，也沉淀算法、AI4CO、竞赛和项目复盘。',
			'home.read': '阅读文章',
			'home.more': '了解更多',
			'home.latest': '最新文章',
			'home.allPosts': '全部文章',
			'side.announcement': '公告',
			'side.announcementText': '欢迎来到我的博客。',
			'side.categories': '分类',
			'side.tags': '标签',
			'side.statistics': '统计',
			'side.education': '教育经历',
			'page.archive': '文章归档',
			'page.archiveDesc': '按时间整理算法、论文、课程和项目笔记。',
			'page.tags': '标签',
			'page.tagsDesc': '按主题快速找到算法、论文、项目和站点记录。',
			'page.projects': '展示',
			'page.projectsDesc': '这里记录项目、实验和阶段性成果。',
			'page.about': '关于我',
			'about.focus': '当前关注',
			'about.education': '教育经历',
			'about.contact': '联系方式',
			'music.title': '深海之息',
			'music.artist': 'Youzee Music',
			'post.updated': '最后更新于',
			'post.words': '字',
			'post.minute': '分钟',
		},
		en: {
			'nav.home': 'Home',
			'nav.archive': 'Archive',
			'nav.exhibition': 'Exhibition',
			'nav.tags': 'Tags',
			'nav.about': 'About',
			'nav.admin': 'Admin',
			'settings.language': 'Select Language',
			'settings.color': 'Theme Color',
			'settings.theme': 'Theme',
			'settings.light': 'Light',
			'settings.dark': 'Dark',
			'settings.system': 'System',
			'settings.banner': 'Banner',
			'home.eyebrow': "Keylun's Blog",
			'home.title': 'The World of Algorithms Is Beautiful',
			'home.description': 'Hi, welcome to my blog. I write about algorithms, AI4CO, contests, projects, and the small steps along the way.',
			'home.read': 'Read Posts',
			'home.more': 'Learn More',
			'home.latest': 'Latest Posts',
			'home.allPosts': 'All Posts',
			'side.announcement': 'Announcement',
			'side.announcementText': 'Welcome to my blog!',
			'side.categories': 'Categories',
			'side.tags': 'Tags',
			'side.statistics': 'Statistics',
			'side.education': 'Education',
			'page.archive': 'Archive',
			'page.archiveDesc': 'Notes on algorithms, papers, courses, and projects, organized by time.',
			'page.tags': 'Tags',
			'page.tagsDesc': 'Find algorithm, paper, project, and site notes by topic.',
			'page.projects': 'Exhibition',
			'page.projectsDesc': 'Projects, experiments, and milestones live here.',
			'page.about': 'About Me',
			'about.focus': 'Current Focus',
			'about.education': 'Education',
			'about.contact': 'Contact',
			'music.title': 'Breath of the Deep Sea',
			'music.artist': 'Youzee Music',
			'post.updated': 'Last updated on',
			'post.words': 'words',
			'post.minute': 'minute',
		},
	};

	const profileText = {
		zh: {
			tagline: 'Keep thinking\nKeep critical thinking',
			about: '我是 UESTC 25 级的一名本科生。\n我喜欢钻研算法方面的技术，同时也对 AI4CO 具有浓厚兴趣。\n我于大一下学期初加入算法工程小组，隶属于学校的 Algorithm and Logic Group。\n未来希望能够参与到 AI Agent、具身智能等方向的顶层优化工作。',
			contact: '我的 Gmail 邮箱：yexinnan20070127@gmail.com\n\n我的 GitHub 页面：https://github.com/KEYLUNdhdh',
		},
		en: {
			tagline: 'Keep thinking\nKeep critical thinking',
			about: "I am an undergraduate student at UESTC, class of 2025.\nI enjoy studying algorithms and have a strong interest in AI4CO.\nI joined the algorithm engineering group in my second semester, affiliated with the Algorithm and Logic Group.\nIn the future, I hope to work on high-level optimization for AI agents and embodied intelligence.",
			contact: 'Gmail: yexinnan20070127@gmail.com\n\nGitHub: https://github.com/KEYLUNdhdh',
		},
	};

	function applyLang(lang) {
		const dict = i18n[lang] || i18n.zh;
		document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
		document.querySelectorAll('[data-i18n]').forEach((node) => {
			const key = node.getAttribute('data-i18n');
			if (key && dict[key]) node.textContent = dict[key];
		});
		document.querySelectorAll('[data-profile-i18n]').forEach((node) => {
			const key = node.getAttribute('data-profile-i18n');
			const value = profileText[lang]?.[key];
			if (value) node.textContent = value;
		});
		document.querySelectorAll('[data-lang-choice]').forEach((button) => {
			button.classList.toggle('active', button.dataset.langChoice === lang);
		});
		localStorage.setItem(storage.lang, lang);
	}

	function applyTheme(theme) {
		const resolved = theme === 'system'
			? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
			: theme;
		document.documentElement.dataset.theme = resolved;
		document.querySelectorAll('[data-theme-choice]').forEach((button) => {
			button.classList.toggle('active', button.dataset.themeChoice === theme);
		});
		localStorage.setItem(storage.theme, theme);
	}

	function applyHue(hue) {
		document.documentElement.style.setProperty('--hue', hue);
		document.querySelectorAll('[data-hue-control]').forEach((input) => {
			input.value = hue;
		});
		localStorage.setItem(storage.hue, hue);
	}

	function applyWallpaper(mode) {
		document.documentElement.dataset.wallpaper = mode;
		document.querySelectorAll('[data-wallpaper-choice]').forEach((button) => {
			button.classList.toggle('active', button.dataset.wallpaperChoice === mode);
		});
		localStorage.setItem(storage.wallpaper, mode);
	}

	function initPanels() {
		document.querySelectorAll('[data-panel-toggle]').forEach((button) => {
			button.addEventListener('click', () => {
				const id = button.getAttribute('data-panel-toggle');
				document.querySelectorAll('.menu-panel').forEach((panel) => {
					if (panel.id === id) panel.hidden = !panel.hidden;
					else panel.hidden = true;
				});
			});
		});
		document.addEventListener('click', (event) => {
			if (!event.target.closest('.dropdown')) {
				document.querySelectorAll('.menu-panel').forEach((panel) => panel.hidden = true);
			}
		});
	}

	function initMusic() {
		const player = document.querySelector('[data-music-player]');
		if (!player) return;
		const audio = player.querySelector('[data-music-audio]');
		const play = player.querySelector('[data-music-play]');
		const progress = player.querySelector('[data-music-progress] span');
		const progressBar = player.querySelector('[data-music-progress]');
		const time = player.querySelector('[data-music-time]');
		const expand = player.querySelector('[data-music-expand]');
		const collapse = player.querySelector('[data-music-collapse]');
		const restart = player.querySelector('[data-music-restart]');

		const format = (seconds) => {
			if (!Number.isFinite(seconds)) return '0:00';
			const min = Math.floor(seconds / 60);
			const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
			return `${min}:${sec}`;
		};
		const update = () => {
			const duration = audio.duration || 0;
			const percent = duration ? (audio.currentTime / duration) * 100 : 0;
			progress.style.width = `${percent}%`;
			time.textContent = `${format(audio.currentTime)} / ${format(duration)}`;
		};
		const setOpen = (open) => {
			player.classList.toggle('collapsed', !open);
			player.classList.toggle('expanded', open);
			localStorage.setItem(storage.musicOpen, open ? '1' : '0');
		};
		expand.addEventListener('click', () => setOpen(true));
		collapse.addEventListener('click', () => setOpen(false));
		play.addEventListener('click', async () => {
			if (audio.paused) {
				await audio.play().catch(() => {});
			} else {
				audio.pause();
			}
		});
		restart.addEventListener('click', () => {
			audio.currentTime = 0;
			audio.play().catch(() => {});
		});
		progressBar.addEventListener('click', (event) => {
			const rect = progressBar.getBoundingClientRect();
			const percent = (event.clientX - rect.left) / rect.width;
			audio.currentTime = percent * (audio.duration || 0);
		});
		audio.addEventListener('play', () => {
			play.textContent = 'Ⅱ';
			player.classList.add('is-playing');
		});
		audio.addEventListener('pause', () => {
			play.textContent = '▶';
			player.classList.remove('is-playing');
		});
		audio.addEventListener('timeupdate', update);
		audio.addEventListener('loadedmetadata', update);
		setOpen(localStorage.getItem(storage.musicOpen) === '1');
	}

	function init() {
		const lang = localStorage.getItem(storage.lang) || 'zh';
		const theme = localStorage.getItem(storage.theme) || 'system';
		const hue = localStorage.getItem(storage.hue) || '195';
		const wallpaper = localStorage.getItem(storage.wallpaper) || 'banner';
		applyLang(lang);
		applyTheme(theme);
		applyHue(hue);
		applyWallpaper(wallpaper);
		initPanels();
		initMusic();
		document.querySelectorAll('[data-lang-choice]').forEach((button) => {
			button.addEventListener('click', () => applyLang(button.dataset.langChoice));
		});
		document.querySelectorAll('[data-theme-choice]').forEach((button) => {
			button.addEventListener('click', () => applyTheme(button.dataset.themeChoice));
		});
		document.querySelectorAll('[data-wallpaper-choice]').forEach((button) => {
			button.addEventListener('click', () => applyWallpaper(button.dataset.wallpaperChoice));
		});
		document.querySelectorAll('[data-hue-control]').forEach((input) => {
			input.addEventListener('input', () => applyHue(input.value));
		});
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
