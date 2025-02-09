// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDafFGXAPvJM25ukqNZSm4ra5S6ACCfbEs",
  authDomain: "money-4a855.firebaseapp.com",
  databaseURL: "https://money-4a855-default-rtdb.firebaseio.com",
  projectId: "money-4a855",
  storageBucket: "money-4a855.firebasestorage.app",
  messagingSenderId: "893595455729",
  appId: "1:893595455729:web:6ce038d127b3e2f3abd950",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// 🎭 Game Variables
let storyData = {};
let currentScene = "start"; // Default scene
let startTime = Date.now(); // Track time for leaderboard

// 🚀 Load Story Data from GitHub Raw API
async function loadStory() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/Abdul-Ahadexpo/Nano-Sites/refs/heads/main/NP.json"
    );
    storyData = await response.json();
    loadScene(currentScene);
  } catch (error) {
    document.getElementById("storyText").innerText = "Failed to load story.";
  }
}

// 🔄 Load Scene with Animation
function loadScene(scene) {
  if (!storyData[scene]) return;

  const { text, choices } = storyData[scene];
  const storyText = document.getElementById("storyText");
  const choicesDiv = document.getElementById("choices");
  const restartBtn = document.getElementById("restart");

  // Apply Fade-in Animation
  storyText.style.opacity = 0;
  setTimeout(() => {
    storyText.innerText = text;
    storyText.style.opacity = 1;
  }, 200);

  choicesDiv.innerHTML = ""; // Clear previous choices

  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.innerText = choice.text;
    button.className =
      "block w-full px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transform transition duration-200 hover:scale-105";
    button.onclick = () => makeChoice(choice.next);
    choicesDiv.appendChild(button);
  });

  // Show restart button at the end
  if (scene === "end") {
    restartBtn.classList.remove("hidden");
    restartBtn.style.opacity = 0;
    setTimeout(() => (restartBtn.style.opacity = 1), 300);
  } else {
    restartBtn.classList.add("hidden");
  }

  // Save progress to Firebase
  db.ref(`users/${localStorage.getItem("userId")}/progress`).set({
    currentScene: scene,
  });
}

// 🎭 Make a Choice
function makeChoice(nextScene) {
  currentScene = nextScene;
  loadScene(nextScene);

  // If game reaches an ending, store progress in Firebase
  if (nextScene === "end") {
    const name = localStorage.getItem("userName"); // Use name from localStorage
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // Time in seconds
    const ending = "Ending 1"; // Change this according to the ending

    // Save leaderboard data
    db.ref("leaderboard").push({
      name: name,
      time: timeTaken,
      ending: ending,
    });

    // Show leaderboard
    showLeaderboard();
  }
}

// 🔁 Restart Game (Reset Firebase Progress)
document.getElementById("restart").addEventListener("click", () => {
  currentScene = "start";
  db.ref(`users/${localStorage.getItem("userId")}/progress`).remove(); // Clear Firebase progress for the current user
  loadScene(currentScene);
  startTime = Date.now(); // Restart the timer
});

// 📡 Load Saved Progress
const userId = localStorage.getItem("userId");
if (userId) {
  // If user is logged in, get progress
  db.ref(`users/${userId}/progress`).once("value", (snapshot) => {
    if (snapshot.exists()) {
      currentScene = snapshot.val().currentScene || "start"; // If progress exists, load it
    } else {
      currentScene = "start"; // If no progress exists, set it to start
    }
    loadStory();
  });
} else {
  // If no userId, ask for name and create userId
  const userName = prompt("Enter your name: ");
  const userId = Date.now().toString(); // Unique user ID based on timestamp
  localStorage.setItem("userName", userName); // Store user's name in localStorage
  localStorage.setItem("userId", userId); // Store userId in localStorage

  db.ref(`users/${userId}`).set({
    name: userName,
    progress: {
      currentScene: "start",
    },
  });

  loadStory();
}

// 🎭 Show Leaderboard
function showLeaderboard() {
  db.ref("leaderboard")
    .orderByChild("time")
    .limitToFirst(5)
    .once("value", (snapshot) => {
      const leaderboard = snapshot.val();
      const leaderboardList = document.getElementById("leaderboardList");

      if (leaderboard) {
        let leaderboardHtml =
          "<h2 class='text-xl font-bold mt-4'>Leaderboard</h2>";

        for (const key in leaderboard) {
          const player = leaderboard[key];
          leaderboardHtml += `<li class="text-lg">${player.name} - ${
            player.ending
          } - ${player.time.toFixed(2)}s</li>`;
        }

        leaderboardList.innerHTML = leaderboardHtml;
      } else {
        leaderboardList.innerHTML =
          "<li class='text-lg'>No data available yet.</li>"; // Message if no data exists
      }

      document.getElementById("leaderboard").classList.remove("hidden");
    });
}
