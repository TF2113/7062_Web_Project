document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("progress").forEach((progressBar, index) => {
      let grade = parseInt(progressBar.value, 10);
      let color;
  
      if (grade >= 70) {
        color = "#4CAF50"; // Green
      } else if (grade >= 50) {
        color = "#FFC107"; // Yellow
      } else {
        color = "#F44336"; // Red
      }
  
      // Apply color using CSS variable
      progressBar.style.setProperty("--progress-bar-color", color);
    });
  });
  