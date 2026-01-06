const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

if (getApps().length === 0) {
    initializeApp();
}

exports.db = getFirestore();
exports.storage = getStorage();