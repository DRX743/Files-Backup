// Import the dependencies
require("dotenv").config();
const CronJob = require("cron").CronJob;
const Rsync = require("rsync");

// The value of process.platform will be:
// Windows: win32
// Mac: darwin
// Ubuntu: linux
const syncProgram = process.platform === "win32" ? "robocopy" : "rsync";

// Equivalent to writing `rsync -a example-source/ example-destination/` on terminal
rsync = new Rsync()
  .executable(syncProgram)
  // The -a flag means "archive" to say we are copying the full directory not just a file
  .flags("a")
  // Reads from the `.env` file in the project directory
  .source(process.env.SOURCE_DIR)
  .destination(process.env.DESTINATION_DIR); 

const job = new CronJob(
  // Run this function once every minute
  process.env.CRON_STRING,
  () => {
    rsync.execute((error, code, cmd) => {
      let result;
      if (error) {
        // Check README link for the list of rsync status codes
        result = `Code ${code} ${error?.message}`;
      } else {
        result = "Backup complete";
      }

      const currentDate = new Date().toISOString();
      // Write log to the console, or will be redirected to a nohup.out file if using nohup
      process.stdout.write(`${currentDate}: ${result}\n`);
    });
  },
  null,
  true,
  // Add time zone
  "Europe/Berlin"
);

// Start the cronjob
job.start();
  