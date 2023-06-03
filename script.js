import { db } from './firebase.js';
import { collection, getDocs, doc, updateDoc, addDoc, setDoc, getDoc, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const BASE_CO2_EMISSIONS = {
  travel: 0,
  holidayTravel: 0,
  householdConsumption: 0,
  wasteDisposal: 0,
  other: 0,
};

let playerScores = [];
let playerName = null;

function calculateCO2Emissions(inputs) {
  const co2Emissions = { ...BASE_CO2_EMISSIONS };
  for (const [key, value] of Object.entries(inputs)) {
    co2Emissions[key] = parseInt(value);
  }
  return co2Emissions;
}

function calculateScore(co2Emissions) {
  let score = 0;
  for (const [key, value] of Object.entries(co2Emissions)) {
    score -= value;
  }
  return score;
}

function setupSnapshotListener() {
  const peopleRef = collection(db, 'people');
  const q = query(peopleRef, orderBy('score', 'desc'), limit(3));

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        const data = change.doc.data();
        updatePlayerScore(data.name, data.score);
      }
    });
    updateScores();
  });
}


async function updatePlayerScore(playerName, score) {
  for (let i = 0; i < playerScores.length; i++) {
    const player = playerScores[i];
    if (player.name === playerName) {
      player.score = score;

      // Update score in Firestore
      const playerDoc = doc(db, "people", playerName);
      await updateDoc(playerDoc, { score: score });

      return;
    }
  }

  // Add new player to playerScores array
  playerScores.push({ name: playerName, score: score });

  // Add new player to Firestore
  const playerDoc = doc(db, "people", playerName);
  await setDoc(playerDoc, { name: playerName, score: score });
}

//function updateScores() {
//  // Sort without prioritizing current player
//  playerScores.sort((a, b) => b.score - a.score);
//  console.log(playerScores)
//
//  const leaderboardBody = document.querySelector('.leaderboard tbody');
//  leaderboardBody.innerHTML = '';
//
//  let rank = 1;
//  let playerIncluded = false;
//  for (let i = 0; i < playerScores.length; i++) {
//    const player = playerScores[i];
//    if (player.name === playerName) {
//      playerIncluded = true;
//    }
//    const row = `
//      <tr>
//        <td>${playerIncluded && i >= 5 ? "-" : rank++}</td>
//        <td>${player.name}</td>
//        <td>${player.score}</td>
//      </tr>
//    `;
//    leaderboardBody.insertAdjacentHTML('beforeend', row);
//    if(rank > 6 && playerIncluded) break;
//    if(rank > 5 && !playerIncluded) break;
//  }
//}

function updateScores() {
  // Sort without prioritizing current player
  playerScores.sort((a, b) => b.score - a.score);

  const leaderboardBody = document.querySelector('.leaderboard tbody');
  leaderboardBody.innerHTML = '';

  let playerIncluded = false;
  let playerIndex;

  for (let i = 0; i < playerScores.length; i++) {
    const player = playerScores[i];
    const rank = i + 1; // Rank is equal to index + 1

    let playerClass = '';
    if (player.name === playerName) {
      playerIncluded = true;
      playerIndex = i;
      playerClass = 'highlight'; // Set class for current player
    }

    if (rank <= 5 || player.name === playerName) {
      const row = `
        <tr class="${playerClass}">
          <td>${rank}</td>
          <td>${player.name}</td>
          <td>${player.score}</td>
        </tr>
      `;

      leaderboardBody.insertAdjacentHTML('beforeend', row);
    }
  }

  // If player is not included in top 5, add them at the beginning
  if (!playerIncluded && playerName) {
    const playerScore = playerScores.find(player => player.name === playerName);
    const row = `
      <tr class="highlight">
        <td>${playerIndex + 1}</td>
        <td>${playerName}</td>
        <td>${playerScore ? playerScore.score : 0}</td>
      </tr>
    `;

    leaderboardBody.insertAdjacentHTML('afterbegin', row);
  }
}
const logoutButton = document.getElementById('logoutButton');

logoutButton.addEventListener('click', () => {
  // Clear the playerName from localStorage
  localStorage.removeItem('playerName');
  playerName = null;

  // Clear the playerScores array
  playerScores = [];

  // Ask for a new player name
  getName();
});


function purchaseBooster(boosterName) {
  alert(`Congratulations! You have purchased the ${boosterName} booster.`);
}

async function getName() {
  let storedName = localStorage.getItem('playerName');

  if (storedName) {
    playerName = storedName;
    const docRef = doc(db, "people", playerName);

    // Check if document already exists
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // If document exists, load it into playerScores array
      playerScores.push({ name: playerName, score: docSnap.data().score || 0 });
    } else {
      // If it does not exist, add to Firestore
      addToFirestore(playerName);
      // Add to playerScores array with a default score of 0
      playerScores.push({ name: playerName, score: 0 });
    }
  } else {
    playerName = prompt('Please enter your name:');
    localStorage.setItem('playerName', playerName);
    const docRef = doc(db, "people", playerName);

    // Check if document already exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      // If it does not exist, add to Firestore
      addToFirestore(playerName);
    }
    // Add to playerScores array with a default score of 0
    playerScores.push({ name: playerName, score: 0 });
  }

await loadScoresFromFirestore();

  // Update the scores on the leaderboard
  updateScores();

}

// Get player name
getName();

// Add event listener to form
const form = document.querySelector('form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const inputs = Object.fromEntries(new FormData(form));
  const co2Emissions = calculateCO2Emissions(inputs);
  const score = calculateScore(co2Emissions);
  await updatePlayerScore(playerName, score);
  await loadScoresFromFirestore(); // load leaderboard from Firestore
  updateScores();
  form.reset();
});

// Add event listener to booster buttons
const boosterButtons = document.querySelectorAll('.booster-purchase');
boosterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const boosterName = button.getAttribute('data-booster');
    purchaseBooster(boosterName);
  });
});

async function updateName() {
  const docRef = doc(db, 'people', 'idk'); // replace 'document-id' with the ID of the document you want to update

  await updateDoc(docRef, {
    name: 'jeffery'
  });
}

//updateName();

async function addToFirestore(name) {
  const docRef = doc(db, "people", name);
  await setDoc(docRef, { name: name });


}

async function loadScoresFromFirestore() {
  const q = query(collection(db, "people"), orderBy("score", "desc"), limit(5));
  const querySnapshot = await getDocs(q);

  // Add them to playerScores
  querySnapshot.forEach((doc) => {
    const data = doc.data();

    // Check if this player is already in playerScores
    const existingPlayerIndex = playerScores.findIndex(player => player.name === data.name);

    if (existingPlayerIndex !== -1) {
      // Update the existing player's score
      playerScores[existingPlayerIndex].score = data.score;
    } else {
      // Add the new player to playerScores
      playerScores.push({ name: data.name, score: data.score });
    }
  });
  // Now playerScores should have the top 3 plus the current player
  // (the current player might also be in the top 3)
}

  // Now playerScores should have the top 3 plus the current player
  // (the current player might also be in the top 3)
