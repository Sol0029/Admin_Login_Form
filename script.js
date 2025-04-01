// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const hamburger = document.getElementById('hamburgerToggle');
    sidebar.classList.toggle('collapsed');
  
    if (sidebar.classList.contains('collapsed')) {
      hamburger.style.left = '5rem';
    } else {
      hamburger.style.left = '17rem';
    }
  }
  
  // Sidebar Active Highlight
  function setActiveSidebar(button) {
    const navButtons = document.querySelectorAll('#adminSidebar nav button');
    navButtons.forEach(btn => btn.classList.remove('bg-[#475569]'));
    button.classList.add('bg-[#475569]');
  }
  
  // Filter Sidebar
  function filterSidebar() {
    const input = document.getElementById("sidebarSearch").value.toLowerCase();
    const buttons = document.querySelectorAll("#sidebarNav button");
    buttons.forEach(button => {
      const label = button.getAttribute("data-label").toLowerCase();
      button.style.display = label.includes(input) ? "flex" : "none";
    });
  }
  
  // Toggle password visibility
  function togglePassword(index) {
    const passwordInput = document.getElementById(`password-${index}`);
    const toggleBtn = passwordInput.nextElementSibling;
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = 'Hide';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = 'Show';
    }
  }
  
  // Utility
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Core logic
  const loginPage = document.getElementById('loginPage');
  const adminDashboard = document.getElementById('adminDashboard');
  const userDashboard = document.getElementById('userDashboard');
  const loginForm = document.getElementById('loginForm');
  const createUserForm = document.getElementById('createUserForm');
  const userForm = document.getElementById('userForm');
  const userCreatedMsg = document.getElementById('userCreatedMsg');
  const userList = document.getElementById('userList');
  const userListContainer = document.getElementById('userListContainer');
  const loggedInUser = document.getElementById('loggedInUser');
  const dashboardRoleTitle = document.getElementById('dashboardRoleTitle');
  const totalCount = document.getElementById('totalCount');
  const roleCounts = document.getElementById('roleCounts');
  const editAdminForm = document.getElementById('editAdminForm');
  const adminEditForm = document.getElementById('adminEditForm');
  const adminUsernameInput = document.getElementById('adminUsername');
  const adminPasswordInput = document.getElementById('adminPassword');
  const adminUpdatedMsg = document.getElementById('adminUpdatedMsg');
  
  const db = firebase.firestore();
  
  let users = [
    { username: 'admin', password: 'admin123', role: 'admin' }
  ];
  
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
  
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    // Try Firebase Auth (admin)
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user.email === 'admin@agila.com') {
          loginPage.classList.add('hidden');
          adminDashboard.classList.remove('hidden');
        } else {
          alert('Unauthorized user!');
          firebase.auth().signOut();
        }
      })
      .catch(() => {
        // If Firebase Auth failed, try checking Firestore for other users
        db.collection("users")
          .where("username", "==", email)
          .where("password", "==", password)
          .get()
          .then((querySnapshot) => {
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              loginPage.classList.add('hidden');
              userDashboard.classList.remove('hidden');
              loggedInUser.textContent = userData.username;
              dashboardRoleTitle.textContent = `${capitalize(userData.role.replace('_', ' '))} Dashboard`;
            } else {
              alert("Login failed: Invalid credentials");
            }
          });
      });
  });  
  
  function showCreateUserForm() {
    createUserForm.classList.remove('hidden');
    userList.classList.add('hidden');
    editAdminForm.classList.add('hidden');
    userCreatedMsg.classList.add('hidden');
  }
  
  function showUserList() {
    createUserForm.classList.add('hidden');
    editAdminForm.classList.add('hidden');
    userList.classList.remove('hidden');
    updateUserList();
  }
  
  function showAdminEditForm() {
    createUserForm.classList.add('hidden');
    userList.classList.add('hidden');
    editAdminForm.classList.remove('hidden');
    const admin = users.find(u => u.role === 'admin');
    adminUsernameInput.value = admin.username;
    adminPasswordInput.value = admin.password;
    adminUpdatedMsg.classList.add('hidden');
  }
  
  adminEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const admin = users.find(u => u.role === 'admin');
    admin.username = adminUsernameInput.value;
    admin.password = adminPasswordInput.value;
    adminUpdatedMsg.classList.remove('hidden');
  });
  
  function updateUserList() {
    userListContainer.innerHTML = '';
    let roleCountMap = {};
  
    db.collection("users").get().then((querySnapshot) => {
      querySnapshot.forEach((doc, index) => {
        const user = doc.data();
        const userIndex = index + 1;
        const docId = doc.id; // ← Firestore document ID
  
        const div = document.createElement('div');
        div.className = 'border px-4 py-2 rounded-xl bg-white space-y-2';
  
        div.innerHTML = `
          <div>
            <label><strong>Username:</strong></label>
            <input class='border p-1 rounded w-full' value="${user.username}" id="username-${userIndex}" />
          </div>
          <div>
            <label><strong>Password:</strong></label>
            <div class="relative">
              <input type='password' class='border p-1 rounded w-full pr-10' value="${user.password}" id="password-${userIndex}" />
              <button type="button" class="absolute right-2 top-1 text-sm text-blue-600" onclick="togglePassword(${userIndex})">Show</button>
            </div>
          </div>
          <p><strong>Role:</strong> ${capitalize(user.role.replace('_', ' '))}</p>
          <div class="space-x-2">
            <button onclick="saveUser('${docId}', ${userIndex})" class="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600">Save</button>
            <button onclick="deleteUser('${docId}')" class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600">Delete</button>
          </div>
        `;
  
        userListContainer.appendChild(div);
        roleCountMap[user.role] = (roleCountMap[user.role] || 0) + 1;
      });
  
      totalCount.textContent = `Total Users: ${querySnapshot.size}`;
  
      roleCounts.innerHTML = '';
      for (const role in roleCountMap) {
        const p = document.createElement('p');
        p.textContent = `${capitalize(role.replace('_', ' '))}s: ${roleCountMap[role]}`;
        roleCounts.appendChild(p);
      }
    });
  }
  
  
  function saveUser(index) {
    const usernameField = document.getElementById(`username-${index}`);
    const passwordField = document.getElementById(`password-${index}`);
    if (usernameField && passwordField) {
      users[index].username = usernameField.value;
      users[index].password = passwordField.value;
      alert('User updated successfully!');
    }
  }
  
  function deleteUser(docId) {
  if (confirm('Are you sure you want to delete this user?')) {
    db.collection("users").doc(docId).delete()
      .then(() => {
        alert("User deleted successfully!");
        updateUserList();
      })
      .catch((error) => {
        alert("Failed to delete user: " + error.message);
      });
  }
}
  
  userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const newRole = document.getElementById('newRole').value;
  
    const newUser = { username: newUsername, password: newPassword, role: newRole };
    users.push(newUser);
  
    // Store in Firestore
    db.collection("users").add(newUser)
      .then(() => {
        userCreatedMsg.classList.remove('hidden');
        userForm.reset();
        updateUserList();
      })
      .catch((error) => {
        alert("Failed to save user: " + error.message);
      });
  });
  
  function logout() {
    adminDashboard.classList.add('hidden');
    userDashboard.classList.add('hidden');
    loginPage.classList.remove('hidden');
    loginForm.reset();
  }

  window.addEventListener('DOMContentLoaded', () => {
    updateUserList();
  });
  
  