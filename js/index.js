let prevWindowWidth = window.innerWidth;

document.addEventListener('DOMContentLoaded', ev => {

    numberExamples();
    buildTOC();
    
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

    let tocListEl = document.getElementById('toc-list');
    let counters = [0, 0, 0];

    document.querySelectorAll('h2, h3, h4').forEach(el => {

        let entryEl = document.createElement('a');
        let entryIndex = parseInt(el.tagName[1]) - 2;

        entryEl.classList.add('toc-entry', `toc-${entryIndex}`);

        counters[entryIndex]++;

        for (let i = entryIndex + 1; i < counters.length; i++) {
            counters[i] = 0;
        }

        entryEl.innerText = counters.slice(0, entryIndex + 1).join('.') + '. ' + el.innerText;
        entryEl.href = `#${el.id}`;

        tocListEl.append(entryEl);

    });

    let tocEl = document.getElementById('toc');

    tocEl.classList.toggle('in', window.innerWidth >= 1280);

    let tocFab = document.getElementById('toc-fab');
    tocFab.addEventListener('click', ev => {
        tocEl.classList.toggle('in');
    });

    window.addEventListener('resize', ev => {

        if (window.innerWidth < 1280 != prevWindowWidth < 1280) {
            tocEl.classList.toggle('in', window.innerWidth >= 1280);
        }

        prevWindowWidth = window.innerWidth;
    });

    setTimeout(() => tocEl.classList.add('transition'), 0);

}