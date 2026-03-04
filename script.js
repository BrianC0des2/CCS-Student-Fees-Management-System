// Login validation
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("user-email").value;
    const password = document.getElementById("user-password").value;
    
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }
    
    // Navigate to index.html
    window.location.href = "index.html";
  });
}

let arrow = document.querySelectorAll(".arrow");
for (var i = 0; i < arrow.length; i++) {
  arrow[i].addEventListener("click", (e)=>{
 let arrowParent = e.target.parentElement.parentElement;//selecting main parent of arrow
 arrowParent.classList.toggle("showMenu");
  });
}

let sidebar = document.querySelector(".sidebar");
let sidebarBtn = document.querySelector(".bx-menu");
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", ()=>{
    sidebar.classList.toggle("close");
  });
}
