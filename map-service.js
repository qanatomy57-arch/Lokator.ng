/**
 * LOKATOR.NG — MAP SERVICE & REAL GPS GEOLOCATION ENGINE (Phase 10.19)
 * 
 * Provides unified interactive map rendering (Google Maps with seamless Leaflet/OSM fallback)
 * and precise browser GPS geolocation with privacy-safe Nigerian locality centroid resolution.
 */

(function (global) {
  'use strict';

  const LokatorMapService = {
    _googleMapsLoaded: false,
    _googleMapsLoading: false,
    _googleMapsFailed: false,
    _loadingCallbacks: [],

    /**
     * Get Google Maps API key from environment / window / meta tag
     */
    getGoogleMapsApiKey: function () {
      if (typeof window !== 'undefined') {
        if (window.GOOGLE_MAPS_API_KEY && window.GOOGLE_MAPS_API_KEY !== 'undefined') {
          return window.GOOGLE_MAPS_API_KEY;
        }
        if (window.LOKATOR_GOOGLE_MAPS_API_KEY && window.LOKATOR_GOOGLE_MAPS_API_KEY !== 'undefined') {
          return window.LOKATOR_GOOGLE_MAPS_API_KEY;
        }
        const metaTag = document.querySelector('meta[name="google-maps-api-key"]');
        if (metaTag && metaTag.content && metaTag.content !== 'undefined') {
          return metaTag.content;
        }
      }
      if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_MAPS_API_KEY) {
        return process.env.GOOGLE_MAPS_API_KEY;
      }
      return null;
    },

    /**
     * Get Google Maps Map ID for vector / cloud-based styling
     */
    getGoogleMapsMapId: function () {
      if (typeof window !== 'undefined') {
        if (window.GOOGLE_MAPS_MAP_ID && window.GOOGLE_MAPS_MAP_ID !== 'undefined') {
          return window.GOOGLE_MAPS_MAP_ID;
        }
        const metaTag = document.querySelector('meta[name="google-maps-map-id"]');
        if (metaTag && metaTag.content && metaTag.content !== 'undefined') {
          return metaTag.content;
        }
      }
      if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_MAPS_MAP_ID) {
        return process.env.GOOGLE_MAPS_MAP_ID;
      }
      return null;
    },

    /**
     * Load Google Maps JS API asynchronously if an API key is available
     */
    loadGoogleMapsApi: function (callback) {
      if (this._googleMapsLoaded || (typeof google !== 'undefined' && google.maps)) {
        this._googleMapsLoaded = true;
        if (callback) callback(true);
        return;
      }

      // If Google Maps previously failed or authentication was rejected, immediately fallback without retrying
      if (this._googleMapsFailed) {
        if (callback) callback(false);
        return;
      }

      if (callback) this._loadingCallbacks.push(callback);

      if (this._googleMapsLoading) return;

      const apiKey = this.getGoogleMapsApiKey();
      if (!apiKey) {
        // No API key configured — proceed gracefully with interactive Leaflet fallback
        this._triggerCallbacks(false);
        return;
      }

      this._googleMapsLoading = true;
      if (typeof window !== 'undefined') {
        window.gm_authFailure = () => {
          console.warn('LokatorMapService: Google Maps authentication or billing error detected. Operating via Leaflet/OpenStreetMap fallback.');
          this._googleMapsLoaded = false;
          this._googleMapsFailed = true;
          if (typeof window.PadiFixSentry !== 'undefined' && window.PadiFixSentry.captureMessage) {
            window.PadiFixSentry.captureMessage('Google Maps authentication or billing gate active; Leaflet/OSM fallback engaged.', 'warning');
          }
        };
      }
      const script = document.createElement('script');
      const mapId = this.getGoogleMapsMapId();
      let src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;
      if (mapId) {
        src += `&map_ids=${encodeURIComponent(mapId)}`;
      }
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this._googleMapsLoaded = true;
        this._googleMapsLoading = false;
        this._triggerCallbacks(true);
      };
      script.onerror = () => {
        this._googleMapsLoading = false;
        this._googleMapsFailed = true;
        console.warn('LokatorMapService: Google Maps failed to load. Falling back to interactive Leaflet map.');
        if (typeof window !== 'undefined' && typeof window.PadiFixSentry !== 'undefined' && window.PadiFixSentry.captureMessage) {
          window.PadiFixSentry.captureMessage('Google Maps script failed to load; Leaflet/OSM fallback engaged.', 'warning');
        }
        this._triggerCallbacks(false);
      };
      document.head.appendChild(script);
    },

    _triggerCallbacks: function (success) {
      while (this._loadingCallbacks.length > 0) {
        const cb = this._loadingCallbacks.shift();
        try { cb(success); } catch (e) { console.error(e); }
      }
    },

    /**
     * Calculate straight-line distance in kilometers (Haversine formula)
     */
    calculateDistanceKm: function (lat1, lon1, lat2, lon2) {
      if (!lat1 || !lon1 || !lat2 || !lon2) return null;
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    /**
     * Format distance for friendly display (e.g. "1.2 km" or "450 m")
     */
    formatDistance: function (km) {
      if (km === null || km === undefined || isNaN(km)) return '';
      if (km < 1) {
        return `~${Math.round(km * 1000)} m away`;
      }
      return `~${km.toFixed(1)} km away`;
    },

    /**
     * Format accuracy display (e.g. "±12 m")
     */
    formatAccuracy: function (meters) {
      if (!meters || isNaN(meters)) return '±15 m';
      const m = Math.round(meters);
      return `±${m} m`;
    },

    /**
     * Format current relative timestamp
     */
    formatTimestamp: function () {
      return 'Just now';
    },

    /**
     * Request real GPS geolocation from the browser
     */
    requestUserGPS: function (options) {
      options = options || {};
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const err = new Error('Geolocation is not supported by your browser.');
          err.code = 'UNSUPPORTED';
          return reject(err);
        }

        const geoOptions = {
          enableHighAccuracy: options.highAccuracy !== false,
          timeout: options.timeout || 12000,
          maximumAge: options.maximumAge || 0
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = position.coords;
            const result = {
              lat: coords.latitude,
              lng: coords.longitude,
              accuracy: coords.accuracy || 15,
              accuracyFormatted: this.formatAccuracy(coords.accuracy),
              timestamp: new Date(),
              timestampFormatted: this.formatTimestamp(),
              isPrecise: (coords.accuracy || 100) <= 50
            };
            resolve(result);
          },
          (error) => {
            let friendlyMessage = 'Unable to detect your current location.';
            let code = 'UNKNOWN';
            if (error.code === 1) {
              friendlyMessage = 'Location permission was denied. Please allow location access in your browser settings.';
              code = 'PERMISSION_DENIED';
            } else if (error.code === 2) {
              friendlyMessage = 'Position unavailable. Please check your GPS or mobile data network.';
              code = 'POSITION_UNAVAILABLE';
            } else if (error.code === 3) {
              friendlyMessage = 'Location request timed out. Please tap retry.';
              code = 'TIMEOUT';
            }
            const err = new Error(friendlyMessage);
            err.code = code;
            err.original = error;
            reject(err);
          },
          geoOptions
        );
      });
    },

    /**
     * Initialize an interactive map inside a container
     */
    initServiceMap: function (containerId, options) {
      options = options || {};
      const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!container) return null;

      const providerLat = Number(options.lat) || 6.5244;
      const providerLng = Number(options.lng) || 3.3792;
      const zoom = options.zoom || 14;
      const providerName = options.providerName || 'Verified Artisan';
      const locality = options.locality || 'Service Area';

      const mapHandle = {
        type: 'none',
        instance: null,
        providerMarker: null,
        userMarker: null,
        accuracyCircle: null,
        center: [providerLat, providerLng],

        setCenter: function (lat, lng, newZoom) {
          if (this.type === 'google' && this.instance) {
            this.instance.setCenter({ lat: Number(lat), lng: Number(lng) });
            if (newZoom) this.instance.setZoom(newZoom);
          } else if (this.type === 'leaflet' && this.instance) {
            this.instance.setView([Number(lat), Number(lng)], newZoom || this.instance.getZoom());
          }
        },

        setUserLocation: function (userLat, userLng, accuracy) {
          userLat = Number(userLat);
          userLng = Number(userLng);
          accuracy = Number(accuracy) || 15;

          if (this.type === 'leaflet' && typeof L !== 'undefined' && this.instance) {
            // Remove previous user marker and circle
            if (this.userMarker) this.instance.removeLayer(this.userMarker);
            if (this.accuracyCircle) this.instance.removeLayer(this.accuracyCircle);

            // Accuracy Circle
            this.accuracyCircle = L.circle([userLat, userLng], {
              radius: accuracy,
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.15,
              weight: 1.5
            }).addTo(this.instance);

            // Pulse User Marker
            const userIcon = L.divIcon({
              className: 'lokator-user-marker',
              html: `
                <div class="user-pulse-wrap">
                  <div class="user-pulse-ring"></div>
                  <div class="user-pulse-dot"></div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            this.userMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(this.instance);
            this.userMarker.bindPopup('<strong>You are here</strong><br><span style="font-size:11px; color:#64748B;">GPS Location Detected</span>');

            // Fit bounds to show both provider and user
            const bounds = L.latLngBounds([
              [providerLat, providerLng],
              [userLat, userLng]
            ]);
            this.instance.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
          } else if (this.type === 'google' && typeof google !== 'undefined' && this.instance) {
            if (this.userMarker) this.userMarker.setMap(null);
            if (this.accuracyCircle) this.accuracyCircle.setMap(null);

            this.accuracyCircle = new google.maps.Circle({
              strokeColor: '#3B82F6',
              strokeOpacity: 0.8,
              strokeWeight: 1.5,
              fillColor: '#3B82F6',
              fillOpacity: 0.15,
              map: this.instance,
              center: { lat: userLat, lng: userLng },
              radius: accuracy
            });

            this.userMarker = new google.maps.Marker({
              position: { lat: userLat, lng: userLng },
              map: this.instance,
              title: 'You are here',
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: '#2563EB',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
              }
            });

            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: providerLat, lng: providerLng });
            bounds.extend({ lat: userLat, lng: userLng });
            this.instance.fitBounds(bounds, { top: 35, right: 35, bottom: 35, left: 35 });
          }
        },
        invalidateSize: function () {
          if (this.type === 'leaflet' && this.instance) {
            try { this.instance.invalidateSize(); } catch (e) {}
          } else if (this.type === 'google' && typeof google !== 'undefined' && google.maps && this.instance) {
            try { google.maps.event.trigger(this.instance, 'resize'); } catch (e) {}
          }
        },

        destroy: function () {
          if (this.type === 'leaflet' && this.instance) {
            try { this.instance.remove(); } catch (e) {}
            this.instance = null;
          }
          if (container) {
            if (container._lokator_lmap) container._lokator_lmap = null;
            if (container._leaflet_id) container._leaflet_id = null;
          }
        }
      };

      // Check if Google Maps is available
      if (typeof google !== 'undefined' && google.maps) {
        try {
          const mapId = this.getGoogleMapsMapId();
          const mapOptions = {
            center: { lat: providerLat, lng: providerLng },
            zoom: zoom,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          };
          if (mapId) {
            mapOptions.mapId = mapId;
          } else {
            mapOptions.styles = [
              { elementType: 'geometry', stylers: [{ color: '#1B241E' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#1B241E' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#88988D' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2C3E33' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0C130E' }] }
            ];
          }
          const gmap = new google.maps.Map(container, mapOptions);

          const gMarker = new google.maps.Marker({
            position: { lat: providerLat, lng: providerLng },
            map: gmap,
            title: `${providerName} (${locality})`
          });

          mapHandle.type = 'google';
          mapHandle.instance = gmap;
          mapHandle.providerMarker = gMarker;
          return mapHandle;
        } catch (e) {
          console.warn('LokatorMapService: Google Maps initialization failed, using Leaflet.', e);
        }
      }

      // Interactive Leaflet Fallback (Zero downtime & offline friendly)
      if (typeof L !== 'undefined') {
        try {
          // Clean up previous Leaflet instance if attached
          if (container._lokator_lmap) {
            try { container._lokator_lmap.remove(); } catch (e) {}
            container._lokator_lmap = null;
          }
          if (container._leaflet_id) {
            container._leaflet_id = null;
          }
          container.innerHTML = '';

          const lmap = L.map(container, {
            zoomControl: true,
            scrollWheelZoom: false,
            attributionControl: false
          }).setView([providerLat, providerLng], zoom);

          container._lokator_lmap = lmap;

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
          }).addTo(lmap);

          // Provider Pin Marker
          const providerIcon = L.divIcon({
            className: 'lokator-service-marker',
            html: `
              <div class="service-pin-badge">
                <span class="service-pin-icon">📍</span>
                <span class="service-pin-text">${escapeMapHtml(locality)}</span>
              </div>
            `,
            iconSize: [120, 36],
            iconAnchor: [60, 36]
          });

          const lMarker = L.marker([providerLat, providerLng], { icon: providerIcon }).addTo(lmap);
          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${providerLat},${providerLng}`;
          lMarker.bindPopup(`
            <div style="font-family: inherit; font-size: 13px;">
              <strong style="color:#006B3F; font-size:14px;">${escapeMapHtml(providerName)}</strong><br>
              <span style="font-size:12px; color:#475569;">📍 ${escapeMapHtml(locality)}</span>
              <div style="margin-top: 6px;">
                <a href="${navUrl}" target="_blank" rel="noopener" style="font-size: 11px; color: #2563EB; text-decoration: underline; font-weight: 600;">Get Directions ↗</a>
              </div>
            </div>
          `);

          mapHandle.type = 'leaflet';
          mapHandle.instance = lmap;
          mapHandle.providerMarker = lMarker;

          setTimeout(() => {
            if (lmap) lmap.invalidateSize();
          }, 250);

          return mapHandle;
        } catch (err) {
          console.error('LokatorMapService: Leaflet initialization error:', err);
        }
      }

      return mapHandle;
    },

    /**
     * Initialize or update a multi-artisan search directory map
     */
    initSearchDirectoryMap: function (containerId, options) {
      options = options || {};
      const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!container || typeof L === 'undefined') return null;

      let lmap = container._lokator_lmap;
      let markersLayer = container._lokator_markers_layer;

      if (!lmap) {
        if (container._leaflet_id) container._leaflet_id = null;
        container.innerHTML = '';

        lmap = L.map(container, {
          zoomControl: true,
          scrollWheelZoom: false,
          attributionControl: false
        }).setView([6.5244, 3.3792], 11);

        container._lokator_lmap = lmap;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        }).addTo(lmap);

        markersLayer = L.layerGroup().addTo(lmap);
        container._lokator_markers_layer = markersLayer;
      }

      const directoryHandle = {
        instance: lmap,
        markersLayer: markersLayer,

        invalidateSize: function () {
          if (lmap) {
            setTimeout(() => {
              try { lmap.invalidateSize(); } catch (e) {}
            }, 100);
          }
        },

        updateProviders: function (providersList, userCoords) {
          if (!markersLayer || !lmap) return 0;
          markersLayer.clearLayers();

          const bounds = [];
          let plottedCount = 0;

          (providersList || []).forEach(p => {
            let lat = Number(p.lat != null ? p.lat : p.latitude);
            let lng = Number(p.lng != null ? p.lng : p.longitude);

            if ((isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) && typeof NigeriaLocations !== 'undefined' && NigeriaLocations.resolveCoordinates) {
              const res = NigeriaLocations.resolveCoordinates(p);
              lat = res.lat;
              lng = res.lng;
            }

            if (isNaN(lat) || isNaN(lng)) return;

            bounds.push([lat, lng]);
            plottedCount++;

            const initials = (p.name || 'Pro').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const providerArea = p.area || (p.lga && p.state ? `${p.lga}, ${p.state}` : p.city) || 'Nigeria';

            const customIcon = L.divIcon({
              className: 'custom-lokator-marker',
              html: `<div class="lokator-pin" title="${escapeMapHtml(p.name)} (${escapeMapHtml(p.trade)})"><span>${escapeMapHtml(initials)}</span></div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
              popupAnchor: [0, -20]
            });

            const PhoneEngine = (typeof NigeriaPhone !== 'undefined' ? NigeriaPhone : null) || (typeof window !== 'undefined' ? window.NigeriaPhone : null);
            const telUrl = PhoneEngine ? PhoneEngine.buildTelUrl(p) : (p.phone ? `tel:${p.phone}` : '');
            const waUrl = PhoneEngine ? PhoneEngine.buildWhatsAppUrl(p, { service: p.trade, location: providerArea }) : '';
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            const popupHtml = `
              <div class="lokator-popup-card">
                <strong style="font-size: 14px; color: #006B3F;">${escapeMapHtml(p.name)}</strong>
                <div class="lokator-popup-trade" style="font-size: 12px; font-weight: 600; color: #D4AF37;">${escapeMapHtml(p.trade || 'Artisan')}</div>
                <div class="lokator-popup-loc" style="font-size: 11.5px; color: #94A3B8; margin: 4px 0;">📍 ${escapeMapHtml(providerArea)}</div>
                <div class="lokator-popup-actions" style="display: flex; gap: 6px; margin-top: 8px;">
                  ${telUrl ? `<a href="${escapeMapHtml(telUrl)}" class="lokator-popup-call" style="padding: 4px 8px; font-size: 11px; background: #006B3F; color: #FFF; border-radius: 4px; text-decoration: none;">📞 Call</a>` : ''}
                  ${waUrl ? `<a href="${escapeMapHtml(waUrl)}" target="_blank" rel="noopener" class="lokator-popup-wa" style="padding: 4px 8px; font-size: 11px; background: #25D366; color: #000; font-weight: 700; border-radius: 4px; text-decoration: none;">💬 WhatsApp</a>` : ''}
                  <a href="profile.html?id=${p.id}" style="padding: 4px 8px; font-size: 11px; background: #38BDF8; color: #000; font-weight: 700; border-radius: 4px; text-decoration: none;">Profile →</a>
                </div>
                <div style="margin-top: 6px; text-align: right;">
                  <a href="${navUrl}" target="_blank" rel="noopener" style="font-size: 10.5px; color: #60A5FA; text-decoration: underline;">Directions ↗</a>
                </div>
              </div>
            `;

            const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupHtml);
            markersLayer.addLayer(marker);
          });

          if (userCoords && userCoords.lat && userCoords.lng) {
            bounds.push([userCoords.lat, userCoords.lng]);
            const userIcon = L.divIcon({
              className: 'user-loc-marker',
              html: `<div style="background: #3B82F6; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #FFF; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });
            L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
              .bindPopup('<strong>📍 Your Detected Location</strong>')
              .addTo(markersLayer);
          }

          if (bounds.length > 0) {
            try {
              lmap.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            } catch (e) {}
          } else {
            lmap.setView([6.5244, 3.3792], 11);
          }

          setTimeout(() => {
            if (lmap) lmap.invalidateSize();
          }, 200);

          return plottedCount;
        }
      };

      if (options.providers) {
        directoryHandle.updateProviders(options.providers, options.userCoords);
      }

      return directoryHandle;
    }
  };

  function escapeMapHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Export globally
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LokatorMapService;
  }
  if (typeof window !== 'undefined') {
    window.LokatorMapService = LokatorMapService;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
