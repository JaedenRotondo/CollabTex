// LaTeX.js loader script
// This loads LaTeX.js from CDN and makes it available globally

(function () {
	const script = document.createElement('script');
	script.src = 'https://cdn.jsdelivr.net/npm/latex.js/dist/latex.js';
	script.async = true;
	script.onload = function () {
		console.log('LaTeX.js loaded successfully');
		window.LaTeXJSLoaded = true;
	};
	script.onerror = function () {
		console.error('Failed to load LaTeX.js');
		window.LaTeXJSLoaded = false;
	};
	document.head.appendChild(script);
})();
