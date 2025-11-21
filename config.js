const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

class Config {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return {};
  }

  save() {
    try {
      const dir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  isOnboarded() {
    return this.data.onboardingComplete === true;
  }

  setOnboarded(data) {
    console.log('💾 Setting onboarded data:', data);
    this.data.onboardingComplete = true;
    this.data.parentEmail = data.parentEmail;
    this.data.childName = data.childName;
    this.data.setupDate = new Date().toISOString();
    console.log('💾 Config data prepared:', this.data);
    this.save();
    console.log('✅ Config saved to disk');
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }
}

module.exports = new Config();

