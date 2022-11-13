
let tocEl, guideEl;
let isTOCOpen;
let matchMedia, currentTheme;

const mobileThreshold = rem2px(64);

function rem2px(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

document.addEventListener('DOMContentLoaded', ev => {

    // make sure elements used by more than one function are initialized first
    guideEl = document.querySelector('.guide');
    tocEl = document.querySelector('.toc');

    initPWA();
    initExampleNumbers();
    initTOCAndHeaders();
    initThemeSwitching();
    initReactingToResize();
    initDoubleTapToCopy();
    initSwipeInteractionsForToc();
    initScrollRestore();

});

function initPWA() {

    let prompt;

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/kode-guide/sw.js', { scope: '/kode-guide' }).then(reg => {

            let swCachingP = document.getElementById('sw-caching-available');
            swCachingP.classList.remove('no-display');

        });

    }

    window.addEventListener('beforeinstallprompt', ev => {

        prompt = ev;
        let promptP = document.getElementById('pwa-install-prompt');
        let promptBtnP = document.getElementById('pwa-install-button');
        let promptBtn = promptBtnP.querySelector('button');

        promptP.classList.remove('no-display');
        promptBtnP.classList.remove('no-display');

        promptBtn.addEventListener('click', ev => {
            prompt.prompt();
        });

    });

}

function initReactingToResize() {

    let prevWindowWidth = window.innerWidth;

    // init auto-hiding TOC on window resize
    window.addEventListener('resize', ev => {

        // expand/collapse toc if we went from mobile to desktop or vice versa
        if (window.innerWidth < mobileThreshold != prevWindowWidth < mobileThreshold) {
            setTOCOpen(window.innerWidth >= mobileThreshold);
        }

        // save window width for next resize event
        prevWindowWidth = window.innerWidth;

    });

}

function initExampleNumbers() {

    // ex. 1 and ex.1.1 counters
    let ex = 0, subex = 0;

    // go through each example number element
    document.querySelectorAll('.snippet .ex-no').forEach(el => {

        if (el.classList.contains('subex')) {

            // subexample

            if (el.classList.contains('first')) {
                // fisrt subexample should increment the main example counter and reset the subexample counter
                ex++;
                subex = 0;
            }

            // increment subexample counter and set the text
            subex++;
            el.prepend(`ex. ${ex}.${subex} `);

        } else {

            // example 
            // increment example counter, set the text and reset the subexample counter
            ex++;
            el.prepend(`ex. ${ex} `);
            subex = 0;

        }

    });

}

function initTOCAndHeaders() {

    // the element to append created list items to
    let tocListEl = tocEl.querySelector('main');
    // section counters (1., 1.1., 1.1.1)
    let counters = [0, 0, 0];

    // function to scroll to section linked to by the clicked link (ev.currentTarget)
    function sectionLinkEl_click(ev) {
        ev.preventDefault();

        // show fragment in the address bar without triggering the default instant scroll
        window.history.replaceState(null, null, ev.currentTarget.href);

        // find element given by the href of the clicked link
        let scrollToEl = document.querySelector(ev.currentTarget.getAttribute('href'));

        // make sure the TOC fab won't overlap the header we're scrolling to
        let scrollTop;

        if (scrollToEl.offsetTop < window.scrollY && window.innerWidth < mobileThreshold) {
            // scrolling up and on mobile, fab will be in the way, offset by its height
            scrollTop = scrollToEl.offsetTop - tocFab.clientHeight;
        } else {
            // scrolling down or not on mobile, fab is not in the way
            scrollTop = scrollToEl.offsetTop;
        }

        // use native smooth scroll to scroll to the position
        window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }

    // go through all headers in the guide
    guideEl.querySelectorAll('h2, h3, h4').forEach(el => {

        // store the text of the header for later
        let html = el.innerHTML;
        let text = el.innerText;

        // create the href that will link to this section
        let href = `#${el.id}`;


        // header link

        // create a link to the section for placing in the header
        let sectionLinkEl = document.createElement('a');
        sectionLinkEl.href = href;
        sectionLinkEl.title = 'Link to this section';
        sectionLinkEl.innerHTML = html;

        // listen to header clicks
        sectionLinkEl.addEventListener('click', sectionLinkEl_click);

        // replace header text with the link to the section
        el.innerText = '';
        el.appendChild(sectionLinkEl);


        // toc link

        // create a link to the section for putting in the TOC
        let tocLinkEl = document.createElement('a');

        // get which header level this is
        let entryIndex = parseInt(el.tagName[1]) - 2;

        // increment the counter for this header level
        counters[entryIndex]++;

        // reset counters for lower header levels
        for (let i = entryIndex + 1; i < counters.length; i++) {
            counters[i] = 0;
        }

        // give the entry a class for indenting
        tocLinkEl.classList.add('toc-entry', `toc-${entryIndex}`);

        // make a text for the entry from the counters and the header text
        tocLinkEl.innerText = `${counters.slice(0, entryIndex + 1).join('.')}. ${text}`;

        tocLinkEl.href = href;

        // listen to TOC entry clicks
        tocLinkEl.addEventListener('click', ev => {
            sectionLinkEl_click(ev)

            // if mobile, close TOC so the user doesn't have to do it manually
            if (window.innerWidth < mobileThreshold)
                setTOCOpen(false)
        });

        // add created entry to the TOC
        tocListEl.append(tocLinkEl);

    });


    let tocFab = document.querySelector('.toc-fab');

    // toggle TOC on fab click
    tocFab.addEventListener('click', ev => setTOCOpen(!isTOCOpen));


    // hide TOC fab on scroll down on mobile

    // init scroll Y to current scroll Y
    let prevScrollY = window.scrollY;
    let showingFab = true;

    // react to window scrolling
    window.addEventListener('scroll', ev => {

        // this code could maybe be changed to use requestAnimationFrame, but I don't think that's necessary

        if (window.scrollY > prevScrollY) {

            // scrolling down, hide fab if it's visible
            if (showingFab) {
                tocFab.classList.add('scroll-out');
                showingFab = false;
            }

        } else {

            // scrolling up, show fab if it's hidden
            if (!showingFab) {
                tocFab.classList.remove('scroll-out');
                showingFab = true;
            }

        }

        // store current scroll Y for next scroll event
        prevScrollY = window.scrollY;

    });


    // hide TOC on scrim click
    let tocScrimEl = document.querySelector('.toc-scrim');
    tocScrimEl.addEventListener('click', ev => setTOCOpen(false));

    // show TOC initially on desktop, hide on mobile
    setTOCOpen(window.innerWidth >= mobileThreshold);

    // add transition class after setting TOC initial state (so further changes will be animated)
    setTimeout(() => tocEl.classList.add('transition'), 0);

}

function initThemeSwitching() {

    // reacts to the user's theme selection changing between 'light', 'dark' and 'system'
    //  1. synchronizes both theme switchers
    //  2. switches to the appropriate theme (resolves 'system' to 'light' or 'dark')
    //  3. saves the selection to localStorage
    function reactToSelectedThemeChange(theme, dontAnimate) {

        setCheckedValue('theme', theme);
        setCheckedValue('theme2', theme);

        if (theme === 'dark' || theme === 'light') {

            // switch to theme directly
            switchTo(theme, dontAnimate);

        } else {

            // theme is system
            if (window.matchMedia) {

                if (!matchMedia) {
                    // this is the first time system was selected, check system theme and listen for further changes
                    matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
                    matchMedia.addEventListener('change', systemDarkThemeListener);
                }

                if (matchMedia.matches) {
                    // system set to dark theme
                    switchTo('dark', dontAnimate);
                } else {
                    // system set to light theme
                    switchTo('light', dontAnimate);
                }

            } else {
                // switch to light as fallback
                switchTo('light', dontAnimate);
            }
        }

        // store the selection as the last selected theme that will be loaded on next visit
        localStorage.setItem('theme', theme);
    }

    // listens to system dark theme changes and switches to the appropriate theme if 'system' is selected
    function systemDarkThemeListener() {
        if (document.querySelector('[name="theme"]:checked').value === 'system') {
            switchTo(matchMedia.matches ? 'dark' : 'light');
        }
    }

    // visually switches the document to light or dark theme (don't pass in 'system')
    // if dontAnimate is true:
    //  1. toggles the "light" theme class on <html>
    // else 
    //  1. creates a theme-switch-overlay
    //  2. shows the overlay and waits for animation finish
    //  3. toggles the "light" theme class on <html>
    //  4. hides the overlay and waits for animation finish
    //  5. removes the overlay from the DOM
    function switchTo(toTheme, dontAnimate) {

        if (currentTheme === toTheme)
            return;

        if (dontAnimate) {

            document.documentElement.classList.toggle('light', toTheme === 'light');

        } else {

            let overlay = document.createElement('div');
            overlay.classList.add('theme-switch-overlay', toTheme);
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.classList.add('in');
                setTimeout(() => {
                    document.documentElement.classList.toggle('light', toTheme === 'light');
                    overlay.classList.remove('in');
                    overlay.classList.add('out');
                    setTimeout(() => {
                        overlay.remove();
                    }, 330);
                }, 330);
            }, 0);

        }

        currentTheme = toTheme;

    }

    // get initial theme from local storage, default to system
    let initialTheme = localStorage.getItem('theme') || 'system';

    document.querySelectorAll('[name="theme"], [name="theme2"]').forEach(el => {

        // check appropriate radios
        el.checked = el.value === initialTheme;

        // react to radios of both theme switchers changing
        el.addEventListener('change', ev => reactToSelectedThemeChange(ev.currentTarget.value));

    });

    // set initial theme
    reactToSelectedThemeChange(initialTheme, true);

}

// helper function to set the checked value of a radio group given by name
function setCheckedValue(name, value) {
    document.querySelectorAll(`[name="${name}"]`).forEach(el => {
        el.checked = el.value === value;
    });
}

// initializes double-tapping on example boxes to copy to clipboard, with a fancy animation
function initDoubleTapToCopy() {

    const doubleTapDelay = 500;

    document.querySelectorAll('.snippet > code, .snippet > .step > code').forEach(el => {

        let lastTapForThisEl = 0;

        el.addEventListener('click', ev => {

            let now = Date.now();

            if (now - lastTapForThisEl < doubleTapDelay) {

                let noDollars = el.classList.contains('no-dollars') || el.previousElementSibling?.classList.contains('output');

                // double tap detected, copy snippet text to clipboard
                navigator.clipboard.writeText(noDollars ? el.innerText : `$${el.innerText}$`).then(function () {

                    // success, animate

                    // after animation ends, remove the animation class and the listener
                    const listener = ev => {
                        el.classList.remove('copied');
                        el.removeEventListener('transitionend', listener);
                    };

                    el.classList.add('copied');
                    el.addEventListener('animationend', listener);

                }, function (err) {
                    alert('Error copying:' + err);
                });


            } else {
                lastTapForThisEl = now;
            }

        });

    });

}

let swipeInProgress = false;
let swipeStartX, swipeStartY;
const swipeThreshold = 24;

function initSwipeInteractionsForToc() {

    window.addEventListener('touchstart', ev => {

        if (ev.touches.length !== 1)
            return;

        let touch = ev.touches[0];
        swipeStartX = touch.clientX;
        swipeStartY = touch.clientY;

        swipeInProgress = true;

    }, false);

    window.addEventListener('touchmove', ev => {

        if (!swipeInProgress)
            return;

        let touch = ev.touches[0];

        let dx = touch.clientX - swipeStartX;
        let dy = touch.clientY - swipeStartY;

        if (Math.abs(dx) > Math.abs(dy)) {

            if (Math.abs(dx) >= swipeThreshold) {
                // horizontal swipe
                ev.preventDefault();
                setTOCOpen(dx > 0);
                swipeInProgress = false;
            }

        } else {
            // vertical swipe
            swipeInProgress = false;
        }


    }, { passive: false });

    window.addEventListener('touchend', ev => {
        swipeInProgress = false;
    }, false);

}

// opens/closes the TOC and remembers the state in isTOCOpen
function setTOCOpen(open) {
    tocEl.classList.toggle('in', open);
    isTOCOpen = open;
}

function initScrollRestore() {

    const lastVisitScrollYKey = 'lastVisitScrollY';
    const lastVisitFragmentKey = 'lastVisitFragment';

    // restore scroll position on back/forward
    window.addEventListener('pageshow', ev => {

        let lastVisitScrollY = parseInt(localStorage.getItem(lastVisitScrollYKey));
        let lastVisitFragment = localStorage.getItem(lastVisitFragmentKey);

        // ev.persisted is true when loading from bfcache, which preserves scroll pos on its own
        if (!ev.persisted) {

            // if (Math.abs(window.scrollY - lastVisitScrollY) >= 24 && (!window.location.hash || window.location.hash === lastVisitFragment))
            if ((window.scrollY === 0 && lastVisitScrollY >= 24) || (window.location.fragment === lastVisitFragment && Math.abs(document.querySelector(lastVisitFragment).offsetTop - window.scrollY) >= 24)) {

                // offer to restore after hard reload/fresh visit

                console.log('adding notif el');

                let notifEl = document.createElement('div');
                notifEl.classList.add('scroll-restore-message');

                let spanEl = document.createElement('span');
                spanEl.innerText = 'Click here to pick up where you left off';


                let dismissBtnEl = document.createElement('button');
                dismissBtnEl.classList.add('btn-dismiss');
                dismissBtnEl.innerText = 'DISMISS';
                dismissBtnEl.addEventListener('click', ev => {
                    hideNotifEl()
                    // make sure the click doesn't reach the parent
                    ev.stopPropagation();
                });


                notifEl.appendChild(spanEl);
                notifEl.appendChild(dismissBtnEl);

                notifEl.addEventListener('click', ev => {
                    window.scrollTo({
                        top: lastVisitScrollY,
                        behavior: 'smooth'
                    });
                    hideNotifEl();
                });

                document.body.appendChild(notifEl);
                setTimeout(() => notifEl.classList.add('in'), 0);

                function hideNotifEl() {

                    notifEl.addEventListener('transitionend', ev => notifEl.remove());
                    notifEl.classList.remove('in');

                    localStorage.removeItem(lastVisitScrollYKey);
                    localStorage.removeItem(lastVisitFragmentKey);

                }

            }
        }

    });

    let saveScrollTimeoutDuration = 100;
    let saveScrollTimeoutId = null;

    window.addEventListener('scroll', ev => {

        clearTimeout(saveScrollTimeoutId);

        saveScrollTimeoutId = setTimeout(() => {

            localStorage.setItem(lastVisitScrollYKey, window.scrollY);
            localStorage.setItem(lastVisitFragmentKey, window.location.hash);

        }, saveScrollTimeoutDuration);

    });

}