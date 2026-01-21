const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// HTTP Trigger Example
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase Functions!");
});

// Auth Trigger Example (Uncomment to use)
/*
exports.onUserCreated = functions.auth.user().onCreate((user) => {
  functions.logger.info("New user created", user.email);
  // Perform setup actions here
});
*/
