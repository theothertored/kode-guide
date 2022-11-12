let prevWindowWidth = window.innerWidth;
let matchMedia;
let currentMode;

let prevScrollY = 0;
let showingFab = true;

const mobileThreshold = rem2px(64);

function rem2px(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

document.addEventListener('DOMContentLoaded', ev => {

    numberExamples();
    buildTOC();
    initModeSwitching();

});

function numberExamples() {

    let ex = 0;
    let subex = 0;

    document.querySelectorAll('.snippet .ex-no').forEach(el => {

        if (el.classList.contains('subex')) {

            if (el.classList.contains('first')) {
                ex++;
                subex = 0;
            }

            subex++;
            el.prepend(`ex. ${ex}.${subex} `);

        } else {

            ex++;
            el.prepend(`ex. ${ex} `);
            subex = 0;

        }

    });

}

function buildTOC() {

    let mainEl = document.querySelector('main');

    // build TOC list
    let tocListEl = document.getElementById('toc-list');
    let counters = [0, 0, 0];

    document.querySelectorAll('h2, h3, h4').forEach(el => {

        let text = el.innerText;
        el.innerText = '';

        let sectionLinkEl = document.createElement('a');
        sectionLinkEl.href = `#${el.id}`;
        sectionLinkEl.title = 'Link to this section';
        sectionLinkEl.innerText = text;
        sectionLinkEl.addEventListener('click', linkEl_click);

        el.appendChild(sectionLinkEl);

        let entryEl = document.createElement('a');
        let entryIndex = parseInt(el.tagName[1]) - 2;

        entryEl.classList.add('toc-entry', `toc-${entryIndex}`);

        counters[entryIndex]++;

        for (let i = entryIndex + 1; i < counters.length; i++) {
            counters[i] = 0;
        }

        entryEl.innerText = counters.slice(0, entryIndex + 1).join('.') + '. ' + text;
        entryEl.href = `#${el.id}`;

        entryEl.addEventListener('click', ev => {
            linkEl_click(ev)

            // if mobile, close TOC
            if (window.innerWidth < mobileThreshold)
                tocEl.classList.remove('in');
        });

        tocListEl.append(entryEl);

    });

    // init TOC toggle
    let tocEl = document.getElementById('toc');

    let tocFab = document.getElementById('toc-fab');
    tocFab.addEventListener('click', ev => {
        tocEl.classList.toggle('in');
    });

    prevScrollY = document.scrollingElement.scrollTop

    // init hiding TOC fab on scroll down on mobile
    window.addEventListener('scroll', ev => {

        if (window.scrollY > prevScrollY) {

            // scrolling down
            if (showingFab) {
                tocFab.classList.add('scroll-out');
                showingFab = false;
            }

        } else if (!showingFab) {
            tocFab.classList.remove('scroll-out');
            showingFab = true;
        }

        prevScrollY = window.scrollY;

    });

    // init hiding TOC on scrim click
    let tocScrimEl = document.querySelector('.toc-scrim');
    tocScrimEl.addEventListener('click', ev => {
        tocEl.classList.remove('in');
    });

    // init auto-hiding TOC on window resize
    window.addEventListener('resize', ev => {

        if (window.innerWidth < mobileThreshold != prevWindowWidth < mobileThreshold) {
            tocEl.classList.toggle('in', window.innerWidth >= mobileThreshold);
        }

        prevWindowWidth = window.innerWidth;
    });

    // show/hide TOC initially based on screen width
    tocEl.classList.toggle('in', window.innerWidth >= mobileThreshold);

    // add transition class after setting TOC initial state (further changes will be animated)
    setTimeout(() => tocEl.classList.add('transition'), 0);

    function linkEl_click(ev) {
        ev.preventDefault();

        window.history.replaceState(null, null, ev.currentTarget.href);
        let scrollToEl = document.querySelector(ev.currentTarget.getAttribute('href'));
        let scrollTop;

        if (scrollToEl.offsetTop < window.scrollY && window.innerWidth < mobileThreshold) {
            // scrolling up and on mobile, fab will be in the way
            scrollTop = mainEl.offsetTop + scrollToEl.offsetTop - tocFab.clientHeight;
        } else {
            // scrolling down or not on mobile, fab is not in the way
            scrollTop = mainEl.offsetTop + scrollToEl.offsetTop;
        }

        window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }

}

function initModeSwitching() {

    function reactToSelectedModeChange(mode, dontAnimate) {
        if (mode === 'dark' || mode === 'light') {
            switchTo(mode, dontAnimate);
        } else {
            // mode is system
            if (window.matchMedia) {

                if (!matchMedia) {
                    matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
                    matchMedia.addEventListener('change', systemDarkModeListener);
                }

                if (matchMedia.matches) {
                    // system set to dark mode
                    switchTo('dark', dontAnimate);
                } else {
                    // system set to light mode
                    switchTo('light', dontAnimate);
                }

            } else {
                // switch to light as fallback
                switchTo('light', dontAnimate);
            }
        }

        localStorage.setItem('mode', mode);
    }

    function systemDarkModeListener() {
        if (document.querySelector('[name="mode"]:checked').value === 'system') {
            switchTo(matchMedia.matches ? 'dark' : 'light');
        }
    }

    function switchTo(toMode, dontAnimate) {

        if (currentMode === toMode)
            return;

        if (dontAnimate) {

            document.documentElement.classList.toggle('light', toMode === 'light');

        } else {
            let overlay = document.createElement('div');
            overlay.classList.add('mode-switch-overlay', toMode);
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.classList.add('in');
                setTimeout(() => {
                    document.documentElement.classList.toggle('light', toMode === 'light');
                    overlay.classList.remove('in');
                    overlay.classList.add('out');
                    setTimeout(() => {
                        overlay.remove();
                    }, 330);
                }, 330);
            }, 0);
        }

        currentMode = toMode;

    }

    let initialMode = localStorage.getItem('mode') || 'system';

    document.querySelectorAll('[name="mode"]').forEach(el => {
        el.checked = el.value === initialMode;
        el.addEventListener('change', ev => reactToSelectedModeChange(ev.currentTarget.value));
    });

    reactToSelectedModeChange(initialMode, true);
}
