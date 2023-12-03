const gridContainer = document.querySelector(".grid-container");
let cards;
let cardsTypes = [];
let firstCard, secondCard;
let lockBoard;

fetch("./cards.json")
  .then((res) => res.json())
  .then((data) => {
    cardsTypes = [...data];
  });

let maxPairs;
let pairsFound;
let timerInterval;
let seconds;
let minutes;
const timer = document.getElementById("timer");
const playBtn = document.getElementById("play-button");
const menuHtml = document.getElementById("menu");
const gameHtml = document.getElementById("game");
const restartBtn = document.getElementById("restart-button");
const easyTime = document.getElementById("easy-time");
const mediumTime = document.getElementById("medium-time");
const hardTime = document.getElementById("hard-time");
let localBestTimes = { easy: "Unset", medium: "Unset", hard: "Unset" };

updateLocalBestTimes();

// Start Game
playBtn.addEventListener("click", () => {
  menuHtml.style.display = "none";
  gameHtml.style.display = "flex";
  resetBoard();
  setPairAmount();
  let loop = maxPairs;

  restartBtn.disabled = true;
  pairsFound = 0;
  timer.innerText = "Time: 00:00";
  cards = [];
  cardsTypes = shuffleArray(cardsTypes);
  // max pairs in json file = 22, max possible pairs in game = 21
  for (let i = 0; i < loop; i++) {
    if (!cards.includes(cardsTypes[i])) {
      cards.push(cardsTypes[i]);
    } else {
      loop++;
    }
  }
  cards = shuffleArray([...cards, ...cards]);

  startTimer();
  generateCards();
});

restartBtn.addEventListener("click", restart);

function updateLocalBestTimes() {
  if (localStorage.getItem("localBestTimes")) {
    localBestTimes = JSON.parse(localStorage.getItem("localBestTimes"));
  }
  easyTime.innerText = `Best: ${localBestTimes.easy}`;
  mediumTime.innerText = `Best: ${localBestTimes.medium}`;
  hardTime.innerText = `Best: ${localBestTimes.hard}`;
}

function setPairAmount() {
  const difficult = document.getElementsByName("difficulty");
  for (let i = 0; i < difficult.length; i++) {
    if (difficult[i].checked) {
      switch (difficult[i].value) {
        case "Easy":
          maxPairs = 5;
          break;
        case "Medium":
          maxPairs = 10;
          break;
        case "Hard":
          maxPairs = 15;
          break;
      }
      break;
    }
  }
}

function startTimer() {
  seconds = 0;
  minutes = 0;
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  const timerTime = timer.innerText.split(": ")[1];
  switch (maxPairs) {
    case 5:
      if (localBestTimes.easy === "Unset") {
        localBestTimes.easy = timerTime;
      } else if (isBetterTime(timerTime, localBestTimes.easy)) {
        localBestTimes.easy = timerTime;
      }
      break;

    case 10:
      if (localBestTimes.medium === "Unset") {
        localBestTimes.medium = timerTime;
      } else if (isBetterTime(timerTime, localBestTimes.medium)) {
        localBestTimes.medium = timerTime;
      }
      break;

    case 15:
      if (localBestTimes.hard === "Unset") {
        localBestTimes.hard = timerTime;
      } else if (isBetterTime(timerTime, localBestTimes.hard)) {
        localBestTimes.hard = timerTime;
      }
      break;
  }

  localStorage.setItem("localBestTimes", JSON.stringify(localBestTimes));
  updateLocalBestTimes();

  function isBetterTime(current, local) {
    // input format "12:34"
    currentTime = current.split(":");
    localTime = local.split(":");
    if (
      currentTime[0] * 60 + +currentTime[1] <
      localTime[0] * 60 + +localTime[1]
    ) {
      return true;
    }
    return false;
  }
}

function updateTimer() {
  seconds++;
  if (seconds === 60) {
    seconds = 0;
    minutes++;
  }
  if (minutes >= 60) {
    minutes = 60;
    stopTimer();
    restartBtn.removeAttribute("disabled");
  }

  const formattedTime = padNumber(minutes) + ":" + padNumber(seconds);
  timer.innerText = `Time: ${formattedTime}`;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateCards() {
  for (let card of cards) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.setAttribute("data-name", card.name);
    cardElement.innerHTML = `
        <div class="front">
          <img class="front-image" src=${card.image.slice(1)} />
        </div>
        <div class="back"></div>
      `;
    const imageElement = cardElement.querySelector(".front-image");
    switch (maxPairs) {
      case 5:
        gridContainer.style.gridTemplateColumns = "repeat(5, 90px)";
        cardElement.style.height = "calc(90px / 2 * 3)";
        imageElement.style.width = "64px";
        imageElement.style.height = "64px";
        break;

      case 10:
        gridContainer.style.gridTemplateColumns = "repeat(5, 80px)";
        cardElement.style.height = "calc(80px / 2 * 3)";
        imageElement.style.width = "60px";
        imageElement.style.height = "60px";
        break;

      case 15:
        gridContainer.style.gridTemplateColumns = "repeat(6, 70px)";
        cardElement.style.height = "calc(70px / 2 * 3)";
        imageElement.style.width = "56px";
        imageElement.style.height = "56px";
        break;
    }
    gridContainer.appendChild(cardElement);
    cardElement.addEventListener("click", flipCard);
  }
}

function padNumber(number) {
  return number.toString().padStart(2, "0");
}

function flipCard() {
  if (lockBoard || this === firstCard) {
    return;
  }

  this.classList.add("flipped");

  if (!firstCard) {
    firstCard = this;
    return;
  }
  secondCard = this;
  lockBoard = true;

  checkForMatch();
}

function checkForMatch() {
  let isMatch = firstCard.dataset.name === secondCard.dataset.name;

  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  firstCard.classList.add("success");
  secondCard.classList.add("success");
  setTimeout(() => {
    firstCard.removeEventListener("click", flipCard);
    secondCard.removeEventListener("click", flipCard);
    resetBoard();
    pairsFound++;
    if (pairsFound === maxPairs) {
      stopTimer();
      restartBtn.removeAttribute("disabled");
    }
  }, 500);
}

function unflipCards() {
  firstCard.classList.add("fail");
  secondCard.classList.add("fail");
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    firstCard.classList.remove("fail");
    secondCard.classList.remove("fail");
    resetBoard();
  }, 1250);
}

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function restart() {
  menuHtml.style.display = "flex";
  gameHtml.style.display = "none";
  gridContainer.innerHTML = "";
}
