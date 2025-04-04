// firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyDunUPyhoXUO0D4bvc8p2GNTyBbhLI_Cko",
    authDomain: "login-form-a8c9a.firebaseapp.com",
    projectId: "login-form-a8c9a",
    storageBucket: "login-form-a8c9a.firebasestorage.app",
    messagingSenderId: "350983039673",
    appId: "1:350983039673:web:87e9746dac89e394ea8968"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Enable persistent login
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  