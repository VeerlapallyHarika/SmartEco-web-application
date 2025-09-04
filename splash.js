// Show splash screen for 3 seconds, then hide it
window.addEventListener("load", () => {
  const splash = document.getElementById("splash-screen");
  const app = document.getElementById("app");

  setTimeout(() => {
    splash.style.display = "none";   // hide splash
    app.hidden = false;              // show app
    document.body.classList.remove("splash-active"); // allow scrolling again
  }, 3000); // 3000 = 3 seconds
});
