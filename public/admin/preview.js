(function () {
	function getCreateElement() {
		if (window.h) return window.h;
		if (window.React && window.React.createElement) return window.React.createElement;
		return null;
	}

	function toJS(value, fallback) {
		if (!value) return fallback;
		if (typeof value.toJS === 'function') return value.toJS();
		return value;
	}

	function getData(entry) {
		return toJS(entry.get('data'), {});
	}

	function register() {
		if (!window.CMS) {
			setTimeout(register, 100);
			return;
		}

		const h = getCreateElement();
		if (!h) {
			setTimeout(register, 100);
			return;
		}

		window.CMS.registerPreviewStyle('/admin/preview.css');

		const ProfilePreview = function ProfilePreview(props) {
			const data = getData(props.entry);
			const focus = Array.isArray(data.focus) ? data.focus : [];
			const education = Array.isArray(data.education) ? data.education : [];
			const links = Array.isArray(data.links) ? data.links : [];

			return h(
				'div',
				{ className: 'profile-preview' },
				h(
					'div',
					{ className: 'hero' },
					data.avatar ? h('img', { src: data.avatar, alt: data.name || 'avatar' }) : null,
					h(
						'div',
						null,
						h('h1', null, data.name || '未命名'),
						h('p', { className: 'multiline muted' }, data.tagline || ''),
						h('h2', null, data.heroTitle || ''),
						h('p', { className: 'multiline' }, data.heroDescription || ''),
					),
				),
				h(
					'section',
					null,
					h('h2', null, '关于页个人介绍'),
					h('p', { className: 'multiline' }, data.aboutIntro || ''),
				),
				h(
					'section',
					null,
					h('h2', null, '当前关注'),
					h(
						'ul',
						{ className: 'pill-list' },
						focus.map((item, index) => h('li', { key: index }, item)),
					),
				),
				h(
					'section',
					null,
					h('h2', null, '教育经历'),
					h(
						'div',
						{ className: 'education' },
						education.map((item, index) =>
							h(
								'article',
								{ className: 'edu-item', key: index },
								h('h3', null, item.school || ''),
								h('p', null, item.program || ''),
								h('p', { className: 'muted' }, item.time || ''),
								h('p', { className: 'multiline' }, item.detail || ''),
							),
						),
					),
				),
				h(
					'section',
					null,
					h('h2', null, '联系'),
					h('p', { className: 'multiline' }, data.contact || ''),
					h(
						'div',
						{ className: 'link-list' },
						links.map((link, index) =>
							h(
								'a',
								{ key: index, href: link.url || '#', target: '_blank', rel: 'noreferrer' },
								link.label || link.url || '链接',
							),
						),
					),
				),
			);
		};

		window.CMS.registerPreviewTemplate('settings', ProfilePreview);
	}

	register();
})();
