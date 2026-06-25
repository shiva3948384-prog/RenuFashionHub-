import fs from "fs";
import path from "path";

const projectId = "ai-studio-applet-webapp-644f0";
const databaseId = "ai-studio-06f9cdf8-bcdb-4985-98dd-f7d34d6cf66c";
const apiKey = "AIzaSyDoT5LpW7SWxNpEMe_7f-I8jZtuI3S-E7I";
const baseRESTUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

// Helper to convert Firestore format to standard JSON
function convertValue(value) {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return parseFloat(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    if (!value.arrayValue.values) return [];
    return value.arrayValue.values.map(val => convertValue(val));
  }
  if ('mapValue' in value) {
    if (!value.mapValue.fields) return {};
    const obj = {};
    for (const [k, v] of Object.entries(value.mapValue.fields)) {
      obj[k] = convertValue(v);
    }
    return obj;
  }
  return null;
}

function documentToJson(doc) {
  const nameParts = doc.name.split('/');
  const docId = nameParts[nameParts.length - 1];
  const fields = doc.fields || {};
  const data = { id: docId };
  for (const [key, value] of Object.entries(fields)) {
    data[key] = convertValue(value);
  }
  return data;
}

async function fetchCollection(collectionName) {
  console.log(`Fetching collection: ${collectionName}...`);
  try {
    const url = `${baseRESTUrl}/${collectionName}?pageSize=300&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching collection ${collectionName}: ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    if (!data.documents) {
      console.log(`Collection ${collectionName} is empty.`);
      return [];
    }
    return data.documents.map(documentToJson);
  } catch (error) {
    console.error(`Failed to fetch ${collectionName}:`, error);
    return [];
  }
}

async function runBackup() {
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = ["products", "blogs", "posts", "messages"];
  const report = {};

  for (const col of collections) {
    const docs = await fetchCollection(col);
    const filePath = path.join(backupDir, `${col}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf-8");
    console.log(`Successfully backed up ${docs.length} documents from "${col}" to ${filePath}`);
    report[col] = docs.length;
  }

  // Also fetch the specific profile document from settings collection
  console.log("Fetching profile settings document...");
  try {
    const profileUrl = `${baseRESTUrl}/settings/profile?key=${apiKey}`;
    const response = await fetch(profileUrl);
    if (response.ok) {
      const doc = await response.json();
      const profileData = documentToJson(doc);
      const filePath = path.join(backupDir, "settings_profile.json");
      fs.writeFileSync(filePath, JSON.stringify(profileData, null, 2), "utf-8");
      console.log(`Successfully backed up settings/profile to ${filePath}`);
      report["settings/profile"] = 1;
    } else {
      console.warn("Could not fetch settings/profile document:", response.statusText);
      report["settings/profile"] = 0;
    }
  } catch (error) {
    console.error("Failed to fetch settings/profile:", error);
    report["settings/profile"] = 0;
  }

  const reportPath = path.join(backupDir, "backup_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log("\nBackup report created at:", reportPath);
  console.log(JSON.stringify(report, null, 2));
}

runBackup();
