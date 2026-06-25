import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function runBackup() {
  console.log("Initializing Firebase client SDK with custom Database ID for secure backup...");
  
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("Firebase config file not found!");
    return;
  }
  
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  
  // CRITICAL: We must specify the custom database ID as configured!
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = ["products", "blogs", "posts", "messages"];
  const report = {};

  for (const colName of collections) {
    try {
      console.log(`Fetching collection "${colName}" via Firebase SDK...`);
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const documents = [];
      
      snapshot.forEach(docSnap => {
        documents.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      const filePath = path.join(backupDir, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), "utf-8");
      console.log(`Successfully backed up ${documents.length} documents from "${colName}" to ${filePath}`);
      report[colName] = documents.length;
    } catch (err) {
      console.error(`Failed to back up collection "${colName}":`, err);
      report[colName] = 0;
    }
  }

  // Backup profile
  try {
    console.log("Fetching settings/profile via Firebase SDK...");
    const docRef = doc(db, "settings", "profile");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      const filePath = path.join(backupDir, "settings_profile.json");
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`Successfully backed up settings/profile to ${filePath}`);
      report["settings/profile"] = 1;
    } else {
      console.log("No settings/profile document found in Firestore.");
      report["settings/profile"] = 0;
    }
  } catch (err) {
    console.error("Failed to back up settings/profile:", err);
    report["settings/profile"] = 0;
  }

  const reportPath = path.join(backupDir, "backup_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log("\nBackup complete! Summary report:");
  console.log(JSON.stringify(report, null, 2));
  
  process.exit(0);
}

runBackup().catch(err => {
  console.error("Fatal backup error:", err);
  process.exit(1);
});
