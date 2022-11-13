"use strict"; 

const cacheName = 'kode-guide';

self.addEventListener('install', ev => {

    ev.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                "/",
                "/js/index.js",
                "/css/index.css",
            ]);
        })
    ); 

});

self.addEventListener('fetch', ev => {

    if (ev.request.method === 'GET') {

        ev.respondWith(
            caches.open(cacheName).then(cache => {
                return fetch(ev.request)
                    .then(resp => {

                        let reqUrl = ev.request.url.toString();

                        if (reqUrl.includes('v=')) {
                            console.log('updating cached index.js or index.css');
                            cache.put(getReqUrlWithoutVersion(reqUrl), resp.clone());
                        } else {
                            cache.put(ev.request, resp.clone());
                        }

                        return resp;

                    })
                    .catch(err => {

                        let reqUrl = ev.request.url.toString();
                        
                        if (reqUrl.includes('v=')) {
                            console.log('fetching cached index.js or index.css');
                            return cache.match(getReqUrlWithoutVersion(reqUrl));
                        } else {
                            return cache.match(ev.request);
                        }

                    });
            })
        );

    }

});

function getReqUrlWithoutVersion(reqUrl){
    return reqUrl.replace(/[?&]v=.*?([&#]|$)/g, '');
}