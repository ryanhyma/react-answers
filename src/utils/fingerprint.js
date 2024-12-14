// hack until we talk to Canada.ca search
function getBrowserFingerprint() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      deviceMemory: navigator.deviceMemory || 'N/A',
      hardwareConcurrency: navigator.hardwareConcurrency,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      indexedDB: !!window.indexedDB,
      webGLVendor: getWebGLInfo().vendor,
      webGLRenderer: getWebGLInfo().renderer,
      plugins: Array.from(navigator.plugins).map(p => p.name),
      mimeTypes: Array.from(navigator.mimeTypes).map(m => m.type),
      doNotTrack: navigator.doNotTrack,
      touchSupport: {
        maxTouchPoints: navigator.maxTouchPoints || 0,
        touchEvent: 'ontouchstart' in window,
      },
      canvasFingerprint: getCanvasFingerprint(),
      audioFingerprint: getAudioFingerprint(),
    };
  }
  
  function getWebGLInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { vendor: 'N/A', renderer: 'N/A' };
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      };
    } catch (e) {
      return { vendor: 'N/A', renderer: 'N/A' };
    }
  }
  
  function getCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Browser Fingerprint', 4, 17);
    return canvas.toDataURL();
  }
  
  function getAudioFingerprint() {
    try {
      const audioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
      const oscillator = audioContext.createOscillator();
      const compressor = audioContext.createDynamicsCompressor();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;
      oscillator.connect(compressor);
      compressor.connect(audioContext.destination);
      oscillator.start(0);
      return new Promise(resolve => {
        audioContext.startRendering().then(buffer => {
          const fingerprint = buffer.getChannelData(0).slice(0, 100).toString();
          resolve(fingerprint);
        });
      });
    } catch (e) {
      return Promise.resolve('N/A');
    }
  }
  
  // Collect and export the fingerprint
  (async () => {
    const fingerprint = await getBrowserFingerprint();
    console.log(fingerprint);
    
    const blob = new Blob([JSON.stringify(fingerprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'browser_fingerprint.json';
    a.click();
    URL.revokeObjectURL(url);
  })();
  