// script.js (updated to use store.js)

// Sidebar Toggle
function toggleSidebar() {
  const sidebar = document.getElementById("adminSidebar");
  const hamburger = document.getElementById("hamburgerToggle");
  sidebar.classList.toggle("collapsed");
  hamburger.style.left = sidebar.classList.contains("collapsed")
    ? "5rem"
    : "17rem";
}

// Sidebar Active Highlight
function setActiveSidebar(button) {
  const navButtons = document.querySelectorAll("#adminSidebar nav button");
  navButtons.forEach((btn) => btn.classList.remove("bg-[#475569]"));
  button.classList.add("bg-[#475569]");
}

function handleAgilaClick() {
  const navButtons = document.querySelectorAll("#adminSidebar nav button");
  navButtons.forEach((btn) => btn.classList.remove("bg-[#475569]"));
  showDashboardSection();
}

// Function to filter sidebar nav items based on search input
function filterSidebar() {
  const input = document.getElementById("sidebarSearch").value.toLowerCase();
  const buttons = document.querySelectorAll("#sidebarNav button");
  buttons.forEach((button) => {
    const label = button.getAttribute("data-label").toLowerCase();
    button.style.display = label.includes(input) ? "flex" : "none";
  });
}

function togglePassword(button) {
  const passwordInput = button.previousElementSibling;
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
  button.textContent = passwordInput.type === "password" ? "Show" : "Hide";
}

function showDashboardSection() {
  createUserForm.classList.add("hidden");
  userList.classList.add("hidden");
  editAdminForm.classList.add("hidden");
  document.getElementById("archiveSection").classList.add("hidden");
  adminDashboard.classList.remove("hidden");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const loginPage = document.getElementById("loginPage");
const adminDashboard = document.getElementById("adminDashboard");
const userDashboard = document.getElementById("userDashboard");
const loginForm = document.getElementById("loginForm");
const createUserForm = document.getElementById("createUserForm");
const userForm = document.getElementById("userForm");
const userCreatedMsg = document.getElementById("userCreatedMsg");
const userList = document.getElementById("userList");
const userListContainer = document.getElementById("userListContainer");
const loggedInUser = document.getElementById("loggedInUser");
const dashboardRoleTitle = document.getElementById("dashboardRoleTitle");
const totalCount = document.getElementById("totalCount");
const roleCounts = document.getElementById("roleCounts");
const editAdminForm = document.getElementById("editAdminForm");
const adminEditForm = document.getElementById("adminEditForm");
const adminUsernameInput = document.getElementById("adminUsername");
const adminPasswordInput = document.getElementById("adminPassword");
const adminUpdatedMsg = document.getElementById("adminUpdatedMsg");
const filterDepartment = document.getElementById("filterDepartment");
const filterYearLevel = document.getElementById("filterYearLevel");
const searchUser = document.getElementById("searchUser");

document.getElementById("sidebarTitle").addEventListener("click", () => {
  handleAgilaClick();
});

// Updated event listeners
filterDepartment.addEventListener("change", triggerUserListUpdate);
filterYearLevel.addEventListener("change", triggerUserListUpdate);
searchUser.addEventListener("input", triggerUserListUpdate);

function triggerUserListUpdate() {
  db.collection("users")
    .orderBy("username")
    .get()
    .then((querySnapshot) => {
      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      updateUserList(users);
    });
}

let users = [{ username: "admin", password: "admin123", role: "admin" }];

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (typeof firebase === "undefined") {
    alert("Firebase is not available.");
    return;
  }

  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      if (user.email === "admin@agila.com") {
        loginPage.classList.add("hidden");
        adminDashboard.classList.remove("hidden");
        document.title = "Admin Dashboard";
      } else {
        alert("Unauthorized user!");
        firebase.auth().signOut();
      }
    })
    .catch(() => {
      db.collection("users")
        .where("username", "==", email)
        .where("password", "==", password)
        .get()
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            localStorage.setItem("agilaUser", JSON.stringify(userData));

            const userRef = db.collection("users").doc(userDoc.id);
            userRef.update({
              status: "active",
              lastSeen: firebase.firestore.Timestamp.now(),
            });

            // Start heartbeat
            window.currentUserId = userDoc.id;
            window.heartbeatInterval = setInterval(() => {
              userRef.update({ lastSeen: firebase.firestore.Timestamp.now() });
            }, 30000);

            loginPage.style.display = "none";
            userDashboard.style.display = "flex";
            adminDashboard.style.display = "none";
            loggedInUser.textContent = userData.username;
            dashboardRoleTitle.textContent = `${capitalize(
              userData.role.replace("_", " ")
            )} Dashboard`;
            document.title = "User";
          } else {
            alert("Login failed: Invalid credentials");
          }
        });
    });
});

userForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const newUser = {
    username: document.getElementById("newUsername").value,
    password: document.getElementById("newPassword").value,
    role: newRoleSelect.value,
    dateCreated: new Date().toLocaleDateString(),
    status: "inactive",
  };

  if (newUser.role === "program_head" || newUser.role === "teacher") {
    newUser.department = departmentSelect.value;
  }

  if (newUser.role === "student") {
    newUser.section = studentSection.value;
    newUser.yearLevel = yearLevelSelect.value;
  }

  users.push(newUser);
  saveUserToFirestore(
    newUser,
    () => {
      userCreatedMsg.classList.remove("hidden");
      userForm.reset();
      departmentField.classList.add("hidden");
      studentFields.classList.add("hidden");
    },
    (error) => {
      alert("Failed to save user: " + error.message);
    }
  );
});

function logout() {
  const currentUserEmail = loggedInUser.textContent;

  if (window.heartbeatInterval) {
    clearInterval(window.heartbeatInterval);
  }

  if (currentUserEmail && currentUserEmail !== "admin") {
    db.collection("users")
      .where("username", "==", currentUserEmail)
      .get()
      .then((snapshot) => {
        if (!snapshot.empty) {
          const docId = snapshot.docs[0].id;
          db.collection("users").doc(docId).update({
            status: "inactive",
            lastSeen: null,
          });
        }
      });
  }

  firebase
    .auth()
    .signOut()
    .then(() => {
      localStorage.removeItem("agilaUser");

      // ✅ Reset visibility and display styles for all views
      loginPage.classList.remove("hidden");
      loginPage.style.display = "block"; // <-- Important fix
      adminDashboard.classList.add("hidden");
      adminDashboard.style.display = "none";
      userDashboard.classList.add("hidden");
      userDashboard.style.display = "none";

      loginForm.reset();
      document.title = "AGILA - Login";
    })
    .catch((error) => {
      alert("Logout failed: " + error.message);
    });
}

function showCreateUserForm() {
  createUserForm.classList.remove("hidden");
  userList.classList.add("hidden");
  editAdminForm.classList.add("hidden");
  document.getElementById("archiveSection").classList.add("hidden");
  userCreatedMsg.classList.add("hidden");
}

function showUserList() {
  createUserForm.classList.add("hidden");
  editAdminForm.classList.add("hidden");
  document.getElementById("archiveSection").classList.add("hidden");
  userList.classList.remove("hidden");
}

function showAdminEditForm() {
  createUserForm.classList.add("hidden");
  userList.classList.add("hidden");
  document.getElementById("archiveSection").classList.add("hidden");
  editAdminForm.classList.remove("hidden");
  const admin = users.find((u) => u.role === "admin");
  adminUsernameInput.value = admin.username;
  adminPasswordInput.value = admin.password;
  adminUpdatedMsg.classList.add("hidden");
}

function showArchive() {
  createUserForm.classList.add("hidden");
  userList.classList.add("hidden");
  editAdminForm.classList.add("hidden");
  adminDashboard.classList.remove("hidden");
  document.getElementById("archiveSection").classList.remove("hidden");
  loadArchivedUsers();
}

function loadArchivedUsers() {
  const container = document.getElementById("archivedListContainer");
  container.innerHTML = "";
  db.collection("archived_users")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "border px-4 py-2 rounded-xl bg-white space-y-2";
        div.innerHTML = `
        <p><strong>Username:</strong> ${data.username}</p>
        <p><strong>Role:</strong> ${capitalize(data.role.replace("_", " "))}</p>
        <div class="space-x-2">
          <button onclick="restoreUser('${
            doc.id
          }')" class="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">Restore</button>
          <button onclick="permanentlyDeleteUser('${
            doc.id
          }')" class="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700">Delete Permanently</button>
        </div>
      `;
        container.appendChild(div);
      });
    });
}

let currentPage = 1;
const rowsPerPage = 10;

function updateUserList(users) {
  const departmentFilter = filterDepartment.value.toLowerCase();
  const yearFilter = filterYearLevel.value.toLowerCase();
  const query = searchUser.value.toLowerCase();

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.username.toLowerCase().includes(query) ||
      (user.department || "").toLowerCase().includes(query) ||
      (user.section || "").toLowerCase().includes(query) ||
      (user.yearLevel || "").toLowerCase().includes(query);
    const matchDept =
      !departmentFilter ||
      (user.department || "").toLowerCase() === departmentFilter;
    const matchYear =
      !yearFilter || (user.yearLevel || "").toLowerCase() === yearFilter;
    return matchSearch && matchDept && matchYear;
  });

  userListContainer.innerHTML = "";
  const table = document.createElement("table");
  table.className = "min-w-full table-auto text-left text-sm";
  table.innerHTML = `
    <thead class="bg-blue-700 text-white">
      <tr>
        <th class="px-4 py-2">Username</th>
        <th class="px-4 py-2">Password</th>
        <th class="px-4 py-2">Date Created</th>
        <th class="px-4 py-2">Role</th>
        <th class="px-4 py-2">Department</th>
        <th class="px-4 py-2">Section</th>
        <th class="px-4 py-2">Year Level</th>
        <th class="px-4 py-2">Status</th>
        <th class="px-4 py-2">Action</th>
      </tr>
    </thead>
    <tbody id="userTableBody"></tbody>
  `;
  userListContainer.appendChild(table);

  const tbody = table.querySelector("#userTableBody");

  filteredUsers.forEach((user) => {
    const tr = document.createElement("tr");
    tr.className = "border-b";
    const date = user.dateCreated || new Date().toLocaleDateString();
    const isActive =
      user.lastSeen?.seconds &&
      Date.now() - user.lastSeen.seconds * 1000 < 60000;
    const status = isActive
      ? '<span class="text-green-500 font-medium">Active</span>'
      : '<span class="text-gray-500 font-medium">Inactive</span>';

    tr.innerHTML = `
      <td class="px-4 py-2"><span contenteditable="false" id="username-${
        user.id
      }">${user.username}</span></td>
      <td class="px-4 py-2"><span contenteditable="false" id="password-${
        user.id
      }">${user.password}</span></td>
      <td class="px-4 py-2 whitespace-nowrap"><span class="inline-block w-28 truncate">${date}</span></td>
      <td class="px-4 py-2">${capitalize(user.role.replace("_", " "))}</td>
      <td class="px-4 py-2 text-center align-middle whitespace-nowrap">
        <span contenteditable="false" id="dept-${user.id}" class="block w-full">
          ${user.department || ""}
        </span>
      </td>
      <td class="px-4 py-2 whitespace-nowrap"><span contenteditable="false" id="section-${
        user.id
      }" class="inline-block w-24 truncate">${user.section || ""}</span></td>
      <td class="px-4 py-2 whitespace-nowrap"><span contenteditable="false" id="year-${
        user.id
      }" class="inline-block w-24 truncate">${user.yearLevel || ""}</span></td>
      <td class="px-4 py-2">${status}</td>
      <td class="px-4 py-2">
        <div class="flex space-x-2">
          <button onclick="enableEditing('${user.id}', '${
      user.role
    }')" class="text-blue-600 hover:underline">Edit</button>
          <button onclick="deleteUser('${
            user.id
          }')" class="text-red-600 hover:underline">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function enableEditing(userId, role) {
  const usernameSpan = document.getElementById(`username-${userId}`);
  const passwordSpan = document.getElementById(`password-${userId}`);
  const deptSpan = document.getElementById(`dept-${userId}`);
  const sectionSpan = document.getElementById(`section-${userId}`);
  const yearSpan = document.getElementById(`year-${userId}`);

  usernameSpan.contentEditable = true;
  passwordSpan.contentEditable = true;
  if (role === "program_head" || role === "teacher")
    deptSpan.contentEditable = true;
  if (role === "student") {
    sectionSpan.contentEditable = true;
    yearSpan.contentEditable = true;
  }

  usernameSpan.focus();

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  saveBtn.className = "text-green-600 hover:underline ml-2";
  saveBtn.onclick = () => {
    const updateData = {
      username: usernameSpan.textContent.trim(),
      password: passwordSpan.textContent.trim(),
    };
    if (role === "program_head" || role === "teacher")
      updateData.department = deptSpan.textContent.trim();
    if (role === "student") {
      updateData.section = sectionSpan.textContent.trim();
      updateData.yearLevel = yearSpan.textContent.trim();
    }
    db.collection("users")
      .doc(userId)
      .update(updateData)
      .then(() => {
        alert("User updated.");
        triggerUserListUpdate();
      });
  };

  const actionCell =
    usernameSpan.parentElement.parentElement.querySelector("td:last-child");
  actionCell.appendChild(saveBtn);
}

window.addEventListener("DOMContentLoaded", () => {
  if (typeof firebase === "undefined") {
    alert(
      "Firebase failed to load. Please check firebase.js and script order."
    );
    return;
  }

  // Check if already logged in
  firebase.auth().onAuthStateChanged((user) => {
    loginPage.style.display = "none";
    loginPage.classList.remove("hidden");
    adminDashboard.style.display = "none";
    userDashboard.style.display = "none";

    if (user) {
      if (user.email === "admin@agila.com") {
        adminDashboard.style.display = "flex";
        loginPage.style.display = "none";
        document.title = "Admin";
      } else {
        // Try localStorage first
        const savedUser = localStorage.getItem("agilaUser");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          loggedInUser.textContent = userData.username;
          dashboardRoleTitle.textContent = `${capitalize(
            userData.role.replace("_", " ")
          )} Dashboard`;
          userDashboard.style.display = "flex";
          document.title = "User";
        } else {
          // If no localStorage, get user from Firestore using their email
          db.collection("users")
            .where("username", "==", user.displayName) // Assumes email was used as username
            .get()
            .then((snapshot) => {
              if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                localStorage.setItem("agilaUser", JSON.stringify(userData));
                loggedInUser.textContent = userData.username;
                dashboardRoleTitle.textContent = `${capitalize(
                  userData.role.replace("_", " ")
                )} Dashboard`;
                userDashboard.style.display = "flex";
                document.title = "User";
              } else {
                alert("No user data found. Logging out.");
                firebase.auth().signOut();
              }
            });
        }
      }
    } else {
      loginPage.style.display = "block";
      document.title = "Login";
    }
  });

  // Load user list in real-time
  db.collection("users")
    .orderBy("username")
    .onSnapshot((querySnapshot) => {
      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      updateUserList(users);
    });
});

const newRoleSelect = document.getElementById("newRole");
const departmentField = document.getElementById("departmentField");
const departmentSelect = document.getElementById("departmentSelect");
const studentFields = document.getElementById("studentFields");
const studentSection = document.getElementById("studentSection");
const yearLevelSelect = document.getElementById("yearLevelSelect");

newRoleSelect.addEventListener("change", () => {
  const selectedRole = newRoleSelect.value;
  departmentField.classList.add("hidden");
  studentFields.classList.add("hidden");

  if (selectedRole === "program_head" || selectedRole === "teacher") {
    departmentField.classList.remove("hidden");
  } else if (selectedRole === "student") {
    studentFields.classList.remove("hidden");
  }
});
