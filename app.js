const video = document.getElementById('camera');
const startBtn = document.getElementById('start-scan');
const itemName = document.getElementById('item-name');
const itemCategory = document.getElementById('item-category');
const itemDisposal = document.getElementById('item-disposal');
const pointsCount = document.getElementById('points-count');
const progressBar = document.getElementById('progress-bar');
const historyList = document.getElementById('history-list');

let points = 0;
let scannedItems = [];

// Load items data
let itemsData = {};
fetch('data/items.json')
  .then(response => response.json())
  .then(data => itemsData = data)
  .catch(err => console.error('Error loading items data:', err));

// Start camera
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then(stream => video.srcObject = stream)
  .catch(err => console.error(err));

startBtn.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  const scan = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        const item = code.data.trim();
        if (itemsData[item]) {
          displayItem(item);
        } else {
          alert("Item not recognized!");
        }
      }
    }
    requestAnimationFrame(scan);
  };
  scan();
});

function displayItem(item) {
  itemName.textContent = item;
  itemCategory.textContent = itemsData[item].category;
  itemDisposal.textContent = itemsData[item].disposal;

  if (!scannedItems.includes(item)) {
    scannedItems.push(item);
    points += 10;
    pointsCount.textContent = points;
    progressBar.value = points;

    const li = document.createElement('li');
    li.textContent = item;
    historyList.appendChild(li);
  }
}
