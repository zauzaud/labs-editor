﻿"use strict";

// Change this value to force the browser to install the
// service worker again, and recreate the cache (this technique
// works because the browser reinstalls the service worker
// whenever it detects a change in the source code of the
// service worker).
const CACHE_PREFIX = "labs-editor-static-cache";
const CACHE_VERSION = "-v4";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const GAME_CACHE_NAME = "labs-editor-game-cache";

self.addEventListener("install", (event) => {
	// skipWaiting() will force the browser to start using
	// this version of the service worker as soon as its
	// installation finishes.
	// It does not really matter when we call skipWaiting(),
	// as long as we perform all other operations inside
	// event.waitUntil(). Calling event.waitUntil() forces
	// the installation process to be marked as finished
	// only when all promises passed to waitUntil() finish.
	//
	self.skipWaiting();

	event.waitUntil(caches.open(CACHE_NAME).then((cache) => {
		return cache.addAll([
			// According to the spec, the service worker file
			// is handled differently by the browser and needs
			// not to be added to the cache. I tested it and I
			// confirm the service worker works offline even when
			// not present in the cache (despite the error message
			// displayed by the browser when trying to fetch it).
			//
			// Also, there is no need to worry about max-age and
			// other cache-control headers/settings, because the
			// CacheStorage API ignores them.
			"/labs-editor/",
			"/labs-editor/html/",
			"/labs-editor/phaser/",
			"/labs-editor/phaser/game/",
			"/labs-editor/empty.html",
			"/labs-editor/example.html",
			"/labs-editor/example-html.html",
			"/labs-editor/examplePt.html",
			"/labs-editor/examplePt-html.html",
			"/labs-editor/favicon.ico",
			"/labs-editor/favicon.png",
			"/labs-editor/manifest.json",
			"/labs-editor/manifest-html.json",
			"/labs-editor/manifest-phaser.json",
			"/labs-editor/favicons/favicon-512x512.png",
			"/labs-editor/images/loading-grey-t.gif",
			"/labs-editor/images/logo.png",
			"/labs-editor/lib/ace-1.4.7/ace.js",
			"/labs-editor/lib/ace-1.4.7/ext-language_tools.js",
			"/labs-editor/lib/ace-1.4.7/ext-searchbox.js",
			"/labs-editor/lib/ace-1.4.7/mode-css.js",
			"/labs-editor/lib/ace-1.4.7/mode-html.js",
			"/labs-editor/lib/ace-1.4.7/mode-javascript.js",
			"/labs-editor/lib/ace-1.4.7/theme-chrome.js",
			"/labs-editor/lib/ace-1.4.7/theme-dracula.js",
			"/labs-editor/lib/ace-1.4.7/theme-eclipse.js",
			"/labs-editor/lib/ace-1.4.7/theme-labs.js",
			"/labs-editor/lib/ace-1.4.7/theme-monokai.js",
			"/labs-editor/lib/ace-1.4.7/theme-mono_industrial.js",
			"/labs-editor/lib/ace-1.4.7/theme-sqlserver.js",
			"/labs-editor/lib/ace-1.4.7/theme-textmate.js",
			"/labs-editor/lib/ace-1.4.7/worker-css.js",
			"/labs-editor/lib/ace-1.4.7/worker-html.js",
			"/labs-editor/lib/ace-1.4.7/worker-javascript.js",
			"/labs-editor/lib/ace-1.4.7/snippets/css.js",
			"/labs-editor/lib/ace-1.4.7/snippets/html.js",
			"/labs-editor/lib/ace-1.4.7/snippets/javascript.js",
			"/labs-editor/lib/bootstrap/css/bootstrap-1.0.22.min.css",
			"/labs-editor/lib/bootstrap/js/bootstrap-1.0.0.min.js",
			"/labs-editor/lib/font-awesome/css/font-awesome-1.0.2.min.css",
			"/labs-editor/lib/font-awesome/fonts/fontawesome-webfont.eot?v=4.7.0",
			"/labs-editor/lib/font-awesome/fonts/fontawesome-webfont.eot?#iefix&v=4.7.0",
			"/labs-editor/lib/font-awesome/fonts/fontawesome-webfont.svg?v=4.7.0",
			"/labs-editor/lib/font-awesome/fonts/fontawesome-webfont.ttf?v=4.7.0",
			"/labs-editor/lib/font-awesome/fonts/fontawesome-webfont.woff?v=4.7.0",
			"/labs-editor/lib/font-awesome/fonts/fontawesome-webfont.woff2?v=4.7.0",
			"/labs-editor/lib/jquery/jquery-1.0.0.min.js",
			"/labs-editor/phaser/game/phaser-2.6.2.min.js",
			// Since these files' contents always change, but their names do not, I
			// added a version number in order to try to avoid browsers' native cache
			"/labs-editor/css/style.css?v=1.0.0",
			"/labs-editor/js/main.js?v=1.0.0"
		]);
	}));
});

self.addEventListener("activate", (event) => {
	// claim() is used to ask the browser to use this instance
	// of the service worker with all possible clients, including
	// any pages that might have been opened before this service
	// worker was downloaded/activated (not used here).
	//
	//self.clients.claim();

	event.waitUntil(
		// List all cache storages in our domain.
		caches.keys().then(function (keyList) {
			// Create one Promise for deleting each cache storage that is not
			// our current cache storage, taking care not to delete other
			// cache storages from the domain by checking the key prefix (we
			// are not using map() to avoid inserting undefined into the array).
			let oldCachesPromises = [];

			for (let i = keyList.length - 1; i >= 0; i--) {
				let key = keyList[i];
				if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
					oldCachesPromises.push(caches.delete(key));
			}

			return Promise.all(oldCachesPromises);
		})
	);
});

self.addEventListener("fetch", (event) => {

	const url = event.request.url;

	if (url.indexOf("/phaser/game/") >= 0 &&
		!url.endsWith("/phaser/game/") &&
		!url.endsWith("/phaser-2.6.2.min.js")) {
		// Look for the resource in the game cache, not in our cache.
		event.respondWith(caches.open(GAME_CACHE_NAME).then((cache) => {
			return cache.match(event.request);
		}));
		return;
	}

	// This will speed up the loading time after the first
	// time the user loads the game. The downside of this
	// technique is that we will work with an outdated
	// version of the resource if it has been changed at
	// the server, but has not yet been updated in our
	// local cache (which, right now, will only happen
	// when the service worker is reinstalled).

	event.respondWith(caches.open(CACHE_NAME).then((cache) => {
		return cache.match(event.request).then((response) => {
			// Return the resource if it has been found.
			if (response)
				return response;

			// When the resource was not found in the cache,
			// try to fetch it from the network. We are cloning the
			// request because requests are streams, and fetch will
			// consume this stream, rendering event.request unusable
			// (but we will need a usable request later, for cache.put)
			//
			// IMPORTANT: Do not use our cache for external requests made
			// from the game!!!
			if (!event.request.referrer || (event.request.referrer && event.request.referrer.endsWith("/phaser/game/")))
				return fetch(event.request);

			return fetch(event.request.clone()).then((response) => {
				// If this fetch succeeds, store it in the cache for
				// later! (This means we probably forgot to add a file
				// in cache.addAll() during the installation phase)

				// Just as requests, responses are streams and we will
				// need two usable streams: one to be used by the cache
				// and one to be returned to the browser! So, we send a
				// clone of the response to the cache.
				cache.put(event.request, response.clone());
				return response;
			}).catch(() => {
				// The request was neither in our cache nor was it
				// available from the network (maybe we are offline).
				// Therefore, try to fulfill requests for favicons with
				// the largest favicon we have available in our cache.
				if (event.request.url.toString().indexOf("favicon") >= 0)
					return cache.match("/labs-editor/favicons/favicon-512x512.png");

				// The resource was not in our cache, was not available
				// from the network and was also not a favicon...
				// Unfortunately, there is nothing else we can do :(
				return null;
			});
		});
	}));

});

// References:
// https://developers.google.com/web/fundamentals/primers/service-workers/?hl=en-us
// https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=en-us
// https://developers.google.com/web/fundamentals/codelabs/offline/?hl=en-us
// https://web.dev/service-workers-cache-storage
