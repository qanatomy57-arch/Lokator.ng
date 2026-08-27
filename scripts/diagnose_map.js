const http = require('http');
const fs = require('fs');
const path = require('path');

// Let's test the pages using puppeteer or chromium
(async () => {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    try {
      puppeteer = require('playwright').chromium;
    } catch (e2) {
      console.log('No puppeteer or playwright in local node_modules. Testing via static DOM analysis.');
    }
  }

  if (puppeteer) {
    console.log('Testing pages via browser...');
  }
})();
