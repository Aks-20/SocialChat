const fs = require("fs");
const path = require("path");

console.log("🔧 Creating .env file...");

const envPath = path.join(__dirname, ".env");
const templatePath = path.join(__dirname, "env-template.txt");

if (fs.existsSync(envPath)) {
  console.log("⚠️  .env file already exists!");
  process.exit(0);
}

if (!fs.existsSync(templatePath)) {
  console.log("❌ env-template.txt not found!");
  process.exit(1);
}

try {
  fs.copyFileSync(templatePath, envPath);
  console.log("✅ .env file created successfully!");
  console.log(
    "📝 Please edit the .env file with your actual configuration values."
  );
  console.log("   - Set up your database connection string");
  console.log("   - Configure your email settings");
  console.log("   - Set up AWS S3 credentials (optional for now)");
} catch (error) {
  console.error("❌ Error creating .env file:", error.message);
  process.exit(1);
}
