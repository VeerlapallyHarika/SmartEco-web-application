// Show splash screen
document.body.classList.add('splash-active');

// Hide splash screen after 3 seconds
setTimeout(() => {
  document.getElementById('splash-screen').style.display = 'none';
  document.body.classList.remove('splash-active'); // allow scrolling again
}, 3000);
