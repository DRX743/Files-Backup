// Import the dependencies
require("dotenv").config();
const CronJob = require("cron").CronJob;
const Rsync = require("rsync");
const https = require("https");

process.title = "node-backup-script";

// Will be true if there is a Discord WEBHOOK_ID set in the `.env` file
const useDiscord = !!process.env.WEBHOOK_ID;

const options = {
  hostname: "discord.com",
  path: `/api/webhooks/${process.env.WEBHOOK_ID}`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

// process.platform will be:
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
  // corn string syntax
  process.env.CRON_STRING,
  () => {
    rsync.execute((error, code, cmd) => {
      let result;
      if (error) {
        result = `Code ${code} ${error?.message}`;
      } else {
        result = "Backup complete";
      }

      const currentDate = new Date().toISOString();
      // Write log to the console, or will be redirected to a
      // nohup.out file if using nohup
      process.stdout.write(`${currentDate}: ${result}\n`);

      // Only sends the request if WEBHOOK_ID is defined
      if (useDiscord) {
        // Send the request to Discord with the configured options
        const req = https.request(options, (res) => {
          // do nothing with Discord response
        });

        // Discord requires a { content: string } shape for posting messages
        req.write(
          JSON.stringify({
            content: result,
          })
        );

        req.end();
      }
    });
  },
  null,
  true,
  // Add a time zone
  "Europe/Berlin"
);

// Start the cronjob
job.start();