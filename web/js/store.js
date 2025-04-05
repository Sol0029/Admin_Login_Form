const db = firebase.firestore();

// Save a new user to Firestore
function saveUserToFirestore(newUser, onSuccess, onError) {
  db.collection("users").add(newUser)
    .then(() => {
      if (onSuccess) onSuccess();
    })
    .catch((error) => {
      if (onError) onError(error);
    });
}

// Archive a user by moving to 'archived_users' and deleting from 'users'
function archiveUserInFirestore(userData, docId, onSuccess, onError) {
  db.collection("archived_users").add(userData).then(() => {
    db.collection("users").doc(docId).delete().then(() => {
      if (onSuccess) onSuccess();
    }).catch((error) => {
      if (onError) onError(error);
    });
  }).catch((error) => {
    if (onError) onError(error);
  });
}

// Restore a user from 'archived_users' to 'users'
function restoreArchivedUser(docId, onSuccess, onError) {
  const archiveRef = db.collection("archived_users").doc(docId);
  archiveRef.get().then(doc => {
    if (doc.exists) {
      const userData = doc.data();
      db.collection("users").add(userData).then(() => {
        archiveRef.delete().then(() => {
          if (onSuccess) onSuccess();
        });
      });
    }
  }).catch((error) => {
    if (onError) onError(error);
  });
}

// Permanently delete a user from 'archived_users'
function permanentlyDeleteArchivedUser(docId, onSuccess, onError) {
  db.collection("archived_users").doc(docId).delete().then(() => {
    if (onSuccess) onSuccess();
  }).catch((error) => {
    if (onError) onError(error);
  });
}
