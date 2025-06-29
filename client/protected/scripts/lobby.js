const socket = io();
const joinBtn = document.getElementById("joinBtn");
let roomId = null;


window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get('room');
  if (roomFromUrl) {
    document.getElementById('roomInput').value = roomFromUrl.toUpperCase();
  }
});

joinBtn.addEventListener ("click",()=>{
  

   roomId = document.getElementById("roomInput").value.trim();
  if (!roomId) {
    // Generate random room ID if not entered
    roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    alert("Created Room: " + roomId);
  }

  const  url  = new URL(window.location);
  url.searchParams.set("roomId", roomId);
window.history.replaceState(null, null, url.toString());

     document.getElementById('roomMenu').style.display = 'none';
    //redirecting   to game.html
    window.location.href = `game.html?room=${roomId}`;
    
  });

  window.addEventListener('DOMContentLoaded', async()=>{
    try{
      const res  = await fetch('/api/userinfo');
      if (!res.ok) {throw new Error('Failed to fetch user info');}
       const data = await res.json();
      document.getElementById("userNameDisplay").textContent = data.name;

      //update stats:
      const statValues = document.querySelectorAll('#playerStats .stat-value');

statValues[0].textContent = data.tokens;
statValues[1].textContent = data.xpLevel;
statValues[2].textContent = data.gamesPlayed;
statValues[3].textContent = data.wins;


    }
    catch(error){
      console.error("Error fetching user info:", error);
      alert("Failed to load user info. Please try again later.");
    }
  })

document.getElementById('logoutBtn').addEventListener('click',async()=>{
  await fetch ('/logout', {method: 'POST'});
  window.location.href = './login.html';
})