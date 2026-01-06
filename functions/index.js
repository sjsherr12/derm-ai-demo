const { setGlobalOptions } = require('firebase-functions/v2/options');

// Set global options for cost control
setGlobalOptions({ maxInstances: 100 });

// Export cloud functions
const functions = [
    'createReferralCodeUsageNotification',
    'createSavedProductOnSaleNotification',
    'createUserAccount',
    'deleteUserAccount',
    'onDiagnosisDocumentCreated',
    'onUserDocumentCreated',
    'processFaceScan',
    'redeemDueReferrals',
    'redeemUserReferrals',
    'revenueCatIAPCancellationEventWebhook',
    'revenueCatInitialPurchaseEventWebhook',
    'sendDueNotifications'
];

functions.forEach(name => {
    exports[name] = require(`./src/${name}`)[name];
});