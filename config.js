const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Config {
  constructor() {
    this.data = {};
    this.configFile = null;
  }

  getConfigFile() {
    if (!this.configFile) {
      this.configFile = path.join(app.getPath('userData'), 'config.json');
    }
    return this.configFile;
  }

  load() {
    try {
      const configFile = this.getConfigFile();
      if (fs.existsSync(configFile)) {
        this.data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        return this.data;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return {};
  }

  save() {
    try {
      const configFile = this.getConfigFile();
      const dir = path.dirname(configFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(configFile, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  isOnboarded() {
    this.load(); // Ensure data is loaded
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

