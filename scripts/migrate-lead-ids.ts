// Migration script to generate leadIds for existing leads
// Run with: npx tsx scripts/migrate-lead-ids.ts

// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Load .env file from project root
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log("✅ Loaded environment variables from .env");
} else {
  console.warn("⚠️  .env file not found, using system environment variables");
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  console.error("   Please ensure .env file contains MONGODB_URI");
  process.exit(1);
}

// Now import modules that depend on env vars using dynamic import
async function runMigration() {
  const { connectMongoDB } = await import("../src/libs/dbConfig");
  const Lead = (await import("../src/models/Lead")).default;
  const mongoose = (await import("mongoose")).default;

  async function generateUniqueLeadId(LeadModel: typeof Lead): Promise<number> {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      // Generate a random number between 10000 and 999999 (5-6 digits)
      const candidateId = Math.floor(Math.random() * (999999 - 10000 + 1)) + 10000;
      
      // Check if this ID already exists
      const existingLead = await LeadModel.findOne({ leadId: candidateId });
      if (!existingLead) {
        return candidateId;
      }
      
      attempts++;
    }
    
    // Fallback: use timestamp-based ID if random generation fails
    const timestampId = Date.now() % 900000 + 10000; // Ensure 5-6 digits
    return timestampId;
  }

  try {
    console.log("🔄 Connecting to database...");
    await connectMongoDB();
    
    console.log("📊 Fetching all leads without leadId...");
    const leadsWithoutId = await Lead.find({ leadId: { $exists: false } });
    console.log(`Found ${leadsWithoutId.length} leads without leadId`);
    
    if (leadsWithoutId.length === 0) {
      console.log("✅ All leads already have leadIds!");
      await mongoose.connection.close();
      process.exit(0);
    }
    
    console.log("🔢 Generating leadIds...");
    let successCount = 0;
    let errorCount = 0;
    
    for (const lead of leadsWithoutId) {
      try {
        const leadId = await generateUniqueLeadId(Lead);
        // Use updateOne to bypass full document validation
        // This only updates the leadId field without validating other fields
        await Lead.updateOne(
          { _id: lead._id },
          { $set: { leadId } },
          { runValidators: false } // Skip validation to avoid issues with invalid status values
        );
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`  ✅ Processed ${successCount} leads...`);
        }
      } catch (error) {
        console.error(`  ❌ Error updating lead ${lead._id}:`, error);
        errorCount++;
      }
    }
    
    console.log("\n✅ Migration completed!");
    console.log(`   Successfully updated: ${successCount} leads`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} leads`);
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
}

runMigration();

